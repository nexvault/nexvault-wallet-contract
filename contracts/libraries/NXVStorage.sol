// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

/**
 * @title SafeStorage - Storage layout of the Safe contracts to be used in libraries.
 * @dev Should be always the first base contract of a library that is used with a Safe.
 * @author
 */
contract NXVStorage {
    // From /common/Singleton.sol
    address internal singleton;
    // From /common/OwnerManager.sol
    mapping(address => address) internal owners;
    uint256 internal ownerCount;
    uint256 internal threshold;

    // uint256 internal nonce;
    mapping(bytes32 => bool) internal txExists;
    mapping(uint256 => bool) internal txNonces;

    mapping(bytes32 => uint256) internal signedMessages;
}
