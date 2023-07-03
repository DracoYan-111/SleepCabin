// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";



//  _____  _                     _               ______
// /  ___|| |                   (_)              | ___ \
// \ `--. | |  ___   ___  _ __   _  _ __    __ _ | |_/ /  __ _  ___   ___
//  `--. \| | / _ \ / _ \| '_ \ | || '_ \  / _` || ___ \ / _` |/ __| / _ \
// /\__/ /| ||  __/|  __/| |_) || || | | || (_| || |_/ /| (_| |\__ \|  __/
// \____/ |_| \___| \___|| .__/ |_||_| |_| \__, |\____/  \__,_||___/ \___|
//                       | |                __/ |
//                       |_|               |___/

contract SleepingBase is ERC721, ERC721Enumerable, ERC721URIStorage, Pausable, Ownable {

    mapping(uint256 => uint128) public tokenRarity;

    constructor() ERC721("SleepingBase", "") {}

    /**
    * @dev Pause token
    */
    function pause() public onlyOwner {
        _pause();
    }

    /**
    * @dev Unpause token
    */
    function unpause() public onlyOwner {
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
    onlyOwner {
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
    onlyOwner {
        super._burn(tokenId);
    }

    /**
    * @dev Set token uri
    * @param tokenId Token id
    * @param uri Token new uri
    */
    function steTokenUri(uint256 tokenId, string memory uri)
    public
    onlyOwner
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
    override(ERC721, ERC721Enumerable, ERC721URIStorage)
    returns (bool){
        return super.supportsInterface(interfaceId);
    }
}