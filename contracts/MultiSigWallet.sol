// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import {OwnerManager} from "./base/OwnerManager.sol";
import {FallbackManager} from "./base/FallbackManager.sol";
import {NativeCurrencyPaymentFallback} from "./common/NativeCurrencyPaymentFallback.sol";
import {Singleton} from "./common/Singleton.sol";
import {SignatureDecoder} from "./common/SignatureDecoder.sol";
import {SecuredTokenTransfer} from "./common/SecuredTokenTransfer.sol";
import {StorageAccessible} from "./common/StorageAccessible.sol";
import {Enum} from "./common/Enum.sol";
import {ISignatureValidator, ISignatureValidatorConstants} from "./interfaces/ISignatureValidator.sol";

/// @title Multisignature wallet - Allows multiple parties to agree on transactions before execution.
/// @author 
contract MultiSigWallet is
    Singleton,
    NativeCurrencyPaymentFallback,
    OwnerManager,
    SignatureDecoder,
    ISignatureValidatorConstants,
    FallbackManager,
    StorageAccessible
{

    string public constant VERSION = "1.1.0";  // todo: update version

    /*
     *  Constants
     */
    // bytes32 public DOMAIN_SEPARATOR;
    bytes32 private constant EIP712DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant TRANSACTION_TYPEHASH = keccak256("Transaction(address destination,uint256 value,bytes data,uint8 operation,uint256 nonce)");

    /*
     *  Events
     */
    event NXVSetup(address indexed initiator, address[] owners, uint256 threshold, address fallbackHandler);
    event ExecutionSuccess(bytes32 indexed txHash, uint256 indexed nonce);
    // event ExecutionFailure(uint indexed transactionId);

    /*
     *  Storage
     */
    mapping(bytes32 => bool) public txExists;
    mapping(uint256 => bool) public txNonces;

    // Mapping to keep track of all message hashes that have been approved by ALL REQUIRED owners
    mapping(bytes32 => uint256) public signedMessages;

    /*
     * Public functions
     */
    /// @dev Contract constructor sets initial owners and threshold number of confirmations.
    constructor() {
        threshold = 1;
    }

    function initialize(
        address[] calldata _owners,
        uint256 _threshold,
        address fallbackHandler
    ) external {
        setupOwners(_owners, _threshold);
        if (fallbackHandler != address(0)) internalSetFallbackHandler(fallbackHandler);
        emit NXVSetup(msg.sender, _owners, _threshold, fallbackHandler);
    }

    // call has been separated into its own function in order to take advantage
    // of the Solidity's code generator to produce a loop that copies tx.data into memory.
    function external_call(
        address destination,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) internal returns (bool success) {
        if(operation == Enum.Operation.Call) {
            assembly {
                // let x := mload(0x40) // "Allocate" memory for output (0x40 is where "free memory" pointer is stored by convention)
                // let d := add(data, 32) // First 32 bytes are the padded length of data, so exclude that
                success := call(
                    // sub(gas(), 34710),
                    sub(gas(), 2500), // 34710 is the value that solidity is currently emitting
                    // It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
                    // callNewAccountGas (25000, in case the destination address does not exist and needs creating)
                    destination,
                    value,
                    add(data, 0x20),
                    mload(data), // Size of the input (in bytes) - this is what fixes the padding problem
                    0,
                    0 // Output is ignored, therefore the output size is zero
                )
            }
        } else {
            assembly {
                success := delegatecall(
                    // sub(gas(), 34710), // 34710 is the value that solidity is currently emitting
                    sub(gas(), 2500),
                    // It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
                    // callNewAccountGas (25000, in case the destination address does not exist and needs creating)
                    destination,
                    add(data, 0x20),
                    mload(data), // Size of the input (in bytes) - this is what fixes the padding problem
                    0,
                    0 // Output is ignored, therefore the output size is zero
                )
            }
        }
    }

    /**
     * @dev Returns the domain separator for this contract, as defined in the EIP-712 standard.
     * @return bytes32 The domain separator hash.
     */
    function domainSeparator() public view returns (bytes32) {
        uint256 chainId;
        /* solhint-disable no-inline-assembly */
        /// @solidity memory-safe-assembly
        assembly {
            chainId := chainid()
        }
        /* solhint-enable no-inline-assembly */
        return keccak256(
            abi.encode(
                EIP712DOMAIN_TYPEHASH,
                keccak256("MultiSigWallet"), // name
                keccak256("2"), // version
                chainId,
                address(this)
            )
        );
    }

    function batchSignature(
        address destination,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint256 nonce,
        bytes memory sortedSignatures
    ) public payable virtual returns (bool success) {
        // require(sortedSignatures.length >= threshold, "invalid signature data length");

        // "txHash" is the unique hash of transaction data
        bytes32 txHash = getTransactionHash(destination, value, data, operation, nonce);
        require(!txExists[txHash], "tx-exist");

        // two identical nonce only allow one to be executed
        // uint256 nonce = nonce;
        require(!txNonces[nonce], "tx-nonce-exist");

        checkSignatures(txHash, "", sortedSignatures); // 数组转化为 bytes

        txNonces[nonce] = true;
        txExists[txHash] = true;

        success = external_call(destination, value, data, operation);
        require(success, "call-failed");

        emit ExecutionSuccess(txHash, nonce);
    }

    function checkSignatures(bytes32 txHash, bytes memory data, bytes memory signatures) public view {
        // Load threshold to avoid multiple storage loads
        uint256 _threshold = threshold;
        // Check that a threshold is set
        require(_threshold > 0, "Threshold needs defined");
        checkNSignatures(txHash, data, signatures, _threshold);
    }

    function checkNSignatures(
        bytes32 txHash,
        bytes memory /* data */,
        bytes memory signatures,
        uint256 requiredSignatures
    ) public view {
        // Check that the provided signature data is not too short
        require(signatures.length >= requiredSignatures * 65, "invalid sig length");
        // There cannot be an owner with address 0.
        address lastOwner = address(0);
        address currentOwner;
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint256 i;
        for(i = 0; i < requiredSignatures; i++) {
            (v, r, s) = signatureSplit(signatures, i);
            currentOwner = ecrecover(txHash, v, r, s);
            // to save gas, must need signature.signer sorted
            require(currentOwner > lastOwner && owners[currentOwner] != address(0) && currentOwner != SENTINEL_OWNERS, "error-sig");
            lastOwner = currentOwner;
        }
    }

    function encodeTransactionData(
        address destination,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint256 nonce
    ) private view returns (bytes memory) {
        bytes32 txHash = keccak256(
            abi.encode(
                TRANSACTION_TYPEHASH,
                destination,
                value,
                keccak256(data),
                operation,
                nonce
            )
        );
        return abi.encodePacked(bytes1(0x19), bytes1(0x01), domainSeparator(), txHash);
    }

    function getTransactionHash(
        address destination,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint256 nonce
    ) public view returns (bytes32) {
        return keccak256(encodeTransactionData(destination, value, data, operation, nonce));
    }
}
