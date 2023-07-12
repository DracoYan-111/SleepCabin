// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./extensions/BlindBoxPermit.sol";

    error NotYetOpeningTime(uint256 currentTime);
    error NotYetTradingTime(uint256 currentTime);
    error AlreadyClaimed();
    error InvalidProof();

interface SleepingBase {
    function safeMint(address to, uint256[] calldata tokenIds, string[] calldata uris) external;
}

contract SleepingBaseBlindBox is ERC721, BlindBoxPermit, ERC721Enumerable, Pausable, Ownable {
    using Counters for Counters.Counter;
    /* ========== EVENTS ========== */

    event Claimed(uint256 index, address account, uint256 amount);
    event OpenBox(uint256 openTime, address userAddress, uint256 amount);

    /* ========== STATE VARIABLES ========== */

    bytes32 public merkleRoot;
    // This is a compressed value of the turn-on time and transition time
    string private  _onlyTokenUri;
    uint256 private openAndSalesTime;
    Counters.Counter private _tokenIdCounter;
    SleepingBase public immutable sleepingBase;
    mapping(uint256 => uint256) private claimedBitMap;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        SleepingBase sleepingBase_,
        uint256 openAndSalesTime_,
        string memory tokenUri_,
        bytes32 merkleRoot_,
        address verifier_
    )
    ERC721("SleepingBaseBlindBox", "")
    BlindBoxPermit(verifier_) {
        openAndSalesTime = openAndSalesTime_;
        sleepingBase = sleepingBase_;
        _onlyTokenUri = tokenUri_;
        merkleRoot = merkleRoot_;
        _transferOwnership(tx.origin);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /**
    * @dev Set merkle root
    * @notice Only used by Owner
    * @param merkleRoot_ Merkle root prove
    */
    function setMerkleRoot(bytes32 merkleRoot_)
    public
    onlyOwner {
        merkleRoot = merkleRoot_;
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
    * @dev Additional method
    * @notice Called only on exception
    * @param to Recipient address
    */
    function mint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _mint(to, tokenId);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

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
    public
    whenNotPaused {
        if (isClaimed(index))
            revert AlreadyClaimed();

        // Verify the merkle proof.
        if (!MerkleProof.verify(
            merkleProof,
            merkleRoot,
            keccak256(abi.encodePacked(index, _msgSender(), amount))
        ))
            revert InvalidProof();

        // Mark it claimed and send the token.
        _setClaimed(index);
        for (uint256 i; i < amount;) {
        unchecked{
            mint(_msgSender());
            ++i;
        }
        }
        emit Claimed(index, _msgSender(), amount);
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
        (uint256 openingTime,) = _getOpenAndSalesTime(openAndSalesTime);
        if (block.timestamp < openingTime)
            revert NotYetOpeningTime(block.timestamp);

        super.openBoxPermit(amount, tokenIds, uris, deadline, v, r, s);
        for (uint256 i; i < amount;) {
            // Destroy the blind box first
            super._burn(tokenOfOwnerByIndex(_msgSender(), balanceOf(_msgSender()) - 1));
            ++i;
        }

        sleepingBase.safeMint(_msgSender(), tokenIds, uris);

        emit OpenBox(block.timestamp, _msgSender(), amount);
    }

    function _setClaimed(uint256 index)
    private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }

    /* ========== VIEWS FUNCTION ========== */

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

    function _getOpenAndSalesTime(uint256 data)
    private
    pure
    returns (uint256 openTime, uint128 salesTime) {
    unchecked{
        openTime = uint256(uint128(data >> 128));
        salesTime = uint128(data);
    }
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
        (, uint256 salesTime) = _getOpenAndSalesTime(openAndSalesTime);
        if (block.timestamp < salesTime)
            revert NotYetTradingTime(block.timestamp);

        super._transfer(from, to, tokenId);
    }
}
