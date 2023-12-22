import { ethers, deployments } from "hardhat";
import { signTypedData } from "./utils/general";
import { Address } from "hardhat-deploy/types";
import { saltNonce } from "./utils/constants";
import { getNXVSingleton, getFactory } from "../test/utils/setup";

async function main() {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture(); // 这将会运行所有的部署合约脚本
        // const multiSigWalletContract = await ethers.getContract('MultiSigWallet');
        // let multiSigWallet = await multiSigWalletContract.deployed();
    });
    await setupTests();
    // Set up the ethers signer
    const [deployer, user] = await ethers.getSigners();
    // Parameters for the createMultiSigWallet function
    
    const factory: any = await getFactory();
    const singleton = await getNXVSingleton();
    const singletonAddress: Address = await singleton.getAddress(); // Address of the singleton

    // const initializer = ethers.utils.toUtf8Bytes("YOUR_INITIALIZER_DATA_HERE"); // Initializer data (could be the encoded constructor parameters)
    const initializer: string = singleton.interface.encodeFunctionData("initialize", [
        [deployer.address, user.address],
        2,
        "0x542a2e3c52E8C78300906ec29786a9E8dE33C4B9", // CompatibilityFallbackHandler
    ])

    const amount = ethers.parseEther('0.00001');

    const walletAddress = await factory.calculateMultiSigWalletAddress(
        singletonAddress,
        initializer,
        saltNonce
    );
    console.log('MultiSigWalletProxy will be deployed to:', walletAddress, "\n");
    
    console.log('Sending 0.0001 Ether to this MultiSigWallet contract will be deployed...', "\n");
        await deployer.sendTransaction({
        to: walletAddress,
        value: ethers.parseEther('0.0001')
    });

    const txData = {
        destination: deployer.address,
        value: amount,
        data: "0x",
        operation: 0,
        nonce: saltNonce,
    };

    const sortedSignatures: any = await signTypedData(txData, walletAddress);

    
    // Call the createMultiSigWallet function
    const tx = await factory.createMultiSigWalletWithTransaction(
        singletonAddress, 
        initializer, 
        saltNonce,
        ...Object.values(txData),
        sortedSignatures
    );
    const receipt = await tx.wait();

    console.log('MultiSigWallet proxy contract deployed at:', receipt?.logs[0].address, "\n");
    console.log('TransactionHash:', receipt?.hash, "\n");
    console.log('GasUsed:', receipt?.gasUsed.toString(), "\n");

    // console.log('receipt:', receipt, "\n");

    // console.log('Transaction Log:', receipt?.logs, "\n");

    // console.log('Transaction Hash:', receipt?.logs.length, "\n");

    // console.log('Transaction log0:', receipt?.logs[0], "\n");

    // console.log('Transaction log1:', receipt?.logs[1], "\n");

    // Parse the event to get the proxy address
    // const event = receipt.event.find((event: { event: string; }) => event.event === "NewMultiSigWalletCreated");
    // const proxyAddress = event.args.wallet;

    // console.log(`MultiSigWallet proxy contract deployed at: ${proxyAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });