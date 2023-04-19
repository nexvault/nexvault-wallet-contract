### Contracts Already Deployed

- [x] ethereum
- [x] ethereum_classic
- [x] polygon
- [x] fantom
- [ ] arbitrum
- [ ] optimism
- [x] bnbchain
- [ ] avalanche
- [x] goerli

All chain contracts deployed are the same addresses:

- MultiSigWalletFactory: `0x1bcb75f03FcfD176962Ae789E01b3dF526F9F365`
- MultiSigWalletImplementationBeacon: `0x74f1FcE2207E0f60bb9488Fd10788AA934793157`
- MultiSigWalletImplementation: `0xB93a55e0ecA506eF1937891bbded3E53788F5Ace`

### Ethereum

```
hh --network ethereum deploy-factory
hh --network ethereum deploy-implementation
```

Output:

```
❯ hh --network ethereum deploy-factory
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x1bcb75f03FcfD176962Ae789E01b3dF526F9F365
Deployment Hash: 0xb69a5d612bb99944a6f5fb9248fa7cbfab78742db52155d5bf69fd341513beb9
Transaction gasUsed: 1510264
❯ hh --network ethereum deploy-implementation
Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0x74f1FcE2207E0f60bb9488Fd10788AA934793157
Deployment Hash: 0x26d1d9907f287e85357b29efc2dc261013a585a24de38bec57a43945942c69b5
MultiSigWalletImplementation deployed to: 0xB93a55e0ecA506eF1937891bbded3E53788F5Ace
Transaction gasUsed: 4106118
```

### Ethereum Classic

```
hh --network ethereum_classic deploy-factory
hh --network ethereum_classic deploy-implementation
```

Output:

```
❯ hh --network ethereum_classic deploy-factory
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x1bcb75f03FcfD176962Ae789E01b3dF526F9F365
Deployment Hash: 0x813c90f4df3e0eb46d4de3596a40ff5fd47820353f7907430b4e75034fb31d19
Transaction gasUsed: 1509838
❯ hh --network ethereum_classic deploy-implementation
Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0x74f1FcE2207E0f60bb9488Fd10788AA934793157
Deployment Hash: 0xd90e2c2ffffe6286e3e8ace854a05d0ee64c5358da9cbb2c71c4bc2be01e7736
MultiSigWalletImplementation deployed to: 0xB93a55e0ecA506eF1937891bbded3E53788F5Ace
Transaction gasUsed: 4103822
```

### Polygon

```
hh --network polygon deploy-factory
hh --network polygon deploy-implementation
```

Output:

```
❯ hh --network polygon deploy-factory
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x1bcb75f03FcfD176962Ae789E01b3dF526F9F365
Deployment Hash: 0x38ffec33152cb0e079c9ee55f3fe06618fa5e452d598c272adb0acc62401f51e
Transaction gasUsed: 1509838
❯ hh --network polygon deploy-implementation
Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0x74f1FcE2207E0f60bb9488Fd10788AA934793157
Deployment Hash: 0xea6e45938ba8c9fca04e6400fe64b635a1713a9446112ec847cedb233be95155
MultiSigWalletImplementation deployed to: 0xB93a55e0ecA506eF1937891bbded3E53788F5Ace
Transaction gasUsed: 4103822
```

### Fantom

```
hh --network fantom deploy-factory
hh --network fantom deploy-implementation
```

Output:

```
❯ hh --network fantom deploy-factory
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x1bcb75f03FcfD176962Ae789E01b3dF526F9F365
Deployment Hash: 0xa1cc517c06ba726801acff919ac3d87675cbcc995d3622726df95dd90101ef4f
Transaction gasUsed: 1509838
❯ hh --network fantom deploy-implementation
Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0x74f1FcE2207E0f60bb9488Fd10788AA934793157
Deployment Hash: 0xfa60b83d46869c1880bf1c93f1c3d3f29d85fc736ae2d5ff052665760665bdeb
MultiSigWalletImplementation deployed to: 0xB93a55e0ecA506eF1937891bbded3E53788F5Ace
Transaction gasUsed: 4103822
```

### Arbitrum

TBD.

### Optimism

TBD.

### Bnbchain

```
hh --network bnbchain deploy-factory
hh --network bnbchain deploy-implementation
```

Output:

```
❯ hh --network bnbchain deploy-factory
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x1bcb75f03FcfD176962Ae789E01b3dF526F9F365
Deployment Hash: 0x0730ddd64cb7916b95e96469aceba95738923dea2f27002a7e8f608b94f7ca05
Transaction gasUsed: 1509838
❯ hh --network bnbchain deploy-implementation
Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0x74f1FcE2207E0f60bb9488Fd10788AA934793157
Deployment Hash: 0xf933ea23fa893d65fcb8fed58bf1e421a03b7315854f214882dcd009be3eb201
MultiSigWalletImplementation deployed to: 0xB93a55e0ecA506eF1937891bbded3E53788F5Ace
Transaction gasUsed: 4097022
```

### Avalanche

TBD.

### Goerli Testnet

```
hh --network goerli deploy-factory
hh --network goerli deploy-implementation
```

Output:

```
❯ hh --network goerli deploy-factory
Deploying MultiSigWalletFactory...
MultiSigWalletFactory deployed to: 0x1bcb75f03FcfD176962Ae789E01b3dF526F9F365
Deployment Hash: 0xc97d4a7d795ccc2f6539303a5d4964cce86bc15efdba334ccf3a9aa51303d746
Transaction gasUsed: 1510264
❯ hh --network goerli deploy-implementation
Deploying MultiSigWalletImplementationBeacon...
MultiSigWalletImplementationBeacon deployed to 0x74f1FcE2207E0f60bb9488Fd10788AA934793157
Deployment Hash: 0x9b0c1a5348210e515c0c2d4e2de3d59575fd100edaa1d4eb3a2d89e6a3ee2955
MultiSigWalletImplementation deployed to: 0xB93a55e0ecA506eF1937891bbded3E53788F5Ace
Transaction gasUsed: 4106118
```
