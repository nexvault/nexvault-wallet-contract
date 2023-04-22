### Contracts Deployed

- [x] ethereum
- [ ] ethereum_classic
- [ ] polygon
- [x] fantom
- [ ] arbitrum
- [ ] optimism
- [ ] bnbchain
- [ ] avalanche
- [x] goerli

All chain contracts deployed are the same addresses:

- MultiSigWalletFactory: `0x258e64d7044Ed20513656df4Ba1fDfC12A1633a7`
- MultiSigWalletImplementationBeacon: `0xC708ef3703Fc6861A785CfCd8F4E227101F5C9c2`
- MultiSigWalletImplementation: `0x2cF26caF5F1B457de18C19A08C6597943aA246B2`

### Ethereum

```shell
hh --network ethereum deploy-factory
hh --network ethereum deploy-implementation
```

Output:

```
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x258e64d7044Ed20513656df4Ba1fDfC12A1633a7
Deployment Hash: 0x89e6358724627192908e0f4bd18c963c8bac5e383aaa0840f9227ba9cf589271
Transaction gasUsed: 1510264

Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0xC708ef3703Fc6861A785CfCd8F4E227101F5C9c2
Deployment Hash: 0xc7ca2b26e68c984e244dabcd731dc2908fc8b1ca9e3c6d5c9b88d94da2199b43
MultiSigWalletImplementation deployed to: 0x2cF26caF5F1B457de18C19A08C6597943aA246B2
Transaction gasUsed: 3865801
```

### Ethereum Classic

TBD.

### Polygon

TBD.

### Fantom

```shell
hh --network fantom deploy-factory
hh --network fantom deploy-implementation
```

Output:

```
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x258e64d7044Ed20513656df4Ba1fDfC12A1633a7
Deployment Hash: 0xfb8d5a7f553bac26bc613463b163c1679993ec7d1b90fc467569ef79b850af28
Transaction gasUsed: 1509838

Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0xC708ef3703Fc6861A785CfCd8F4E227101F5C9c2
Deployment Hash: 0x58987f4e92db5342662f016c0c51f612904085f09e7cb7018efeeb82e72bb76a
MultiSigWalletImplementation deployed to: 0x2cF26caF5F1B457de18C19A08C6597943aA246B2
Transaction gasUsed: 3863641
```

### Arbitrum

TBD.

### Optimism

TBD.

### Bnbchain

TBD.

### Avalanche

TBD.

### Goerli Testnet

```shell
hh --network goerli deploy-factory
hh --network goerli deploy-implementation
```

Output:

```
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x258e64d7044Ed20513656df4Ba1fDfC12A1633a7
Deployment Hash: 0xb67b2ec943b0997b54bf4a5f1689a44ccca5ff27b8a20c6eec23bf1e89069e50
Transaction gasUsed: 1510264

Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0xC708ef3703Fc6861A785CfCd8F4E227101F5C9c2
Deployment Hash: 0x03a5bb125806f2e523bfca601be1512468a0dd8468973d71e551eb0497b6c5b8
MultiSigWalletImplementation deployed to: 0x2cF26caF5F1B457de18C19A08C6597943aA246B2
Transaction gasUsed: 3865801
```
