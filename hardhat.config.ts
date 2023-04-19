import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

import 'dotenv/config';


task('deploy-factory', 'Deploy a MultiSigWalletFactory')
  .setAction(async (args, hre) => {
  const MultiSigWalletFactory = await hre.ethers.getContractFactory('MultiSigWalletFactory');
  console.log('Deploying MultiSigWalletFactory...');

  const walletFactory = await MultiSigWalletFactory.deploy();
  const receipt = await walletFactory.deployTransaction.wait();
  await walletFactory.deployed();

  console.log('MultiSigWalletFactory deployed to:', walletFactory.address);
  console.log('Deployment Hash:', receipt.transactionHash);

  const gasUsed = receipt.gasUsed;
  console.log('Transaction gasUsed:', gasUsed.toString());
});


task('deploy-implementation', 'Deploy a MultiSigWalletImplementation with a Beacon contract')
  .setAction(async (args, hre) => {
  const MultiSigWalletImplementationBeacon = await hre.ethers.getContractFactory('MultiSigWalletImplementationBeacon');
  const MultiSigWalletImplementation = await hre.ethers.getContractFactory("MultiSigWalletImplementation");

  console.log('Deploying MultiSigWalletImplementationBeacon...');

  const walletImplBeacon = await MultiSigWalletImplementationBeacon.deploy();
  await walletImplBeacon.deployed();

  const receipt = await walletImplBeacon.deployTransaction.wait();

  console.log('MultiSigWalletImplementationBeacon deployed to', walletImplBeacon.address);
  console.log('Deployment Hash:', receipt.transactionHash);

  const event = receipt.events?.find((event: { event: string; }) => event.event === 'MultiSigWalletImplementationDeployed');
  const implAddress = event?.args[0];
  console.log('MultiSigWalletImplementation deployed to:', implAddress);

  // await hre.tenderly.persistArtifacts({
  //   name: "MultiSigWalletImplementation",
  //   address: implAddress,
  // });

  const gasUsed = receipt.gasUsed;
  const gasPrice = hre.ethers.BigNumber.from(walletImplBeacon.deployTransaction.gasPrice);
  const transactionCost = gasUsed.mul(gasPrice);

  console.log('Transaction gasUsed:', gasUsed.toString());
});


task('calculate-wallet-address', 'Calculate a MultiSigWalletProxy address with params')
  .addParam('factory', 'The MultiSigWalletFactory contract to call')
  .addParam('implementation', 'The MultiSigWalletProxy implementation contract to use')
  .addParam('owners', 'owners of MultiSigWallet')
  .addParam('required', 'required of MultiSigWallet')
  .addParam('nonce', 'nonce of "create2" opcode to calculate MultiSigWallet address')
  .setAction(async (args, hre) => {
    const MultiSigWalletFactory = await hre.ethers.getContractFactory('MultiSigWalletFactory');
    const MultiSigWalletImplementation = await hre.ethers.getContractFactory('MultiSigWalletImplementation');

    const walletFactory = MultiSigWalletFactory.attach(args.factory);
    const walletImplementation = MultiSigWalletImplementation.attach(args.implementation);

    console.log('MultiSigWalletFactory is:', walletFactory.address);
    console.log('MultiSigWalletImplementation is:', walletImplementation.address);

    const owners = args.owners.split(',');
    const required = args.required;
    const nonce = args.nonce;
    console.log(`${owners}, ${required}, ${nonce}`);

    console.log('Calculating MultiSigWalletProxy Address...');

    const walletProxyAddress = await walletFactory.calculateMultiSigWalletAddress(
      walletImplementation.address,
      owners,
      required,
      nonce
    );
    console.log('MultiSigWalletProxy address is:', walletProxyAddress);
});


task('create-wallet', 'Create a MultiSigWalletProxy with params')
  .addParam('factory', 'The MultiSigWalletFactory contract to call')
  .addParam('implementation', 'The MultiSigWalletProxy implementation contract to use')
  .addParam('owners', 'owners of MultiSigWallet')
  .addParam('required', 'required of MultiSigWallet')
  .addParam('nonce', 'nonce of "create2" opcode to calculate MultiSigWallet address')
  .setAction(async (args, hre) => {
    const MultiSigWalletFactory = await hre.ethers.getContractFactory('MultiSigWalletFactory');
    const MultiSigWalletImplementation = await hre.ethers.getContractFactory('MultiSigWalletImplementation');
    const MultiSigWalletProxy = await hre.ethers.getContractFactory("MultiSigWalletProxy");

    const walletFactory = MultiSigWalletFactory.attach(args.factory);
    const walletImplementation = MultiSigWalletImplementation.attach(args.implementation);

    console.log('MultiSigWalletFactory is:', walletFactory.address);
    console.log('MultiSigWalletImplementation is:', walletImplementation.address);

    const owners = args.owners.split(',');
    const required = args.required;
    const nonce = args.nonce;
    console.log(`${owners}, ${required}, ${nonce}`);

    console.log('Creating MultiSigWalletProxy...');

    const transaction = await walletFactory.createMultiSigWallet(
      walletImplementation.address,
      owners,
      required,
      nonce
    );
    const receipt = await transaction.wait();
    const event = receipt.events?.find((event: { event: string; }) => event.event === 'NewMultiSigWalletCreated');
    const walletAddress = event?.args[0];
    console.log('MultiSigWalletProxy deployed to:', walletAddress);
    console.log('Deployment Hash:', receipt.transactionHash);

    const gasUsed = receipt.gasUsed;
    console.log('Transaction gasUsed:', gasUsed.toString());
});

let mnemonic = process.env.MNEMONIC;

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  networks: {
    localhost: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 30000000,
      gas: 30000000
    },

    goerli: {
      url: 'https://eth-goerli.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
      accounts: mnemonic ? { mnemonic } : undefined
    }
  }
};

export default config;
