import { expect } from "chai";
import hre, { deployments, ethers } from "hardhat";
import { Contract } from "ethers";
import { deployContract, getFactory, getMock, getNXVWithOwners, getNXVProxyRuntimeCode } from "../utils/setup";
import { AddressZero } from "@ethersproject/constants";
import { calculateChainSpecificProxyAddress, calculateProxyAddress, calculateProxyAddressWithCallback } from "../../src/utils/proxies";
import { chainId } from "./../utils/encoding";

describe("ProxyFactory", () => {
    const SINGLETON_SOURCE = `
    contract Test {
        address _singleton;
        address public creator;
        bool public isInitialized;
        constructor() payable {
            creator = msg.sender;
        }

        function init() public {
            require(!isInitialized, "Is initialized");
            creator = msg.sender;
            isInitialized = true;
        }

        function masterCopy() public pure returns (address) {
            return address(0);
        }

        function forward(address to, bytes memory data) public returns (bytes memory result) {
            (,result) = to.call(data);
        }
    }`;

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const signers = await ethers.getSigners();
        const [user1] = signers;
        const singleton = await deployContract(user1, SINGLETON_SOURCE);
        return {
            NXV: await getNXVWithOwners([user1.address]),
            factory: await getFactory(),
            mock: await getMock(),
            singleton,
        };
    });

    describe("createMultiSigWallet", () => {
        const saltNonce = 42;

        it("should revert if singleton address is not a contract", async () => {
            const { factory } = await setupTests();
            const randomAddress = ethers.getAddress(ethers.hexlify(ethers.randomBytes(20)));
            await expect(factory.createMultiSigWallet(randomAddress, "0x", saltNonce)).to.be.revertedWith(
                "Singleton not deployed",
            );
        });

        it("should revert with invalid initializer", async () => {
            const { factory, singleton } = await setupTests();
            const singletonAddress = await singleton.getAddress();
            await expect(factory.createMultiSigWallet(singletonAddress, "0x42baddad", saltNonce)).to.be.revertedWithoutReason();
        });

        it("should emit event without initializing", async () => {
            const { factory, singleton } = await setupTests();
            const singletonAddress = await singleton.getAddress();
            const initCode = "0x";
            const proxyAddress = await calculateProxyAddress(factory, singletonAddress, initCode, saltNonce);
            await expect(factory.createMultiSigWallet(singletonAddress, initCode, saltNonce))
                .to.emit(factory, "NewMultiSigWalletCreated")
                .withArgs(proxyAddress, singletonAddress);
            const proxy = singleton.attach(proxyAddress) as Contract;

            expect(await proxy.creator()).to.be.eq(AddressZero);
            expect(await proxy.isInitialized()).to.be.eq(false);
            expect(await proxy.masterCopy()).to.be.eq(singletonAddress);
            expect(await singleton.masterCopy()).to.be.eq(AddressZero);
            expect(await hre.ethers.provider.getCode(proxyAddress)).to.be.eq(await getNXVProxyRuntimeCode());
        });

        it("should emit event with initializing", async () => {
            const { factory, singleton } = await setupTests();
            const singletonAddress = await singleton.getAddress();
            const factoryAddress = await factory.getAddress();

            const initCode = singleton.interface.encodeFunctionData("init", []);
            const proxyAddress = await calculateProxyAddress(factory, singletonAddress, initCode, saltNonce);
            await expect(factory.createMultiSigWallet(singletonAddress, initCode, saltNonce))
                .to.emit(factory, "NewMultiSigWalletCreated")
                .withArgs(proxyAddress, singletonAddress);
            const proxy = singleton.attach(proxyAddress) as Contract;
            expect(await proxy.creator()).to.be.eq(factoryAddress);
            expect(await proxy.isInitialized()).to.be.eq(true);
            expect(await proxy.masterCopy()).to.be.eq(singletonAddress);
            expect(await singleton.masterCopy()).to.be.eq(AddressZero);
            expect(await hre.ethers.provider.getCode(proxyAddress)).to.be.eq(await getNXVProxyRuntimeCode());
        });

        it("should not be able to deploy same proxy twice", async () => {
            const { factory, singleton } = await setupTests();
            const singletonAddress = await singleton.getAddress();

            const initCode = singleton.interface.encodeFunctionData("init", []);
            const proxyAddress = await calculateProxyAddress(factory, singletonAddress, initCode, saltNonce);
            await expect(factory.createMultiSigWallet(singletonAddress, initCode, saltNonce))
                .to.emit(factory, "NewMultiSigWalletCreated")
                .withArgs(proxyAddress, singletonAddress);
            await expect(factory.createMultiSigWallet(singletonAddress, initCode, saltNonce)).to.be.revertedWith("Create2 call failed");
        });
    });

    describe("createChainSpecificProxyWithNonce", () => {
        const saltNonce = 42;

        it("should revert if singleton address is not a contract", async () => {
            const { factory } = await setupTests();
            await expect(factory.createMultiSigWallet(AddressZero, "0x", saltNonce)).to.be.revertedWith("Singleton not deployed");
        });

        it("should revert with invalid initializer", async () => {
            const { factory, singleton } = await setupTests();
            const singletonAddress = await singleton.getAddress();

            await expect(factory.createMultiSigWallet(singletonAddress, "0x42baddad", saltNonce)).to.be.revertedWithoutReason();
        });

        it("should emit event without initializing", async () => {
            const { factory, singleton } = await setupTests();
            const singletonAddress = await singleton.getAddress();
            const initCode = "0x";
            const proxyAddress = await calculateProxyAddress(factory, singletonAddress, initCode, saltNonce);
            await expect(factory.createMultiSigWallet(singletonAddress, initCode, saltNonce))
                .to.emit(factory, "NewMultiSigWalletCreated")
                .withArgs(proxyAddress, singletonAddress);
            const proxy = singleton.attach(proxyAddress) as Contract;
            expect(await proxy.creator()).to.be.eq(AddressZero);
            expect(await proxy.isInitialized()).to.be.eq(false);
            expect(await proxy.masterCopy()).to.be.eq(singletonAddress);
            expect(await singleton.masterCopy()).to.be.eq(AddressZero);
            expect(await hre.ethers.provider.getCode(proxyAddress)).to.be.eq(await getNXVProxyRuntimeCode());
        });

        it("should emit event with initializing", async () => {
            const { factory, singleton } = await setupTests();
            const singletonAddress = await singleton.getAddress();
            const factoryAddress = await factory.getAddress();
            const initCode = singleton.interface.encodeFunctionData("init", []);
            const proxyAddress = await calculateProxyAddress(factory, singletonAddress, initCode, saltNonce);
            await expect(factory.createMultiSigWallet(singletonAddress, initCode, saltNonce))
                .to.emit(factory, "NewMultiSigWalletCreated")
                .withArgs(proxyAddress, singletonAddress);
            const proxy = singleton.attach(proxyAddress) as Contract;
            expect(await proxy.creator()).to.be.eq(factoryAddress);
            expect(await proxy.isInitialized()).to.be.eq(true);
            expect(await proxy.masterCopy()).to.be.eq(singletonAddress);
            expect(await singleton.masterCopy()).to.be.eq(AddressZero);
            expect(await hre.ethers.provider.getCode(proxyAddress)).to.be.eq(await getNXVProxyRuntimeCode());
        });

        it("should not be able to deploy same proxy twice", async () => {
            const { factory, singleton } = await setupTests();
            const singletonAddress = await singleton.getAddress();
            const initCode = singleton.interface.encodeFunctionData("init", []);
            const proxyAddress = await calculateProxyAddress(factory, singletonAddress, initCode, saltNonce);
            await expect(factory.createMultiSigWallet(singletonAddress, initCode, saltNonce))
                .to.emit(factory, "NewMultiSigWalletCreated")
                .withArgs(proxyAddress, singletonAddress);
            await expect(factory.createMultiSigWallet(singletonAddress, initCode, saltNonce)).to.be.revertedWith("Create2 call failed");
        });
    });
});
