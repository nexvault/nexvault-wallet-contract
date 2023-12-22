import hre, { deployments } from "hardhat";
import { Contract, Signer } from "ethers";
import { AddressZero } from "@ethersproject/constants";
import solc from "solc";
import { logGas } from "../../src/utils/execution";
import { nxvContractUnderTest } from "./config";
import { getRandomIntAsString } from "./numbers";
import { MultiSigWallet } from "../../typechain-types";

export const defaultTokenCallbackHandlerDeployment = async () => {
    return await deployments.get("TokenCallbackHandler");
};

export const defaultTokenCallbackHandlerContract = async () => {
    return await hre.ethers.getContractFactory("TokenCallbackHandler");
};

export const compatFallbackHandlerDeployment = async () => {
    return await deployments.get("CompatibilityFallbackHandler");
};

export const compatFallbackHandlerContract = async () => {
    return await hre.ethers.getContractFactory("CompatibilityFallbackHandler");
};

export const getNXVSingleton = async () => {
    const NXVDeployment = await deployments.get(nxvContractUnderTest());
    const NXV = await hre.ethers.getContractAt(nxvContractUnderTest(), NXVDeployment.address);
    return NXV;
};

export const getNXVSingletonContract = async () => {
    const NXVSingleton = await hre.ethers.getContractFactory("MultiSigWallet");

    return NXVSingleton;
};

export const getNXVL2SingletonContract = async () => {
    const NXVSingleton = await hre.ethers.getContractFactory("NXVL2");

    return NXVSingleton;
};

export const getNXVSingletonContractFromEnvVariable = async () => {
    return await getNXVSingletonContract();
};

export const getNXVSingletonAt = async (address: string) => {
    const NXV = await hre.ethers.getContractAt(nxvContractUnderTest(), address);
    return NXV as unknown as MultiSigWallet;
};

export const getFactoryContract = async () => {
    const factory = await hre.ethers.getContractFactory("MultiSigWalletFactory");

    return factory;
};

export const getFactory = async () => {
    const FactoryDeployment = await deployments.get("MultiSigWalletFactory");
    const Factory = await hre.ethers.getContractAt("MultiSigWalletFactory", FactoryDeployment.address);
    return Factory;
};

export const getFactoryAt = async (address: string) => {
    const Factory = await hre.ethers.getContractAt("MultiSigWalletFactory", address);
    return Factory;
};

export const getSimulateTxAccessor = async () => {
    const SimulateTxAccessorDeployment = await deployments.get("SimulateTxAccessor");
    const SimulateTxAccessor = await hre.ethers.getContractAt("SimulateTxAccessor", SimulateTxAccessorDeployment.address);
    return SimulateTxAccessor;
};

export const getMultiSend = async () => {
    const MultiSendDeployment = await deployments.get("MultiSend");
    const MultiSend = await hre.ethers.getContractAt("MultiSend", MultiSendDeployment.address);
    return MultiSend;
};

export const getMultiSendCallOnly = async () => {
    const MultiSendDeployment = await deployments.get("MultiSendCallOnly");
    const MultiSend = await hre.ethers.getContractAt("MultiSendCallOnly", MultiSendDeployment.address);
    return MultiSend;
};

export const getCreateCall = async () => {
    const CreateCallDeployment = await deployments.get("CreateCall");
    const CreateCall = await hre.ethers.getContractAt("CreateCall", CreateCallDeployment.address);
    return CreateCall;
};

export const migrationContract = async () => {
    return await hre.ethers.getContractFactory("Migration");
};

export const migrationContractTo150 = async () => {
    return await hre.ethers.getContractFactory("NXV150Migration");
};

export const migrationContractFrom130To141 = async () => {
    return await hre.ethers.getContractFactory("NXVMigration");
};

export const getMock = async () => {
    const Mock = await hre.ethers.getContractFactory("MockContract");
    return await Mock.deploy();
};

