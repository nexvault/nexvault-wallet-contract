// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import {NXVStorage} from "./NXVStorage.sol";
import {MultiSigWallet} from "../MultiSigWallet.sol";

/**
 * @title SignMessageLib - Allows to sign messages on-chain by writing the signed message hashes on-chain.
 * @author Richard Meissner - @rmeissner
 */
contract SignMessageLib is NXVStorage {
    // keccak256("NXVMessage(bytes message)");
    // bytes32 private constant SAFE_MSG_TYPEHASH = 0x60b3cbf8b4a223d68d641b3b6ddf9a298e7f33710cf3d3a9d1146b5a6150fbca;
    bytes32 private constant NXV_MSG_TYPEHASH = 0xdf49db468cf6e89852cc8e0f454403496dae2705e7f81fce587279884ba3c833;

    event SignMsg(bytes32 indexed msgHash);

    /**
     * @notice Marks a message (`_data`) as signed.
     * @dev Can be verified using EIP-1271 validation method by passing the pre-image of the message hash and empty bytes as the signature.
     * @param _data Arbitrary length data that should be marked as signed on the behalf of address(this).
     */
    function signMessage(bytes calldata _data) external {
        bytes32 msgHash = getMessageHash(_data);
        signedMessages[msgHash] = 1;
        emit SignMsg(msgHash);
    }

    /**
     * @dev Returns hash of a message that can be signed by owners.
     * @param message Message that should be hashed.
     * @return Message hash.
     */
    function getMessageHash(bytes memory message) public view returns (bytes32) {
        bytes32 nxvMessageHash = keccak256(abi.encode(NXV_MSG_TYPEHASH, keccak256(message)));
        return keccak256(abi.encodePacked(bytes1(0x19), bytes1(0x01), MultiSigWallet(payable(address(this))).domainSeparator(), nxvMessageHash));
    }
}
