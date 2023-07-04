// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC721, ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// _____  _                     _               ______                    _____                            _  _
///  ___|| |                   (_)              | ___ \                  |  _  |                          | || |
//\ `--. | |  ___   ___  _ __   _  _ __    __ _ | |_/ /  __ _  ___   ___ | | | |__   __  ___  _ __   __ _ | || |
// `--. \| | / _ \ / _ \| '_ \ | || '_ \  / _` || ___ \ / _` |/ __| / _ \| | | |\ \ / / / _ \| '__| / _` || || |
///\__/ /| ||  __/|  __/| |_) || || | | || (_| || |_/ /| (_| |\__ \|  __/\ \_/ / \ V / |  __/| |   | (_| || || |
//\____/ |_| \___| \___|| .__/ |_||_| |_| \__, |\____/  \__,_||___/ \___| \___/   \_/   \___||_|    \__,_||_||_|
//                      | |                __/ |
//                      |_|               |___/


contract SleepingBaseOverall is ERC721, ERC721Enumerable, ERC721URIStorage, Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    mapping(uint256 => uint128) public tokenRarity;

    constructor() ERC721("SleepingBaseOverall", "") {
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
    * @param tokenId Token id
    * @param uri Token new uri
    */
    function safeMint(
        address to,
        uint256 tokenId,
        string memory uri)
    public
    onlyRole(MINTER_ROLE) {
        (uint256 onlyTokenId,uint128 onlyTokenRarity) = _getIdAndRarity(tokenId);
        if (_exists(onlyTokenId) && ownerOf(onlyTokenId) == to) safeBurn(onlyTokenId);
        _safeMint(to, onlyTokenId);
        _setTokenURI(onlyTokenId, uri);
        tokenRarity[onlyTokenId] = onlyTokenRarity;
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

    function _getIdAndRarity(uint256 data)
    private
    pure
    returns (uint256 tokenId, uint128 rarity) {
        tokenId = uint256(uint128(data >> 128));
        rarity = uint128(data);
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