export const getNXVTemplate = async (saltNumber: string = getRandomIntAsString()) => {
    const singleton = await getNXVSingleton();
    // console.log("singleton address: ", singleton.address);
    const singletonAddress = await singleton.getAddress();
    const factory = await getFactory();
    const template = await factory.createMultiSigWallet.staticCall(singletonAddress, "0x", saltNumber);
    await factory.createMultiSigWallet(singletonAddress, "0x", saltNumber).then((tx: any) => tx.wait());
    const NXV = await getNXVSingletonContractFromEnvVariable();
    return NXV.attach(template) as MultiSigWallet;
};

export const getNXVWithOwners = async (
    owners: string[],
    threshold?: number,
    fallbackHandler?: string,
    logGasUsage?: boolean,
    saltNumber: string = getRandomIntAsString(),
) => {
    // console.log(owners)
    const template = await getNXVTemplate(saltNumber);
    // console.log(template)
    await logGas(
        `Setup NXV with ${owners.length} owner(s)${fallbackHandler && fallbackHandler !== AddressZero ? " and fallback handler" : ""}`,
        template.initialize(owners, threshold || owners.length, fallbackHandler || AddressZero),
        !logGasUsage,
    );
    return template;
};

export const getNXVWithSingleton = async (
    singleton: MultiSigWallet,
    owners: string[],
    threshold?: number,
    fallbackHandler?: string,
    saltNumber: string = getRandomIntAsString(),
) => {
    const factory = await getFactory();
    const singletonAddress = await singleton.getAddress();
    const template = await factory.createMultiSigWallet.staticCall(singletonAddress, "0x", saltNumber);
    await factory.createMultiSigWallet(singletonAddress, "0x", saltNumber).then((tx: any) => tx.wait());
    const NXVProxy = singleton.attach(template) as MultiSigWallet;
    await NXVProxy.initialize(
        owners,
        threshold || owners.length,
        fallbackHandler || AddressZero,
    );

    return NXVProxy;
};

export const getTokenCallbackHandler = async (address?: string) => {
    const tokenCallbackHandler = await hre.ethers.getContractAt(
        "TokenCallbackHandler",
        address || (await defaultTokenCallbackHandlerDeployment()).address,
    );

    return tokenCallbackHandler;
};

export const getCompatFallbackHandler = async (address?: string) => {
    const fallbackHandler = await hre.ethers.getContractAt(
        "CompatibilityFallbackHandler",
        address || (await compatFallbackHandlerDeployment()).address,
    );

    return fallbackHandler;
};

export const getNXVProxyRuntimeCode = async () => {
    const proxyArtifact = await hre.artifacts.readArtifact("MultiSigWalletProxy");

    return proxyArtifact.deployedBytecode;
};

export const getDelegateCaller = async () => {
    const DelegateCaller = await hre.ethers.getContractFactory("DelegateCaller");
    return await DelegateCaller.deploy();
};

export const compile = async (source: string) => {
    const input = JSON.stringify({
        language: "Solidity",
        settings: {
            outputSelection: {
                "*": {
                    "*": ["abi", "evm.bytecode"],
                },
            },
        },
        sources: {
            "tmp.sol": {
                content: source,
            },
        },
    });
    const solcData = await solc.compile(input);
    const output = JSON.parse(solcData);
    if (!output["contracts"]) {
        console.log(output);
        throw Error("Could not compile contract");
    }
    const fileOutput = output["contracts"]["tmp.sol"];
    const contractOutput = fileOutput[Object.keys(fileOutput)[0]];
    const abi = contractOutput["abi"];
    const data = "0x" + contractOutput["evm"]["bytecode"]["object"];
    return {
        data: data,
        interface: abi,
    };
};

export const deployContract = async (deployer: Signer, source: string): Promise<Contract> => {
    const output = await compile(source);
    const transaction = await deployer.sendTransaction({ data: output.data, gasLimit: 6000000 });
    const receipt = await transaction.wait();

    if (!receipt?.contractAddress) {
        throw Error("Could not deploy contract");
    }

    return new Contract(receipt.contractAddress, output.interface, deployer);
};
