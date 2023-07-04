// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// _____  _                     _               ______                   ______  _  _             _ ______
///  ___|| |                   (_)              | ___ \                  | ___ \| |(_)           | || ___ \
//\ `--. | |  ___   ___  _ __   _  _ __    __ _ | |_/ /  __ _  ___   ___ | |_/ /| | _  _ __    __| || |_/ /  ___  __  __
// `--. \| | / _ \ / _ \| '_ \ | || '_ \  / _` || ___ \ / _` |/ __| / _ \| ___ \| || || '_ \  / _` || ___ \ / _ \ \ \/ /
///\__/ /| ||  __/|  __/| |_) || || | | || (_| || |_/ /| (_| |\__ \|  __/| |_/ /| || || | | || (_| || |_/ /| (_) | >  <
//\____/ |_| \___| \___|| .__/ |_||_| |_| \__, |\____/  \__,_||___/ \___|\____/ |_||_||_| |_| \__,_|\____/  \___/ /_/\_\
//                      | |                __/ |
//                      |_|               |___/

    error NotYetOpeningTime(uint256 currentTime);
    error NotYetTradingTime(uint256 currentTime);
    error AlreadyClaimed();
    error InvalidProof();

interface SleepingBase {
    function safeMint(address to, uint256[] memory tokenIds, string[] memory uris) external;
}

contract SleepingBaseBlindBox is ERC1155, Ownable, Pausable {
    // This event is triggered whenever a call to #claim succeeds.
    event Claimed(uint256 index, address account, uint256 amount);

    // This is a packed array of booleans.
    mapping(uint256 => uint256) private claimedBitMap;
    bytes32 public immutable merkleRoot;
    // This is a compressed value of the turn-on time and transition time
    uint256 public openAndSalesTime;
    address public mintNewNft;
    uint256 public total;

    constructor(
        uint256 openAndSalesTime_,
        string memory tokenUri_,
        address mintNewNft_,
        bytes32 merkleRoot_,
        uint256 total_
    )ERC1155(tokenUri_) {
        openAndSalesTime = openAndSalesTime_;
        merkleRoot = merkleRoot_;
        mintNewNft = mintNewNft_;
        total = total_;
    }

    /**
    * @dev Set open and sales time
    * @notice Only used by Owner
    * @param openAndSalesTime_ Open time and sales time
    */
    function setOpenAndSalesTime(uint256 openAndSalesTime_)
    public
    onlyOwner {
        openAndSalesTime = openAndSalesTime_;
    }

    /**
    * @dev Lock transaction interface
    * @notice Only used by Owner
    */
    function pause()
    public
    onlyOwner {
        _pause();
    }

    /**
    * @dev Unlock transaction interface
    * @notice Only used by Owner
    */
    function unpause()
    public
    onlyOwner {
        _unpause();
    }

    /**
    * @dev Additional method
    * @notice Called only on exception
    * @param account Recipient address
    * @param amount Receive quantity
    */
    function mint(address account, uint256 amount)
    public
    onlyOwner {
        _mint(account, total, amount, "");
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data)
    internal
    whenNotPaused
    override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /**
     * @dev See {IERC1155-safeTransferFrom}.
     * @notice Increased unlock transaction time and lockable
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256,
        uint256 amount,
        bytes memory data)
    public
    virtual
    override {
        (, uint256 salesTime) = _getIdAndRarity(openAndSalesTime);
        if (block.timestamp <= salesTime) revert NotYetTradingTime(block.timestamp);
        super.safeTransferFrom(from, to, total, amount, data);
    }

    /**
     * @dev See {IERC1155-safeBatchTransferFrom}.
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override {}

    function _getIdAndRarity(uint256 data)
    private
    pure
    returns (uint256 openTime, uint128 salesTime) {
        openTime = uint256(uint128(data >> 128));
        salesTime = uint128(data);
    }

    // ==================== Blind box related ====================





    /**
    * @dev Check if the index is picked up
    * @notice Only returns whether it can be picked up
    * @param index Merkle index location
    * @return can receive
    */
    function isClaimed(uint256 index)
    public
    view
    returns (bool){
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _setClaimed(uint256 index)
    private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }

    /**
    * @dev Use a Merkle claim
    * @notice Only supports single pick-up
    * @param index Merkle index location
    * @param amount Quantity available
    * @param merkleProof Merkel Leaf Proof
    */
    function claim(
        uint256 index,
        uint256 amount,
        bytes32[] calldata merkleProof)
    public {
        if (isClaimed(index)) revert AlreadyClaimed();

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, _msgSender(), amount));
        if (!MerkleProof.verify(merkleProof, merkleRoot, node)) revert InvalidProof();

        // Mark it claimed and send the token.
        _setClaimed(index);
        _mint(_msgSender(), total, amount, "");
        emit Claimed(index, _msgSender(), amount);
    }

    /**
    * @dev Open blind box
    * @notice It cannot be called before the time is up,
    *         and the interface can be locked
    * @param amount Open blind box quantity
    * @param tokenIds Array of token ids to be issued
    * @param uris Array of token uri to be issued
    */
    function openBox(
        uint256 amount,
        uint256[] memory tokenIds,
        string[] memory uris)
    public
    whenNotPaused {
        (uint256 openingTime,) = _getIdAndRarity(openAndSalesTime);
        if (block.timestamp <= openingTime) revert NotYetOpeningTime(block.timestamp);

        // Destroy the blind box first
        super._burn(_msgSender(), total, amount);
        for (uint256 i; i < tokenIds.length; ++i) {
            SleepingBase(mintNewNft).safeMint(_msgSender(), tokenIds, uris);
        }
    }
}

