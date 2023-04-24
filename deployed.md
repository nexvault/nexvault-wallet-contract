### Contracts Deployed

- [x] ethereum
- [x] ethereum_classic
- [x] polygon
- [x] fantom
- [x] arbitrum
- [x] optimism
- [x] bnbchain
- [x] avalanche(c-chain)
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

```shell
hh --network ethereum_classic deploy-factory
hh --network ethereum_classic deploy-implementation
```

output:

```
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x258e64d7044Ed20513656df4Ba1fDfC12A1633a7
Deployment Hash: 0x632ee45667123ff9c495cd8095751dede172491f53d483417e2fc12e3bc8ea38
Transaction gasUsed: 1509838

Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0xC708ef3703Fc6861A785CfCd8F4E227101F5C9c2
Deployment Hash: 0xc7fcbf8b61fab19647b6c3e052bfe12e8d2fa7e43a2e4e3e87992800c50db4d4
MultiSigWalletImplementation deployed to: 0x2cF26caF5F1B457de18C19A08C6597943aA246B2
Transaction gasUsed: 3863641
```

### Polygon

```shell
hh --network polygon deploy-factory
hh --network polygon deploy-implementation
```

output:

```
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x258e64d7044Ed20513656df4Ba1fDfC12A1633a7
Deployment Hash: 0x140c9a03cec07615a3e5a21088079b558027f3024af37ca8a0f7a9a2badc1622
Transaction gasUsed: 1509838

Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0xC708ef3703Fc6861A785CfCd8F4E227101F5C9c2
Deployment Hash: 0x8b15ed190a6a3ed96e3f1e4fb15e2df6d93b147b6a384ca4faf8e3b744d34ed6
MultiSigWalletImplementation deployed to: 0x2cF26caF5F1B457de18C19A08C6597943aA246B2
Transaction gasUsed: 3863641
```

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

```shell
hh --network arbitrum deploy-factory
hh --network arbitrum deploy-implementation
```

output:

```
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x258e64d7044Ed20513656df4Ba1fDfC12A1633a7
Deployment Hash: 0xb2eee7318ee069b833cdccd2b65643d44371f294bb5a12d5ad510708be548a45
Transaction gasUsed: 15054365

Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0xC708ef3703Fc6861A785CfCd8F4E227101F5C9c2
Deployment Hash: 0xca9e220eb33e3a3a290513d072d0741f1b6c10489a708c9285380d4353afa079
MultiSigWalletImplementation deployed to: 0x2cF26caF5F1B457de18C19A08C6597943aA246B2
Transaction gasUsed: 32669660
```

### Optimism

```shell
hh --network optimism deploy-factory
hh --network optimism deploy-implementation
```

output:

```
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x258e64d7044Ed20513656df4Ba1fDfC12A1633a7
Deployment Hash: 0x9a0df08bb8c4f9554742b65b3e8834ac31d70c3ff9c44bb9cc3f174cdd214501
Transaction gasUsed: 1509838

Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0xC708ef3703Fc6861A785CfCd8F4E227101F5C9c2
Deployment Hash: 0x99f028499f8a6002d685b4f8e87cf71515ae56fd0baf06bc35e1d5a825b8783e
MultiSigWalletImplementation deployed to: 0x2cF26caF5F1B457de18C19A08C6597943aA246B2
Transaction gasUsed: 3863641
```

### Bnbchain

```shell
hh --network bnbchain deploy-factory
hh --network bnbchain deploy-implementation
```

output:

```
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x258e64d7044Ed20513656df4Ba1fDfC12A1633a7
Deployment Hash: 0xc41b8e0f8503950faab0b6ed7e59fa8cf0f70d5082e5987f8f94aaef8ec3fe3f
Transaction gasUsed: 1509838

Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0xC708ef3703Fc6861A785CfCd8F4E227101F5C9c2
Deployment Hash: 0xe7e09f00a8a36b82a73a9531038124eef9635914a12eb483aec40d6fc70f8b3e
MultiSigWalletImplementation deployed to: 0x2cF26caF5F1B457de18C19A08C6597943aA246B2
Transaction gasUsed: 3856841
```

### Avalanche

```shell
hh --network avalanche deploy-factory
hh --network avalanche deploy-implementation
```

output:

```
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x258e64d7044Ed20513656df4Ba1fDfC12A1633a7
Deployment Hash: 0x3981475879e1959ee0774503c92f1ff4cd0ecb542907454a6264137e4bf5cc6f
Transaction gasUsed: 1509838

Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0xC708ef3703Fc6861A785CfCd8F4E227101F5C9c2
Deployment Hash: 0x6f07f4cde9f07a97d1006dd160683c45d9b0bb7edabe2351741c7a5371452fd8
MultiSigWalletImplementation deployed to: 0x2cF26caF5F1B457de18C19A08C6597943aA246B2
Transaction gasUsed: 3863641
```

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
