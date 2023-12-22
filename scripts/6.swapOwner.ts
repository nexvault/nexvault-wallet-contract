import { saltNonce } from "./utils/constants";
import { ethers, deployments } from "hardhat";
import { signTypedData } from "./utils/general";
import { getNXVSingleton, getNXVWithOwners } from "../test/utils/setup";

async function main() {

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture(); // this will run all deploy scripts
        const signers = await ethers.getSigners();
        const [user1, user2] = signers;
        console.log(user1.address);
        return {
            nxv: await getNXVWithOwners([user1.address, user2.address]),
            signers,
        }
    });

    const {nxv, signers} = await setupTests() as {nxv: any, signers: any[]};

    const walletImpl = await getNXVSingleton();
    
    const changeThresholdData = walletImpl.interface.encodeFunctionData(
        "changeThreshold",
        [2]
    );

    const walletAddress = await nxv.getAddress();

    const txData = {
        destination: walletAddress,
        value: 0,
        data: changeThresholdData,
        operation: 0,
        nonce: saltNonce,
    };

    const prevOwner = signers[0].address;
    const oldOwner = signers[1].address;
    const newOwner = signers[2].address;

    const swapOwnerData = walletImpl.interface.encodeFunctionData(
        "swapOwner", 
        [prevOwner, oldOwner, newOwner]
    );
    console.log("addOwner function data:", swapOwnerData);

    const txData1 = {
        destination: walletAddress,
        value: 0,
        data: swapOwnerData,
        operation: 0,
        nonce: saltNonce,
    };
    console.log('Transaction data is:', txData)

    const sortedSignatures = await signTypedData(txData1, walletAddress)

    const ownersBefore = await nxv.getOwners();
    console.log("owners before:", ownersBefore);

    const thresHoldBefore = await nxv.getThreshold();
    console.log("threshold before:", thresHoldBefore);
    // process.exit(0);
    
    const transaction = await nxv.batchSignature(
        ...Object.values(txData1),
        sortedSignatures
    );
    const receipt = await transaction.wait();
    console.log('Transaction Hash:', receipt?.hash);

    const gasUsed = receipt?.gasUsed;

    console.log('Transaction gasUsed:', gasUsed?.toString());
    const ownersAfter = await nxv.getOwners();
    console.log("owners after:", ownersAfter);
    
    const thresHoldAfter = await nxv.getThreshold();
    console.log("threshold before:", thresHoldAfter);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});