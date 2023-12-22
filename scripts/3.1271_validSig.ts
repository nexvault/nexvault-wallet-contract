import { signMessage, signTypedData } from "./utils/general";
import hre, { deployments, ethers } from "hardhat";
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

    const {nxv} = await setupTests();
    const walletAddress = await nxv.getAddress();

    const walletProxy: any = await getCompatFallbackHandler(walletAddress);
    // console.log(await walletProxy.address);

    const message = "hahaha";
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));

    const sortedSignatures = await signMessage(messageHash, walletAddress);

    const magicValue = await walletProxy.isValidSignature(
        messageHash,
        sortedSignatures,
        // { gasPrice: ethers.utils.parseUnits('2', 'gwei') }
    );
    
    console.log('magicValue:', magicValue);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
