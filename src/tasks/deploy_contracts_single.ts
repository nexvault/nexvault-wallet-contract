import { task } from "hardhat/config";
task('deploy-factory', 'Deploy a MultiSigWalletFactory')
  .setAction(async (args, hre) => {
  const MultiSigWalletFactory = await hre.ethers.getContractFactory('MultiSigWalletFactory');
  console.log('Deploying MultiSigWalletFactory...');

  const walletFactory = await MultiSigWalletFactory.deploy();

  await walletFactory.waitForDeployment();
  console.log('MultiSigWalletFactory deployed to:', walletFactory.target);

  const receipt = await walletFactory.deploymentTransaction()?.wait();
  console.log('Deployment Hash: ', receipt?.hash);
  console.log('Transaction gasUsed:', receipt?.gasUsed?.toString());
});

task('deploy-walletImplementation', 'Deploy a MultiSigWalletImplementation')
  .setAction(async (args, hre) => {
  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");

  console.log('Deploying MultiSigWalletImplementation...');

  const walletImpl = await MultiSigWallet.deploy();
  await walletImpl.waitForDeployment();

  const receipt = await walletImpl.deploymentTransaction()?.wait();

  console.log('MultiSigWalletImplementation deployed to', walletImpl.target);
  console.log('Deployment Hash:', receipt?.hash);

  console.log('Transaction gasUsed:', receipt?.gasUsed.toString());
});

task('deploy-fallbackHandler', 'Deploy a FallbackHandler')
  .setAction(async (args, hre) => {
  const FallbackHandler = await hre.ethers.getContractFactory("CompatibilityFallbackHandler");

  console.log('Deploying CompatibilityFallbackHandler...');

  const fallback = await FallbackHandler.deploy();
  await fallback.waitForDeployment();

  const receipt = await fallback.deploymentTransaction()?.wait();

  console.log('CompatibilityFallbackHandler deployed to', fallback.target);
  console.log('Deployment Hash:', receipt?.hash);
  console.log('Transaction gasUsed:', receipt?.gasUsed.toString());
});

task('deploy-multiSendCallOnly', 'Deploy MultiSendCallOnly')
  .setAction(async (args, hre) => {
  const MultiSendCallOnly = await hre.ethers.getContractFactory("MultiSendCallOnly");

  console.log('Deploying MultiSendCallOnly...');

  const multicall = await MultiSendCallOnly.deploy();
  await multicall.waitForDeployment();

  const receipt = await multicall.deploymentTransaction()?.wait();

  console.log('MultiSendCallOnly deployed to', multicall.target);
  console.log('Deployment Hash:', receipt?.hash);
  console.log('Transaction gasUsed:', receipt?.gasUsed?.toString());
});

task('deploy-multiSend', 'Deploy MultiSend')
  .setAction(async (args, hre) => {
  const MultiSend = await hre.ethers.getContractFactory("MultiSend");

  console.log('Deploying MultiSend...');

  const multicall = await MultiSend.deploy();
  await multicall.waitForDeployment();

  const receipt = await multicall.deploymentTransaction()?.wait();

  console.log('MultiSendCallOnly deployed to', multicall.target);
  console.log('Deployment Hash:', receipt?.hash);
  console.log('Transaction gasUsed:', receipt?.gasUsed?.toString());
});

task('deploy-migration', 'Deploy NXVStorage and NXVMigration')
  .setAction(async (args, hre) => {
  const NXVMigration = await hre.ethers.getContractFactory("NXVMigration");

  console.log('Deploying NXVMigration...');

  const migrate = await NXVMigration.deploy();
  await migrate.waitForDeployment();

  const receipt = await migrate.deploymentTransaction()?.wait();

  console.log('NXVMigration deployed to', migrate.target);
  console.log('Deployment Hash:', receipt?.hash);
  console.log('Transaction gasUsed:', receipt?.gasUsed?.toString());
});

task('deploy-signMessageLib', 'Deploy signMessageLib')
  .setAction(async (args, hre) => {
  const SignMessageLib = await hre.ethers.getContractFactory("SignMessageLib");

  console.log('Deploying SignMessageLib...');

  const signMessageLib = await SignMessageLib.deploy();
  await signMessageLib.waitForDeployment();

  const receipt = await signMessageLib.deploymentTransaction()?.wait();

  console.log('signMessageLib deployed to', signMessageLib.target);
  console.log('Deployment Hash:', receipt?.hash);
  console.log('Transaction gasUsed:', receipt?.gasUsed?.toString());
});

