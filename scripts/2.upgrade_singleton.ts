
import hre, { ethers, deployments } from "hardhat";
import { signTypedData } from "./utils/general";
import { saltNonce } from "./utils/constants";
import deploymentData from "../test/json/NXVDeployment.json";
import NXVRuntimeBytecode from "../test/json/NXVRuntimeBytecode.json";
import { getNXVWithSingleton, migrationContractFrom130To141, getNXVSingletonAt } from "../test/utils/setup";

// 首先部署升级合约, libraries/NXVMigration.sol, 然后钱包 delegate 调用升级合约的 migrate() 方法, 所以每次升级都需要重新部署升级合约，
// 这样做的目的是不需要像透明代理和UUPS代理那样, 合约需要判断权限, 从而增加了合约的复杂度, 浪费gas
async function main() {

    const NXV_SINGLETON_141_ADDRESS = "0x0787Bedd6bb2Db4c9013B736BC251e9Edd091bdC";

    const COMPATIBILITY_FALLBACK_HANDLER_141 = "0x542a2e3c52E8C78300906ec29786a9E8dE33C4B9";

    const FALLBACK_HANDLER_STORAGE_SLOT = "0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5";

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();

        // Set the runtime code for hardcoded addresses
        await hre.network.provider.send("hardhat_setCode", [NXV_SINGLETON_141_ADDRESS, NXVRuntimeBytecode.NXV141]);
        await hre.network.provider.send("hardhat_setCode", [
            COMPATIBILITY_FALLBACK_HANDLER_141,
            NXVRuntimeBytecode.NXV141fallbackHandler,
        ]);

        const signers = await ethers.getSigners();
        const [user1, user2] = signers;
        const singleton130Address = (await (await user1.sendTransaction({ data: deploymentData.NXV130 })).wait())?.contractAddress;
        if (!singleton130Address) {
            throw new Error("Could not deploy NXV130");
        }
        const singleton130 = await getNXVSingletonAt(singleton130Address);

        const migration: any = await (await migrationContractFrom130To141()).deploy();
        return {
            NXV130: await getNXVWithSingleton(singleton130, [user1.address, user2.address]),
            migration,
        };
    });

    const { NXV130, migration } = await setupTests() as {NXV130: any, migration: any};

    const walletAddress = await NXV130.getAddress();
    const migrationNXV = migration.attach(walletAddress);

    const provider = ethers.provider;

    const masterCopyData = "0xa619486e00000000000000000000000000000000000000000000000000000000"; // 这是 masterCopy() 方法的编码数据

    const response = await provider.call({ to: walletAddress, data: masterCopyData });
    // console.log("Master Copy Response:", response);
    const abiCoder = new ethers.AbiCoder();
    const masterCopyAddress = abiCoder.decode(["address"], response)[0];
    console.log("Master Copy Address Before:", masterCopyAddress);
    const fallbackHandlerAddressBefore = await NXV130.getStorageAt(FALLBACK_HANDLER_STORAGE_SLOT, 1);
    console.log("fallbackHandlerAddressBefore:", fallbackHandlerAddressBefore);
    // process.exit(0);

    // const amount = ethers.utils.parseEther('0.00001');
    const amount = 0;
    const data = migration.interface.encodeFunctionData("migrateWithFallbackHandler", []);
    console.log(data);
    // process.exit(0);

    const txData = {
        destination: await migration.getAddress(),
        value: amount,
        data: data,
        operation: 1,  // delegatecall
        nonce: saltNonce,
    };

    const sortedSignatures = await signTypedData(txData, walletAddress);

    const transaction = await NXV130.batchSignature(
        ...Object.values(txData),
        sortedSignatures,
        // { gasPrice: ethers.utils.parseUnits('2', 'gwei') }
    );
    
    const receipt = await transaction.wait();
    console.log('Transaction Hash:', receipt?.hash);

    const gasUsed = receipt?.gasUsed;

    console.log('Transaction gasUsed:', gasUsed?.toString());
    const response1 = await provider.call({ to: walletAddress, data: masterCopyData });
    // console.log("Master Copy Response:", response1);
    const abiCoder1 = new ethers.AbiCoder();
    const masterCopyAddressAfter = abiCoder1.decode(["address"], response1)[0];
    console.log("Master Copy Address After:", masterCopyAddressAfter);

    const fallbackHandlerAddressAfter = await NXV130.getStorageAt(FALLBACK_HANDLER_STORAGE_SLOT, 1);
    console.log("fallbackHandlerAddressAfter:", fallbackHandlerAddressAfter);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

