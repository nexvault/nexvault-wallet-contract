// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

/**
* @title IProxy - Helper interface to access the singleton address of the Proxy on-chain.
* @author Richard Meissner - @rmeissner
*/
interface IProxy {
    function masterCopy() external view returns (address);
}

contract MultiSigWalletProxy {

    // Singleton always needs to be first declared variable, to ensure that it is at the same location in the contracts to which calls are delegated.
    // To reduce deployment costs this variable is internal and needs to be retrieved via `getStorageAt`
    // Because this contract is a wallet contract, in order to reduce deployment gas, this variable is internal and needs to be obtained through `getStorageAt`
    address internal singleton;

    /**
     * @notice Constructor function sets address of singleton contract.
     * @param _singleton Singleton address.
     */
    constructor(address _singleton) {
        require(_singleton != address(0), "Invalid singleton address provided");
        singleton = _singleton;
    }

    /// @dev Fallback function forwards all transactions and returns all received return data.
    fallback() external payable {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Through the and operation, get the 20-byte address of singleton
            let _singleton := and(sload(0), 0xffffffffffffffffffffffffffffffffffffffff)
            
            // 0xa619486e == keccak("masterCopy()"). The value is right padded to 32-bytes with 0s
            // Determine whether it is the masterCopy() function. If so, return the singleton address. Otherwise, execute the corresponding function of singleton.
            if eq(calldataload(0), 0xa619486e00000000000000000000000000000000000000000000000000000000) {
                mstore(0, _singleton)
                return(0, 0x20)
            }
            calldatacopy(0, 0, calldatasize())
            let success := delegatecall(gas(), _singleton, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            if eq(success, 0) {
                revert(0, returndatasize())
            }
            return(0, returndatasize())
        }
    }
}