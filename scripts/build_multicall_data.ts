import { ethers } from "hardhat";

async function main() {

    const MultiSigWalletImplementation = await ethers.getContractFactory("MultiSigWalletImplementation");

    const walletImplABI = MultiSigWalletImplementation.interface.format("json");    

    const targetContract = new ethers.Contract(
        "0x0000000000000000000000000000000000000000",
        walletImplABI,
        ethers.getDefaultProvider()
    );

    const calls = [
        {
            target: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
            value: ethers.utils.parseEther('0.0011'),
            data: '0x'
        },
        {
            target: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
            value: ethers.utils.parseEther('0.0012'),
            data: '0x'
        }
    ]

    const encodedFunctionData = targetContract.interface.encodeFunctionData("multiCall", [calls]);
    console.log("Encoded function data:", encodedFunctionData);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });