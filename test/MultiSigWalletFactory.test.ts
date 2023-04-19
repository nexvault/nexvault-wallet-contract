import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "@ethersproject/contracts";

describe("MultiSigWalletFactory", async () => {

    let MultiSigWalletFactory: any, walletFactory: Contract;
    let MultiSigWalletImplementation: any, MultiSigWalletImplementationBeacon: any, MultiSigWalletProxy: any;
    let owners: string[], required: number, nonce: number;

    beforeEach(async () => {
        MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWalletFactory");
        MultiSigWalletImplementation = await ethers.getContractFactory("MultiSigWalletImplementation");
        MultiSigWalletImplementationBeacon = await ethers.getContractFactory("MultiSigWalletImplementationBeacon");
        MultiSigWalletProxy = await ethers.getContractFactory("MultiSigWalletProxy");

        walletFactory = await MultiSigWalletFactory.deploy();
        await walletFactory.deployed()

        console.log(`MultiSigWalletFactory deployed to: ${walletFactory.address}`);
    });

    describe("calculateMultiSigWalletAddress", async () => {
        owners = [
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        ];
        required = 2;
        nonce = 0;
        
        await walletFactory.calculateMultiSigWalletAddress(
            
        )
    });

    describe("createMultiSigWallet", async () => {

    });

    describe("createMultiSigWalletWithTransaction", async () => {

    });

})