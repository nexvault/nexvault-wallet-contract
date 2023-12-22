import hre, { deployments, ethers } from "hardhat";
import { signTypedData } from "./utils/general";
import { saltNonce } from "./utils/constants";
import { getNXVWithOwners, getCompatFallbackHandler, compatFallbackHandlerDeployment } from "../test/utils/setup";

async function main() {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture(); // this will run all deploy scripts
        const signers = await ethers.getSigners();
        const [user1, user2] = signers;
        return {
            nxv: await getNXVWithOwners([user1.address, user2.address], 2, (await compatFallbackHandlerDeployment()).address),
        }
    });

    const {nxv} = await setupTests() as { nxv: any};
    const signMessage = await (await hre.ethers.getContractFactory("SignMessageLib")).deploy();

    console.log("signMessage:", signMessage);
    const message = "hahaha";
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
    const messageHash1 = ethers.toUtf8Bytes(message)
    console.log("messageHash: ", messageHash);
    const callData = signMessage.interface.encodeFunctionData(
        "signMessage",
        [messageHash]
    );
    console.log(callData);

    const txData = {
        destination: signMessage.target,
        value: 0,
        data: callData,
        operation: 1,
        nonce: saltNonce,
    };

    const walletAddress = await nxv.getAddress();

    const sortedSignatures = await signTypedData(txData, walletAddress);

    const transaction = await nxv.batchSignature(
        ...Object.values(txData),
        sortedSignatures,
        // { gasPrice: ethers.utils.parseUnits('2', 'gwei') }
    );
    const receipt = await transaction.wait();
    console.log('Transaction Hash:', receipt?.hash);

    const gasUsed = receipt?.gasUsed;

    console.log('Transaction gasUsed:', gasUsed?.toString());

    const compatiFallback = await getCompatFallbackHandler(walletAddress);
    const magicValue = await compatiFallback.isValidSignature(messageHash, "0x");
    console.log('magicValue:', magicValue);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
