// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/// @title Multisignature wallet - Allows multiple parties to agree on transactions before execution.
/// @author Stefan George - <stefan.george@consensys.net>
contract MultiSigWalletImplementation {
    /*
     *  Events
     */
    event Execution(uint indexed transactionId);
    event ExecutionFailure(uint indexed transactionId);
    event Deposit(address indexed sender, uint value);
    event OwnerAddition(address indexed owner);
    event OwnerRemoval(address indexed owner);
    event RequirementChange(uint required);

    /*
     *  Constants
     */
    uint public constant MAX_OWNER_COUNT = 50;

    /*
     *  Storage
     */
    mapping(address => bool) public isOwner;
    mapping(bytes32 => bool) public txExists;
    mapping(uint => bool) public txNonces;

    address[] public owners;
    uint public required;

    bytes32 public DOMAIN_SEPARATOR;
    bytes32 constant EIP712DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 internal constant TRANSACTION_TYPEHASH = keccak256("Transaction(uint nonce,address destination,uint value,bytes data)");

    bool initialized;

    struct Transaction {
        uint nonce;
        address destination;
        uint value;
        bytes data;
    }

    struct Signature {
        address signer;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /*
     *  Modifiers
     */
    modifier onlyWallet() {
        require(msg.sender == address(this));
        _;
    }

    modifier ownerDoesNotExist(address owner) {
        require(!isOwner[owner]);
        _;
    }

    modifier ownerExists(address owner) {
        require(isOwner[owner]);
        _;
    }

    modifier notNull(address _address) {
        require(_address != address(0));
        _;
    }

    modifier validRequirement(uint ownerCount, uint _required) {
        require(
            ownerCount <= MAX_OWNER_COUNT &&
                _required <= ownerCount &&
                _required != 0 &&
                ownerCount != 0
        );
        _;
    }

    /// @dev Receive function allows to deposit ether.
    receive() external payable {
        if (msg.value > 0) emit Deposit(msg.sender, msg.value);
    }

    /// @dev Fallback function allows to deposit ether.
    fallback() external payable {
        if (msg.value > 0) emit Deposit(msg.sender, msg.value);
    }

    /*
     * Public functions
     */
    /// @dev Contract constructor sets initial owners and required number of confirmations.
    constructor() {}

    function initialize(
        address[] memory _owners,
        uint _required
    ) validRequirement(_owners.length, _required) public {
        require(!initialized, "already initialized");

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712DOMAIN_TYPEHASH,
                keccak256("MultiSigWallet"), // name
                keccak256("2"), // version
                block.chainid,
                address(this)
            )
        );

        for (uint i = 0; i < _owners.length; i++) {
            require(!isOwner[_owners[i]] && _owners[i] != address(0));
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        required = _required;

        initialized = true;
    }


    /// @dev Allows to add a new owner. Transaction has to be sent by wallet.
    /// @param owner Address of new owner.
    function addOwner(
        address owner
    )
        public
        onlyWallet
        ownerDoesNotExist(owner)
        notNull(owner)
        validRequirement(owners.length + 1, required)
    {
        isOwner[owner] = true;
        owners.push(owner);
        emit OwnerAddition(owner);
    }

    /// @dev Allows to remove an owner. Transaction has to be sent by wallet.
    /// @param owner Address of owner.
    function removeOwner(address owner) public onlyWallet ownerExists(owner) {
        isOwner[owner] = false;
        for (uint i = 0; i < owners.length - 1; i++)
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                delete owners[i];
                break;
            }
        if (required > owners.length) changeRequirement(owners.length);
        emit OwnerRemoval(owner);
    }

    /// @dev Allows to replace an owner with a new owner. Transaction has to be sent by wallet.
    /// @param owner Address of owner to be replaced.
    /// @param newOwner Address of new owner.
    function replaceOwner(
        address owner,
        address newOwner
    ) public onlyWallet ownerExists(owner) ownerDoesNotExist(newOwner) {
        for (uint i = 0; i < owners.length; i++)
            if (owners[i] == owner) {
                owners[i] = newOwner;
                break;
            }
        isOwner[owner] = false;
        isOwner[newOwner] = true;
        emit OwnerRemoval(owner);
        emit OwnerAddition(newOwner);
    }

    /// @dev Allows to change the number of required confirmations. Transaction has to be sent by wallet.
    /// @param _required Number of required confirmations.
    function changeRequirement(
        uint _required
    ) public onlyWallet validRequirement(owners.length, _required) {
        required = _required;
        emit RequirementChange(_required);
    }

    // call has been separated into its own function in order to take advantage
    // of the Solidity's code generator to produce a loop that copies tx.data into memory.
    function external_call(
        address destination,
        uint value,
        uint dataLength,
        bytes memory data
    ) internal returns (bool) {
        bool result;
        assembly {
            let x := mload(0x40) // "Allocate" memory for output (0x40 is where "free memory" pointer is stored by convention)
            let d := add(data, 32) // First 32 bytes are the padded length of data, so exclude that
            result := call(
                sub(gas(), 34710), // 34710 is the value that solidity is currently emitting
                // It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
                // callNewAccountGas (25000, in case the destination address does not exist and needs creating)
                destination,
                value,
                d,
                dataLength, // Size of the input (in bytes) - this is what fixes the padding problem
                x,
                0 // Output is ignored, therefore the output size is zero
            )
        }
        return result;
    }

    /// @dev Returns list of owners.
    /// @return List of owner addresses.
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function hashTransaction(
        Transaction memory transaction
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    TRANSACTION_TYPEHASH,
                    transaction.nonce,
                    transaction.destination,
                    transaction.value,
                    keccak256(bytes(transaction.data))
                )
            );
    }

    function getTransactionMessage(
        Transaction memory transaction
    ) public view returns (bytes32) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                hashTransaction(transaction)
            )
        );
        return digest;
    }

    function batchSignature(Transaction memory txn, Signature[] memory sortedSignatures) public returns (bool isOK) {
        require(sortedSignatures.length >= required, "invalid signature data length");

        // "digest" is the unique hash of transaction data
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                hashTransaction(txn)
            )
        );
        require(!txExists[digest], "tx-exist");

        // two identical nonce only allow one to be executed
        uint256 txId = txn.nonce;
        require(!txNonces[txId], "tx-nonce-exist");

        address lastOwner = address(0);
        for(uint i = 0; i < sortedSignatures.length; i++) {
            Signature memory signature = sortedSignatures[i];
            address signer = signature.signer;
            uint8 v = signature.v;
            bytes32 r = signature.r;
            bytes32 s = signature.s;

            address currentOwner = ecrecover(digest, v, r, s);

            // to save gas, must need signature.signer sorted
            require(currentOwner > lastOwner && isOwner[currentOwner] && signer == currentOwner, "error-sig");
            lastOwner = currentOwner;
        }

        txNonces[txId] = true;
        txExists[digest] = true;

        if (external_call(txn.destination, txn.value, txn.data.length, txn.data)) {
            emit Execution(txId);
            return true;
        } else {
            emit ExecutionFailure(txId);
            return false;
        }
    }

    struct Call {
        address target;
        uint value;
        bytes data;
    }

    function multiCall(
        Call[] memory calls
    ) public onlyWallet {
        for (uint i = 0; i < calls.length; i++) {
            if (external_call(
                calls[i].target,
                calls[i].value,
                calls[i].data.length,
                calls[i].data
            )) {}
            else {
                revert("internal call failed");
            }
        }
    }
}
