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
    const SENTINEL_OWNERS: string = "0x0000000000000000000000000000000000000001";

    const prevOwner = signers[0].address;
    const removeOwner = signers[1].address;

    const removeOwnerData = walletImpl.interface.encodeFunctionData(
        "removeOwner",
        [prevOwner, removeOwner, 1]
    );
    console.log("addOwner function data:", removeOwnerData);

    const walletAddress = await nxv.getAddress();

    const txData = {
        destination: walletAddress,
        value: 0,
        data: removeOwnerData,
        operation: 0,
        nonce: saltNonce,
    };
    console.log('Transaction data is:', txData)

    const sortedSignatures = await signTypedData(txData, walletAddress)

    const ownersBefore = await nxv.getOwners();
    console.log("owners before:", ownersBefore);
    const transaction = await nxv.batchSignature(
        ...Object.values(txData),
        sortedSignatures
    );
    const receipt = await transaction.wait();
    console.log('Transaction Hash:', receipt?.hash);

    const gasUsed = receipt?.gasUsed;

    console.log('Transaction gasUsed:', gasUsed?.toString());
    const ownersAfter = await nxv.getOwners();
    console.log("owners after:", ownersAfter);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});