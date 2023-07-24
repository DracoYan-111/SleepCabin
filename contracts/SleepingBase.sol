// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC721, ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+
// |S| |l| |e| |e| |p| |i| |n| |g| |B| |a| |s| |e|
// +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+

contract SleepingBase is ERC721, Pausable, AccessControl, ERC721Enumerable, ERC721URIStorage {
    /* ========== EVENTS ========== */

    event DurabilityReduction(uint256 tokenId, uint256 oldDurability, uint256 newDurability);

    /* ========== STATE VARIABLES ========== */

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(uint256 => uint256) private tokenAttributes;

    /* ========== CONSTRUCTOR ========== */

    constructor() ERC721("SleepingBase", "") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);}


    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @dev Pause token
    */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
    * @dev Unpause token
    */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
    * @dev Mint token
    * @param to Address to
    * @param tokenIds Token id
    * @param uris Token new uri
    */
    function safeMint(
        address to,
        uint256[] calldata tokenIds,
        string[] calldata uris)
    external
    onlyRole(MINTER_ROLE) {
        for (uint256 i; i < tokenIds.length;) {
            (uint256 onlyTokenId) = _getTokenId(tokenIds[i]);
            if (_exists(onlyTokenId) && ownerOf(onlyTokenId) == to) safeBurn(onlyTokenId);
            _safeMint(to, onlyTokenId);
            _setTokenURI(onlyTokenId, uris[i]);
        unchecked {
            tokenAttributes[onlyTokenId] = tokenIds[i];
            ++i;
        }
        }
    }

    /**
    * @dev Burn token
    * @param tokenId Token id
    */
    function safeBurn(uint256 tokenId)
    public
    onlyRole(MINTER_ROLE) {
        super._burn(tokenId);
    }

    /**
    * @dev Set token uri
    * @param tokenId Token id
    * @param uri Token new uri
    */
    function setTokenUri(uint256 tokenId, string calldata uri)
    public
    onlyRole(MINTER_ROLE)
    {
        _setTokenURI(tokenId, uri);
    }

    /**
    * @dev Set token durable
    * @param tokenId Token id
    * @param newDurability Token new durability
    */
    function setTokenDurability(uint256 tokenId, uint256 newDurability)
    public
    onlyRole(MINTER_ROLE)
    {
        uint256[6] memory ages;
        (ages[0]) = _getTokenId(tokenAttributes[tokenId]);
        (ages[1],
        ages[2],
        ages[3],
        ages[4],
        ages[5]) = getIdAndAttributes(tokenId);

        emit DurabilityReduction(tokenId, ages[5], newDurability);

        ages[5] = newDurability;
        tokenAttributes[tokenId] = getTokenIdGeneration(ages);

    }
    /* ========== VIEWS FUNCTION ========== */

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
    internal
    whenNotPaused
    override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function getUserTokenData(address userAddress)
    public
    view
    returns (uint256[] memory, string[] memory){
        uint256 amount = super.balanceOf(userAddress);
        uint256[] memory tokenIdArray = new uint256[](amount);
        string[] memory tokenUriArray = new string[](amount);
        for (uint256 i; i < amount;) {
        unchecked {
            tokenIdArray[i] = super.tokenOfOwnerByIndex(userAddress, i);
            tokenUriArray[i] = super.tokenURI(tokenIdArray[i]);
            ++i;
        }
        }
        return (tokenIdArray, tokenUriArray);
    }

    function _getTokenId(uint256 data)
    private
    pure
    returns (uint256 tokenId){
    unchecked{
        tokenId = (data >> (0 * 32)) & 0xFFFFFFFF;
    }
    }

    function getIdAndAttributes(uint256 onlyTokenId)
    public
    view
    returns (uint256 rarityValue, uint256 moodValue, uint256 luckyValue, uint256 comfortValue, uint256 durability) {
        uint256 data = tokenAttributes[onlyTokenId];
        uint256[6] memory ages;
        for (uint256 i; i < 6;) {
            ages[i] = (data >> (i * 32)) & 0xFFFFFFFF;
            ++i;
        }
        rarityValue = ages[1];
        moodValue = ages[2];
        luckyValue = ages[3];
        comfortValue = ages[4];
        durability = ages[5];
    }

    function getTokenIdGeneration(uint256[6] memory ages)
    public
    pure
    returns (uint256 tokenId) {
        for (uint256 i; i < ages.length;) {
            tokenId |= ages[i] << (i * 32);
            ++i;
        }
    }

    function getTokenAttributes(uint256 onlyTokenId)
    external
    view
    returns (uint256 data){
    unchecked{
        data = tokenAttributes[onlyTokenId];
    }
    }

    /* ========== OVERRIDE FUNCTION ========== */

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory){
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
    returns (bool){
        return super.supportsInterface(interfaceId);
    }
}