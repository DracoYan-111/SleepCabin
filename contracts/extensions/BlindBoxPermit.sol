// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

    error expiredDeadline(uint256 currentTime);
    error invalidSignature();
abstract contract BlindBoxPermit is EIP712 {
    using Counters for Counters.Counter;

    mapping(address => Counters.Counter) private _nonces;
    address private immutable owner;
    bytes32 private constant _PERMIT_TYPEHASH =
    keccak256("openBoxPermit(uint256 amount, uint256[] calldata tokenIds, string[] calldata uris, uint256 nonce, uint deadline)");
    bytes32 private constant _PERMIT_TYPEHASH_TWO =
    keccak256("userMintPermit(uint256 packed, uint256 [] calldata tokenIds, uint256 nonce, uint deadline)");

    constructor(address _owner) EIP712("SleepingBaseBlindBox", "1") {
        owner = _owner;
    }
    modifier timeCheck(uint deadline) {
        if (block.timestamp > deadline) {
            revert expiredDeadline(block.timestamp);
        } else {
            _;
        }
    }

    function userMintPermit(
        uint256 packed,
        uint256 [] calldata tokenIds,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual payable timeCheck(deadline) {

        bytes32 structHash = keccak256(abi.encode(_PERMIT_TYPEHASH_TWO, packed, tokenIds, _useNonce(), deadline));

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, v, r, s);
        if (signer != owner)
            revert invalidSignature();
    }


    function openBoxPermit(
        uint256 amount,
        uint256[] calldata tokenIds,
        string[] calldata uris,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual timeCheck(deadline) {

        bytes32 structHash = keccak256(abi.encode(_PERMIT_TYPEHASH, amount, tokenIds, uris, _useNonce(), deadline));

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, v, r, s);
        if (signer != owner)
            revert invalidSignature();
    }

    function nonces() public view virtual returns (uint256) {
        return _nonces[owner].current();
    }


    /**
     * @dev "Consume a nonce": return the current value and increment.
     *
     * _Available since v4.1._
     */
    function _useNonce() internal virtual returns (uint256 current) {
        Counters.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }
}
