// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC1155, ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

    error NotYetOpeningTime();
    error NotYetTradingTime();
    error AlreadyClaimed();
    error InvalidProof();

interface SleepingBase {
    function safeMint(
        address to,
        uint256[] memory tokenIds,
        string[] memory uris)
    external;
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

    function setURI(string memory tokenUri)
    public
    onlyOwner {
        _setURI(tokenUri);
    }

    function pause()
    public
    onlyOwner {
        _pause();
    }

    function unpause()
    public
    onlyOwner {
        _unpause();
    }

    function mint(address account, uint256 amount)
    public
    onlyOwner {
        _mint(account, total, amount, "");
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
    internal
    whenNotPaused
    override {
        (, uint256 salesTime) = _getIdAndRarity(openAndSalesTime);
        if (block.timestamp <= salesTime) revert NotYetTradingTime();
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function _getIdAndRarity(uint256 data)
    private
    pure
    returns (uint256 openTime, uint128 salesTime) {
        openTime = uint256(uint128(data >> 128));
        salesTime = uint128(data);
    }

    // ===============
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

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof)
    public {
        if (isClaimed(index)) revert AlreadyClaimed();

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        if (!MerkleProof.verify(merkleProof, merkleRoot, node)) revert InvalidProof();

        // Mark it claimed and send the token.
        _setClaimed(index);
        _mint(account, total, amount, "");
        emit Claimed(index, account, amount);
    }

    function openBox(uint256 amount, uint256[] memory tokenIds, string[] memory uris)
    public
    whenNotPaused {
        (uint256 openingTime,) = _getIdAndRarity(openAndSalesTime);
        if (block.timestamp <= openingTime) revert NotYetOpeningTime();
        super._burn(_msgSender(), total, amount);
        for (uint256 i; i < tokenIds.length; ++i) {
            SleepingBase(mintNewNft).safeMint(_msgSender(), tokenIds, uris);
        }
    }
}

