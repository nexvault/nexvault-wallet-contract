import { signTypedData } from "./utils/general";
import hre, { ethers, deployments } from "hardhat";
import { saltNonce } from "./utils/constants";
import { getNXVWithOwners, compatFallbackHandlerDeployment } from "../test/utils/setup";

// 先部署NFT合约，然后mint两个token，然后将第二个token转给NXV合约，然后调用NXV合约的batchSignature方法，
// 调用NFT合约的safeTransferFrom方法，将token转回去
// safeTransferFrom方法, safeTransferFrom会检查接收者是否实现了onERC721Received方法
async function main() {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture(); // this will run all deploy scripts
        const signers = await ethers.getSigners();
        const [user1, user2] = signers;
        return {
            nxv: await getNXVWithOwners([user1.address, user2.address], 2, (await compatFallbackHandlerDeployment()).address),
        }
    });

    const {nxv} = await setupTests() as {nxv: any};

    const walletAddress = await nxv.getAddress();

    const [deployer] = await ethers.getSigners();
   
    const nftContract: any = await (await hre.ethers.getContractFactory("MyNFT")).deploy();
    
    const callData = nftContract.interface.encodeFunctionData(
        "mint",
        []
    );
    console.log(callData);

    const tx1 = await nftContract.connect(deployer).mint();
    const receipt1 = await tx1.wait();
    console.log('Transaction Hash:', receipt1.hash);
    const tx2 = await nftContract.connect(deployer).mint();
    const receipt2 = await tx2.wait();
    console.log('Transaction Hash:', receipt2.hash);

    const index = await nftContract.tokenOfOwnerByIndex(deployer.address, 1);
    console.log("deploy token:", index);

    const from = await deployer.getAddress();
    const tx3 = await nftContract["safeTransferFrom(address,address,uint256)"](from, walletAddress, index);
    const receipt3 = await tx3.wait();
    console.log('Transaction Hash:', receipt3.hash);
    const nxvIndex = await nftContract.tokenOfOwnerByIndex(walletAddress, 0);
    console.log("NXV token:", nxvIndex);
    // process.exit(0);

    const data = nftContract.interface.encodeFunctionData(
        "safeTransferFrom(address,address,uint256)",
        [walletAddress, from, nxvIndex]
    );

    const txData = {
        destination: await nftContract.getAddress(),
        value: 0,
        data: data,
        operation: 0,
        nonce: saltNonce,
    };

    const sortedSignatures = await signTypedData(txData, walletAddress);

    const transaction = await nxv.batchSignature(
        ...Object.values(txData),
        sortedSignatures,
        // { gasPrice: ethers.utils.parseUnits('2', 'gwei') }
    );
    const receipt = await transaction.wait();
    console.log('Transaction Hash:', receipt.hash);

    const gasUsed = receipt.gasUsed;

    console.log('Transaction gasUsed:', gasUsed.toString());

    const indexAfter = await nftContract.tokenOfOwnerByIndex(deployer.address, 1);
    console.log("deploy token:", indexAfter);
    // const nxvIndexAfter = await nftContract.tokenOfOwnerByIndex(walletAddress, 0);
    // console.log("NXV token:", nxvIndexAfter);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
