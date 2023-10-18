# NXV-Wallet Project

MultiSig Wallet based [GnosisSafe Wallet(old)](https://github.com/gnosis/MultiSigWallet/blob/master/contracts/MultiSigWallet.sol) with EIP-712 Sign Style and Multi Call Support.

### I. Architecture

![](./docs/architecture.png)

### II. Init

```shell
npm i
```

### III. Run Hardhat node
```shell
npx hardhat compile
npx hardhat node
```

### IV. Deploy Contract

Commands: 

```shell
npx hardhat --network localhost deploy-factory
npx hardhat --network localhost deploy-implementation
```

Output:

```text
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Deployment Hash: 0x726ff4125fc9a3044913c3ce5f76b1255e55483a9af0574b3310b07598f97572
Transaction gasUsed: 1509838

Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Deployment Hash: 0xd93fc6bb7f111a3015bb3e751afa8bd6965074f74a950bd7f7d1324290941056
MultiSigWalletImplementation deployed to: 0xCafac3dD18aC6c6e92c921884f9E4176737C052c
Transaction gasUsed: 3877581
```

- MultiSigWalletFactory: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

- MultiSigWalletImplementationBeacon: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

- MultiSigWalletImplementation: `0xCafac3dD18aC6c6e92c921884f9E4176737C052c`

### V. Calculate MultiSigWallet Address

Commands:

```shell
npx hardhat --network localhost calculate-wallet-address \
    --factory 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
    --implementation 0xCafac3dD18aC6c6e92c921884f9E4176737C052c \
    --owners 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
    --required 2 \
    --nonce 0
```

Output:

```text
MultiSigWalletFactory is: 0x5FbDB2315678afecb367f032d93F642f64180aa3
MultiSigWalletImplementation is: 0xCafac3dD18aC6c6e92c921884f9E4176737C052c
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 2, 0
Calculating MultiSigWalletProxy Address...
MultiSigWalletProxy address is: 0x0CfcF5A8F5A24F25B553E244B927ddf9315d2d78
```

MultiSigWalletProxy: `0x0CfcF5A8F5A24F25B553E244B927ddf9315d2d78`

### VI. Create MultiSigWallet Address

Commands:

```shell
npx hardhat --network localhost create-wallet \
    --factory 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
    --implementation 0xCafac3dD18aC6c6e92c921884f9E4176737C052c \
    --owners 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
    --required 2 \
    --nonce 0
```

Output:

```text
Creating MultiSigWalletProxy...
MultiSigWalletProxy deployed to: 0x0CfcF5A8F5A24F25B553E244B927ddf9315d2d78
Deployment Hash: 0xc7706c428239dcca802563919f154e185d0a7138aa27413550bdd931d681938c
Transaction gasUsed: 354749
```

### V. Others Scrtips

Commands:

```shell
# Create MultiSigWallet with transaction
npx hardhat --network localhost run scripts/0.create_wallet_with_transaction.ts

# Transfer ETH from MultiSigWallet with batchSignature method
npx hardhat --network localhost run scripts/1.call_wallet_transferETH.ts

# Process multiCall from MultiSigWallet with batchSignature method
npx hardhat --network localhost run scripts/2.call_wallet_multicall.ts

# Process addOwner from MultiSigWallet with batchSignature method
npx hardhat --network localhost run scripts/3.call_wallet_addowner.ts

# Process removeOwner from MultiSigWallet with batchSignature method
npx hardhat --network localhost run scripts/4.call_wallet_removeowner.ts
```

### VI. Deployed Addresses

Please see [deployed.md](./deployed.md)
