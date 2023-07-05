// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC721, ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

//  _____  _                     _               ______
// /  ___|| |                   (_)              | ___ \
// \ `--. | |  ___   ___  _ __   _  _ __    __ _ | |_/ /  __ _  ___   ___
//  `--. \| | / _ \ / _ \| '_ \ | || '_ \  / _` || ___ \ / _` |/ __| / _ \
// /\__/ /| ||  __/|  __/| |_) || || | | || (_| || |_/ /| (_| |\__ \|  __/
// \____/ |_| \___| \___|| .__/ |_||_| |_| \__, |\____/  \__,_||___/ \___|
//                       | |                __/ |
//                       |_|               |___/

contract SleepingBase is ERC721, ERC721Enumerable, ERC721URIStorage, Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC721("SleepingBase", "") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);}

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
        uint256[] memory tokenIds,
        string[] memory uris)
    external
    onlyRole(MINTER_ROLE) {
        for (uint256 i; i < tokenIds.length; ++i) {
            (uint256 onlyTokenId,,,,) = getIdAndRarity(tokenIds[i]);
            if (_exists(onlyTokenId) && ownerOf(onlyTokenId) == to) safeBurn(onlyTokenId);
            _safeMint(to, onlyTokenId);
            _setTokenURI(onlyTokenId, uris[i]);
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
    function steTokenUri(uint256 tokenId, string memory uri)
    public
    onlyRole(MINTER_ROLE)
    {
        _setTokenURI(tokenId, uri);
    }

    // The following functions are overrides required by Solidity.

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
        for (uint256 i; i < amount; ++i) {
            tokenIdArray[i] = super.tokenOfOwnerByIndex(userAddress, i);
            tokenUriArray[i] = super.tokenURI(tokenIdArray[i]);
        }
        return (tokenIdArray, tokenUriArray);
    }

    function getIdAndRarity(uint256 data)
    public
    pure
    returns (uint256 tokenId, uint256 rarityValue, uint256 moodValue, uint256 luckyValue, uint256 comfortValue) {
        tokenId = data >> 192;
        rarityValue = (data >> 128) & ((1 << 64) - 1);
        moodValue = (data >> 96) & ((1 << 32) - 1);
        luckyValue = (data >> 64) & ((1 << 32) - 1);
        comfortValue = data & ((1 << 64) - 1);
    }

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