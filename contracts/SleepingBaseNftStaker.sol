// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Context.sol";

// +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+
// |S| |l| |e| |e| |p| |i| |n| |g| |B| |a| |s| |e| |N| |f| |t| |S| |t| |a| |k| |e| |r|
// +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+

interface SleepingBase {
    function getIdAndAttributes(uint256 onlyTokenId) external pure returns (uint256 rarityValue, uint256 moodValue, uint256 luckyValue, uint256 comfortValue);
}

    error ProvidedRewardHigh(uint256 rewardRate);
    error CannotWithdraw(address userAddress, uint256 tokenId);
    error CannotStakeFree(uint256 tokenId);

contract SleepingBaseNftStaker is Context, ERC721Holder, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== EVENTS ========== */

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    /* ========== MODIFIERS ========== */

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    modifier onlyRewardsDistribution() {
        require(_msgSender() == rewardsDistribution, "Caller is not RewardsDistribution contract");
        _;
    }

    /* ========== STATE VARIABLES ========== */

    IERC20 public immutable rewardsToken;
    IERC721 public immutable stakingToken;

    uint256 public rewardRate = 0;
    uint256 public periodFinish = 0;
    uint256 public rewardsDuration = 60 days;

    uint256 public lastUpdateTime;
    address public rewardsDistribution;
    uint256 public rewardPerTokenStored;

    uint256[] public weightFactor;

    mapping(address => uint256) public rewards;
    mapping(address => uint256) public nftBalances;
    mapping(address => uint256) public userRewardPerTokenPaid;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    // Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) private _ownedTokensIndex;
    // Mapping from owner to list of owned token IDs
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;


    /* ========== CONSTRUCTOR ========== */

    constructor(
        uint256[] memory weightFactor_,
        address _rewardsToken,
        address _stakingToken
    )  {
        weightFactor = weightFactor_;
        rewardsToken = IERC20(_rewardsToken);
        stakingToken = IERC721(_stakingToken);
        rewardsDistribution = _msgSender();
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint256[] calldata tokenIds)
    external
    nonReentrant
    updateReward(_msgSender()) {
        uint256 amount = getNftRaritySum(tokenIds);
    unchecked{
        _totalSupply += amount;
        _balances[_msgSender()] += amount;
    }

        for (uint256 i; i < tokenIds.length;) {
            stakingToken.safeTransferFrom(_msgSender(), address(this), tokenIds[i]);
            _addTokenToOwnerEnumeration(_msgSender(), tokenIds[i]);
        unchecked{
            ++i;
        }
            emit Staked(_msgSender(), tokenIds[i]);
        }

    }

    function withdraw(uint256[] calldata tokenIds)
    public
    nonReentrant
    updateReward(_msgSender()) {
        uint256 amount = getNftRaritySum(tokenIds);

        _totalSupply -= amount;
        _balances[_msgSender()] -= amount;

        for (uint256 i; i < tokenIds.length;) {
            if (_ownedTokens[_msgSender()][_ownedTokensIndex[tokenIds[i]]] != tokenIds[i])
                revert CannotWithdraw(_msgSender(), tokenIds[i]);

            stakingToken.safeTransferFrom(address(this), _msgSender(), tokenIds[i]);
            _removeTokenFromOwnerEnumeration(_msgSender(), tokenIds[i]);
        unchecked{
            ++i;
        }
            emit Withdrawn(_msgSender(), tokenIds[i]);
        }
    }

    function getReward()
    public
    nonReentrant
    updateReward(_msgSender()) {
        uint256 reward = rewards[_msgSender()];
        if (reward > 0) {
            rewards[_msgSender()] = 0;
            rewardsToken.safeTransfer(_msgSender(), reward);
            emit RewardPaid(_msgSender(), reward);
        }
    }

    //    function exit() external {
    //        withdraw(_balances[_msgSender()]);
    //        getReward();
    //    }

    /**
     * @dev Private function to add a token to this extension's ownership-tracking data structures.
     * @param to address representing the new owner of the given token ID
     * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
     */
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId)
    private {
    unchecked{
        uint256 length = nftBalances[to];
        _ownedTokens[to][length] = tokenId;
        _ownedTokensIndex[tokenId] = length;
        nftBalances[to] += 1;
    }
    }

    /**
     * @dev Private function to remove a token from this extension's ownership-tracking data structures. Note that
     * while the token is not assigned a new owner, the `_ownedTokensIndex` mapping is _not_ updated: this allows for
     * gas optimizations e.g. when performing a transfer operation (avoiding double writes).
     * This has O(1) time complexity, but alters the order of the _ownedTokens array.
     * @param from address representing the previous owner of the given token ID
     * @param tokenId uint256 ID of the token to be removed from the tokens list of the given address
     */
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId)
    private {
        // To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).
        uint256 lastTokenIndex = nftBalances[from] - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

            _ownedTokens[from][tokenIndex] = lastTokenId;
            // Move the last token to the slot of the to-delete token
            _ownedTokensIndex[lastTokenId] = tokenIndex;
            // Update the moved token's index
        }

        // This also deletes the contents at the last position of the array
        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
        nftBalances[from] -= 1;
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(uint256 reward)
    external
    onlyRewardsDistribution
    updateReward(address(0)) {
        if (block.timestamp > periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = reward + leftover / rewardsDuration;
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint balance = rewardsToken.balanceOf(address(this));
        if (!(rewardRate <= balance / rewardsDuration))
            revert ProvidedRewardHigh(rewardRate);

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(reward);
    }

    /* ========== VIEWS ========== */
    //
    //    function totalSupply() external view returns (uint256) {
    //        return _totalSupply;
    //    }

    //    function balanceOf(address account) external view returns (uint256) {
    //        return _balances[account];
    //    }

    function lastTimeRewardApplicable()
    public
    view
    returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken()
    public
    view
    returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
        rewardPerTokenStored + (
        lastTimeRewardApplicable() - (lastUpdateTime) * (rewardRate) * (1e18) / (_totalSupply)
        );
    }

    function earned(address account)
    public
    view
    returns (uint256) {
        return _balances[account] * (rewardPerToken() - (userRewardPerTokenPaid[account])) / (1e18) + (rewards[account]) / (1000);
    }

    function getRewardForDuration()
    external
    view
    returns (uint256) {
        return rewardRate / rewardsDuration;
    }

    function getNftRaritySum(uint256[] calldata tokenIds)
    private
    view
    returns (uint256 raritySum){
        for (uint256 i = 0; i < tokenIds.length;) {
            (uint256 rarityValue,
            uint256 moodValue,
            uint256 luckyValue,
            uint256 comfortValue) = SleepingBase(address(stakingToken)).getIdAndAttributes(tokenIds[i]);

            if (rarityValue == 1)
                revert CannotStakeFree(tokenIds[i]);

        unchecked {
            uint256 onlyRarityValue = rarityValue * (25) * (1000);
            uint256 onlyMoodValue = ((moodValue * (1000)) * (weightFactor[0]));
            uint256 onlyLuckyValue = ((luckyValue * (1000)) * (weightFactor[1]));
            uint256 onlyComfortValue = ((comfortValue * (1000)) * (weightFactor[2]));

            raritySum += onlyRarityValue + onlyMoodValue + onlyLuckyValue + onlyComfortValue;
            ++i;
        }
        }
    }

    function getUserTokenData(address userAddress)
    public
    view
    returns (uint256[] memory tokenIdArray){
        uint256 amount = nftBalances[userAddress];
        tokenIdArray = new uint256[](amount);
        for (uint256 i; i < amount;) {
        unchecked{
            tokenIdArray[i] = _ownedTokens[userAddress][i];
            ++i;
        }
        }
    }
}