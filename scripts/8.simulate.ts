import hre, { deployments, ethers } from "hardhat";
import { getNXVWithOwners, getCompatFallbackHandler, compatFallbackHandlerDeployment } from "../test/utils/setup";

async function main() {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture(); // this will run all deploy scripts
        const signers = await ethers.getSigners();
        const [user1, user2] = signers;
        console.log(user1.address);
        return {
            nxv: await getNXVWithOwners([user1.address, user2.address], 2, (await compatFallbackHandlerDeployment()).address),
        }
    });

    const {nxv} = await setupTests();
    const walletAddress = await nxv.getAddress();
    const compatiFallback = await getCompatFallbackHandler(walletAddress);

    const signMessage = await (await hre.ethers.getContractFactory("SignMessageLib")).deploy();

    const message = "hahahaha";
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
    // const messageHash1 = ethers.toUtf8Bytes(message)
    console.log("multiData: ", messageHash);
    
    const callData = signMessage.interface.encodeFunctionData(
        "getMessageHash",
        [messageHash]
    );
    console.log(callData);
    
    const res = await compatiFallback.simulate.staticCall(
        signMessage.target,
        callData
        // { gasPrice: ethers.utils.parseUnits('2', 'gwei') }
    );
    console.log('Result:', res);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
