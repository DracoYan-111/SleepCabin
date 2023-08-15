// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./extensions/BlindBoxPermit.sol";

// +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+
// |S| |l| |e| |e| |p| |i| |n| |g| |B| |a| |s| |e| |B| |l| |i| |n| |d| |B| |o| |x|
// +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+

    error NotYetOpeningTime(uint256 currentTime);
    error NotYetTradingTime(uint256 currentTime);

interface SleepingBase {
    function safeMint(address to, uint256[] calldata tokenIds, string[] calldata uris) external;
}

contract SleepingBaseBlindBox is ERC721, ERC721Enumerable, Pausable, Ownable, BlindBoxPermit {
    using Counters for Counters.Counter;

    /* ========== EVENTS ========== */

    event UserMint(address userAddress, uint256[] tokenIds, bool isFreeMint);
    event OpenBox(uint256 openTime, address userAddress, uint256 amount);

    /* ========== STATE VARIABLES ========== */

    // This is a compressed value of the turn-on time and transition time
    string private  _onlyTokenUri;
    uint256 private _openAndSalesTime;
    address public accountsReceivable;
    SleepingBase public immutable sleepingBase;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        SleepingBase sleepingBase_,
        uint256 openAndSalesTime_,
        string memory tokenUri_,
        address verifier_
    )
    ERC721("SleepingBaseBlindBox", "")
    BlindBoxPermit(verifier_) {
        _openAndSalesTime = openAndSalesTime_;
        sleepingBase = sleepingBase_;
        _onlyTokenUri = tokenUri_;
    }

    /* ========== RESTRICTED FUNCTIONS ========== */
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev user mint blind box permit
    * @notice It cannot be called before the time is up,
    *         and the interface can be locked
    * @param packed  uint256 paymentAmount,bool isFreeMint
    * @param tokenIds Array of token ids to be issued
    * @param deadline Maximum effective time
    */
    function userMintPermit(
        uint256 packed,
        uint256 [] calldata tokenIds,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
    public
    override
    payable
    whenNotPaused {

        super.userMintPermit(packed, tokenIds, deadline, v, r, s);

        (uint256 paymentAmount,uint128 isFreeMint) = _unpackedValue(packed);

        if (isFreeMint == 0)
            paymentAmount != msg.value ?
            revert("unsatisfiedPayment") : safeTransferETH(accountsReceivable, paymentAmount);


        for (uint256 i; i < tokenIds.length;) {
            _safeMint(_msgSender(), tokenIds[i]);
        unchecked{++i;}
        }
    }

    /**
    * @dev Open blind box permit
    * @notice It cannot be called before the time is up,
    *         and the interface can be locked
    * @param amount Open blind box quantity
    * @param tokenIds Array of token ids to be issued
    * @param uris Array of token uri to be issued
    * @param deadline Maximum effective time
    */
    function openBoxPermit(
        uint256 amount,
        uint256[] calldata tokenIds,
        string[] calldata uris,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s)
    public
    override
    whenNotPaused {
        (uint256 openingTime,) = _unpackedValue(_openAndSalesTime);
        if (block.timestamp < openingTime)
            revert NotYetOpeningTime(block.timestamp);

        super.openBoxPermit(amount, tokenIds, uris, deadline, v, r, s);
        for (uint256 i; i < amount;) {
            // Destroy the blind box first
            super._burn(tokenOfOwnerByIndex(_msgSender(), balanceOf(_msgSender()) - 1));
        unchecked{++i;}
        }

        sleepingBase.safeMint(_msgSender(), tokenIds, uris);

        emit OpenBox(block.timestamp, _msgSender(), amount);
    }

    /* ========== VIEWS FUNCTION ========== */

    function _unpackedValue(uint256 data)
    private
    pure
    returns (uint256 valueOne, uint128 valueTwo) {
    unchecked{
        valueOne = uint256(uint128(data >> 128));
        valueTwo = uint128(data);
    }
    }

    function safeTransferETH(address to, uint value) internal {
        (bool success,) = to.call{value : value}(new bytes(0));
        if (!success)
            revert("ETH_TRANSFER_FAILED");
    }

    /* ========== OVERRIDE FUNCTIONS ========== */

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
    internal
    whenNotPaused
    override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
    * @dev See {IERC721Metadata-tokenURI}.
    */
    function tokenURI(uint256 tokenId)
    public
    view
    override
    returns (string memory) {
        super._requireMinted(tokenId);

        return _onlyTokenUri;
    }

    /**
    * @dev Transfers `tokenId` from `from` to `to`.
     *  As opposed to {transferFrom}, this imposes no restrictions on msg.sender.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     *
     * Emits a {Transfer} event.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId)
    internal
    override {
        (, uint256 salesTime) = _unpackedValue(_openAndSalesTime);
        if (block.timestamp < salesTime)
            revert NotYetTradingTime(block.timestamp);

        super._transfer(from, to, tokenId);
    }
}