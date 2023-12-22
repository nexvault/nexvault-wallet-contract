import { ethers } from "hardhat";

export const calculateProxyAddress = async (
    factoryAddress: string, 
    singletonAddress: string, 
    initializer: string, 
    saltNonce: number | string
): Promise<string> => {

    // 获取MultiSigWalletProxy的创建代码
    const factory = await ethers.getContractAt("MultiSigWalletFactory", factoryAddress);
    const creationCode = await factory.getDeployedCode();
    const abiCoder = new ethers.AbiCoder();

    // 计算盐值
    const salt = ethers.keccak256(
        
        abiCoder.encode(
            ["bytes32", "uint256"],
            [ethers.keccak256(initializer), saltNonce]
        )
    );

    // 计算部署数据
    const deploymentData = ethers.solidityPacked(
        ["bytes", "uint256"],
        [creationCode, singletonAddress]
    );

    // 计算预测的地址
    const predictedAddress = ethers.getCreate2Address(
        factoryAddress,
        salt,
        ethers.keccak256(deploymentData)
    );

    return predictedAddress;
}

export const calculateProxyAddressWithCallback = async (
    factoryAddress: string,
    singletonAddress: string,
    initializer: string,
    saltNonce: number,
    callback: string
): Promise<string> => {
    const saltNonceWithCallback = ethers.keccak256(ethers.solidityPacked(
        ["uint256", "address"],
        [saltNonce, callback]
    ));
    return calculateProxyAddress(factoryAddress, singletonAddress, initializer, saltNonceWithCallback);
}

// 使用示例
async function main() {
    const address = await calculateProxyAddress(
        "0x4D4f384735F02129976d917Eb86F8E221a449B00",  // MultiSigWalletFactory地址
        "0x7D5cbc892Fc2F2306F66f121ca026A8A1fBb958F",  // MultiSigWalletImplementation地址
        "0xb63e800d0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000ccaebfd032e5ebdd3a18ee3ad2b9c34f831ec74700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000003bc227a261bcf868a2d3c347cf3eea8edbedca6d000000000000000000000000ecdca1ea78b7b827262ad1b08825245a4cabf2170000000000000000000000000000000000000000000000000000000000000000", // 初始化数据
        12345
    );
    console.log(address);

}

main();


// export const calculateProxyAddressWithCallback = async (
//     factory: SafeProxyFactory,
//     singleton: string,
//     inititalizer: string,
//     nonce: number | string,
//     callback: string,
// ) => {
//     const saltNonceWithCallback = ethers.solidityPackedKeccak256(["uint256", "address"], [nonce, callback]);
//     return calculateProxyAddress(factory, singleton, inititalizer, saltNonceWithCallback);
// };

// export const calculateChainSpecificProxyAddress = async (
//     factory: SafeProxyFactory,
//     singleton: string,
//     inititalizer: string,
//     nonce: number | string,
//     chainId: BigNumberish,
// ) => {
//     const factoryAddress = await factory.getAddress();
//     const deploymentCode = ethers.solidityPacked(["bytes", "uint256"], [await factory.proxyCreationCode(), singleton]);
//     const salt = ethers.solidityPackedKeccak256(
//         ["bytes32", "uint256", "uint256"],
//         [ethers.solidityPackedKeccak256(["bytes"], [inititalizer]), nonce, chainId],
//     );
//     return ethers.getCreate2Address(factoryAddress, salt, ethers.keccak256(deploymentCode));
// };
