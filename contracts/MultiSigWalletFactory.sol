// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import {MultiSigWalletProxy} from "./MultiSigWalletProxy.sol";

interface IMultiSigWallet {
        function batchSignature(
        address destination,
        uint256 value,
        bytes calldata data,
        uint8 operation,
        uint256 nonce,
        bytes memory sortedSignatures
    ) external payable returns (bool success);
}

contract MultiSigWalletFactory {

    event NewMultiSigWalletCreated(MultiSigWalletProxy indexed wallet, address singleton);

    /// @dev Allows to retrieve the creation code used for the Proxy deployment. With this it is easily possible to calculate predicted address.
    function proxyCreationCode() public pure returns (bytes memory) {
        return type(MultiSigWalletProxy).creationCode;
    }

    function createMultiSigWallet(address _singleton, bytes memory initializer, uint256 saltNonce) public returns (MultiSigWalletProxy proxy) {
        bytes32 salt = keccak256(abi.encodePacked(keccak256(initializer), saltNonce));
        proxy = deployProxy(_singleton, initializer, salt);
        emit NewMultiSigWalletCreated(proxy, _singleton);
    }

    function deployProxy(address _singleton, bytes memory initializer, bytes32 salt) internal returns (MultiSigWalletProxy proxy) {
        require(isContract(_singleton), "Singleton not deployed");

        bytes memory deploymentData = abi.encodePacked(type(MultiSigWalletProxy).creationCode, uint256(uint160(_singleton)));
        assembly {
            proxy := create2(0x0, add(0x20, deploymentData), mload(deploymentData), salt)
        }
        /* solhint-enable no-inline-assembly */
        require(address(proxy) != address(0), "Create2 call failed");

        if (initializer.length > 0) {
            /* solhint-disable no-inline-assembly */
            /// @solidity memory-safe-assembly
            assembly {
                if eq(call(gas(), proxy, 0, add(initializer, 0x20), mload(initializer), 0, 0), 0) {
                    revert(0, 0)
                }
            }
            /* solhint-enable no-inline-assembly */
        }
    }

    function createMultiSigWalletWithTransaction(
        address _singleton, 
        bytes memory initializer,
        uint256 saltNonce,
        address destination,
        uint256 value,
        bytes calldata data,
        uint8 operation,
        uint256 nonce,
        bytes memory signatures
    ) public payable returns (MultiSigWalletProxy wallet, bool success) {
        wallet = createMultiSigWallet(_singleton, initializer, saltNonce);
        success = IMultiSigWallet(address(wallet)).batchSignature(destination, value, data, operation, nonce, signatures);
    }

    function calculateMultiSigWalletAddress(
        address _singleton,
        bytes memory initializer,
        uint256 saltNonce
    ) public view returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(keccak256(initializer), saltNonce));
        bytes memory deploymentData = abi.encodePacked(type(MultiSigWalletProxy).creationCode, uint256(uint160(_singleton)));
        bytes32 hash = keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(deploymentData)
        ));

        return address(uint160(uint256(hash)));
    }

    /**
     * @notice Returns true if `account` is a contract.
     * @dev This function will return false if invoked during the constructor of a contract,
     *      as the code is not actually created until after the constructor finishes.
     * @param account The address being queried
     * @return True if `account` is a contract
     */
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        /* solhint-disable no-inline-assembly */
        /// @solidity memory-safe-assembly
        assembly {
            size := extcodesize(account)
        }
        /* solhint-enable no-inline-assembly */
        return size > 0;
    }
}