task('calculate-wallet-address', 'Calculate a MultiSigWalletProxy address with params')
  .addParam('factory', 'The MultiSigWalletFactory contract to call')
  .addParam('implementation', 'The MultiSigWalletProxy implementation contract to use')
  .addParam('fallbackhandler', 'The CompatibilityFallbackHandler contract to use')
  .addParam('owners', 'owners of MultiSigWallet')
  .addParam('required', 'required of MultiSigWallet')
  .addParam('nonce', 'nonce of "create2" opcode to calculate MultiSigWallet address')
  .setAction(async (args, hre) => {
    const MultiSigWalletFactory = await hre.ethers.getContractFactory('MultiSigWalletFactory');
    const MultiSigWalletImplementation = await hre.ethers.getContractFactory('MultiSigWallet');
    const FallbackHandler = await hre.ethers.getContractFactory("CompatibilityFallbackHandler")

    const walletFactory: any = MultiSigWalletFactory.attach(args.factory);
    const walletImplementation = MultiSigWalletImplementation.attach(args.implementation);
    const fallbackHandler = FallbackHandler.attach(args.fallbackhandler);

    console.log('MultiSigWalletFactory is:', await walletFactory.getAddress());
    console.log('MultiSigWalletImplementation is:', await walletImplementation.getAddress());
    console.log('FallbackHandler is:', await fallbackHandler.getAddress());

    const owners = args.owners.split(',');
    const required = args.required;
    const nonce = args.nonce;
    console.log(`${owners}, ${required}, ${nonce}`);

    console.log('Calculating MultiSigWalletProxy Address...');

    const initializer = walletImplementation.interface.encodeFunctionData("initialize", [
      owners, required,
      await fallbackHandler.getAddress(), // CompatibilityFallbackHandler
    ])

    const walletProxyAddress = await walletFactory.calculateMultiSigWalletAddress(
      walletImplementation.getAddress(),
      initializer,
      nonce
    );
    console.log('MultiSigWalletProxy address is:', walletProxyAddress);
  });


task('create-wallet', 'Create a MultiSigWalletProxy with params')
  .addParam('factory', 'The MultiSigWalletFactory contract to call')
  .addParam('implementation', 'The MultiSigWalletProxy implementation contract to use')
  .addParam('fallbackhandler', 'The CompatibilityFallbackHandler contract to use')
  .addParam('owners', 'owners of MultiSigWallet')
  .addParam('required', 'required of MultiSigWallet')
  .addParam('nonce', 'nonce of "create2" opcode to calculate MultiSigWallet address')
  .setAction(async (args, hre) => {
    const MultiSigWalletFactory = await hre.ethers.getContractFactory('MultiSigWalletFactory');
    const MultiSigWalletImplementation = await hre.ethers.getContractFactory('MultiSigWallet');
    const FallbackHandler = await hre.ethers.getContractFactory("CompatibilityFallbackHandler")

    const walletFactory: any = MultiSigWalletFactory.attach(args.factory);
    const walletImplementation = MultiSigWalletImplementation.attach(args.implementation);
    const fallbackHandler = FallbackHandler.attach(args.fallbackhandler);

    console.log('MultiSigWalletFactory is:', await walletFactory.getAddress());
    console.log('MultiSigWalletImplementation is:', await walletImplementation.getAddress());
    console.log('FallbackHandler is:', await fallbackHandler.getAddress());

    const owners = args.owners.split(',');
    const required = args.required;
    const nonce = args.nonce;
    console.log(`${owners}, ${required}, ${nonce}`);

    console.log('Creating MultiSigWalletProxy...');

    const initializer = walletImplementation.interface.encodeFunctionData("initialize", [
      owners, required,
      await fallbackHandler.getAddress(), // CompatibilityFallbackHandler
    ])
    const transaction = await walletFactory.createMultiSigWallet(
      await walletImplementation.getAddress(),
      initializer,
      nonce
    );
    const receipt = await transaction.wait();
    console.log('MultiSigWallet proxy deployed at:', receipt?.logs[0].address, "\n");
    console.log('Deployment Hash:', receipt.hash);

    const gasUsed = receipt.gasUsed;
    console.log('Transaction gasUsed:', gasUsed.toString());
  });

