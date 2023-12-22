import { expect } from "chai";
import hre, { deployments, ethers } from "hardhat";
import { compile, getCreateCall, getNXVWithOwners } from "../utils/setup";
import { buildContractCall, executeTxWithSigners, executeTx } from "../../src/utils/execution";

const CONTRACT_SOURCE = `
contract Test {
    address public creator;
    constructor() payable {
        creator = msg.sender;
    }

    function x() public pure returns (uint) {
        return 21;
    }
}`;
let nonce: any;
describe("CreateCall", () => {
    nonce = new Date().getTime()
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const testContract = await compile(CONTRACT_SOURCE);
        const signers = await ethers.getSigners();
        const [user1] = signers;
        return {
            NXV: await getNXVWithOwners([user1.address]),
            createCall: await getCreateCall(),
            testContract,
            signers,
        };
    });

    describe("performCreate", () => {
        it("should revert if called directly and no value is on the factory", async () => {
            const { createCall, testContract } = await setupTests();
            await expect(createCall.performCreate(1, testContract.data)).to.be.revertedWith("Could not deploy contract");
        });

        it("can call factory directly", async () => {
            const {
                createCall,
                testContract,
                signers: [user1],
            } = await setupTests();
            const createCallAddress = await createCall.getAddress();
            const createCallNonce = await ethers.provider.getTransactionCount(createCallAddress);
            const address = ethers.getCreateAddress({ from: createCallAddress, nonce: createCallNonce });

            await expect(createCall.performCreate(0, testContract.data)).to.emit(createCall, "ContractCreation").withArgs(address);

            const newContract = new ethers.Contract(address, testContract.interface, user1);
            expect(await newContract.creator()).to.be.eq(createCallAddress);
        });

        it("should fail if NXV does not have value to send along", async () => {
            const {
                NXV,
                createCall,
                testContract,
                signers: [user1],
            } = await setupTests();

            const tx = await buildContractCall(createCall, "performCreate", [1, testContract.data], nonce, true);
            await expect(executeTxWithSigners(NXV, tx, [user1])).to.revertedWith("call-failed");
        });

        it("should successfully create contract and emit event", async () => {
            const {
                NXV,
                createCall,
                testContract,
                signers: [user1],
            } = await setupTests();
            const NXVAddress = await NXV.getAddress();

            const NXVEthereumNonce = await ethers.provider.getTransactionCount(NXVAddress);
            const address = ethers.getCreateAddress({ from: NXVAddress, nonce: NXVEthereumNonce });

            // We require this as 'emit' check the address of the event
            const NXVCreateCall = createCall.attach(NXVAddress);
            const tx = await buildContractCall(createCall, "performCreate", [0, testContract.data], nonce, true);
            await expect(executeTxWithSigners(NXV, tx, [user1]))
            
                .to.emit(NXV, "ExecutionSuccess")
                .and.to.emit(NXVCreateCall, "ContractCreation")
                .withArgs(address);

            const newContract = new ethers.Contract(address, testContract.interface, user1);
            expect(await newContract.creator()).to.be.eq(NXVAddress);
        });

        it("should successfully create contract and send along ether", async () => {
            const {
                NXV,
                createCall,
                testContract,
                signers: [user1],
            } = await setupTests();
            const NXVAddress = await NXV.getAddress();
            await user1.sendTransaction({ to: NXVAddress, value: ethers.parseEther("1") });
            await expect(await hre.ethers.provider.getBalance(NXVAddress)).to.eq(ethers.parseEther("1"));

            const NXVEthereumNonce = await ethers.provider.getTransactionCount(NXVAddress);
            const address = ethers.getCreateAddress({ from: NXVAddress, nonce: NXVEthereumNonce });

            // We require this as 'emit' check the address of the event
            const NXVCreateCall = createCall.attach(NXVAddress);
            const tx = await buildContractCall(
                createCall,
                "performCreate",
                [ethers.parseEther("1"), testContract.data],
                nonce,
                true,
            );
            await expect(executeTxWithSigners(NXV, tx, [user1]))
                .to.emit(NXV, "ExecutionSuccess")
                .and.to.emit(NXVCreateCall, "ContractCreation")
                .withArgs(address);

            await expect(await hre.ethers.provider.getBalance(NXVAddress)).to.eq(ethers.parseEther("0"));
            await expect(await hre.ethers.provider.getBalance(address)).to.eq(ethers.parseEther("1"));
            const newContract = new ethers.Contract(address, testContract.interface, user1);
            expect(await newContract.creator()).to.be.eq(NXVAddress);
        });
    });

    describe("performCreate2", () => {
        const salt = ethers.keccak256(ethers.toUtf8Bytes("createCall"));

        it("should revert if called directly and no value is on the factory", async () => {
            const { createCall, testContract } = await setupTests();
            await expect(createCall.performCreate2(1, testContract.data, salt)).to.be.revertedWith("Could not deploy contract");
        });

        it("can call factory directly", async () => {
            const {
                createCall,
                testContract,
                signers: [user1],
            } = await setupTests();
            const createCallAddress = await createCall.getAddress();
            const address = ethers.getCreate2Address(createCallAddress, salt, ethers.keccak256(testContract.data));

            await expect(createCall.performCreate2(0, testContract.data, salt))
                .to.emit(createCall, "ContractCreation")
                .withArgs(address);

            const newContract = new ethers.Contract(address, testContract.interface, user1);
            expect(await newContract.creator()).to.be.eq(createCallAddress);
        });

        it("should fail if NXV does not have value to send along", async () => {
            const {
                NXV,
                createCall,
                testContract,
                signers: [user1],
            } = await setupTests();

            const tx = await buildContractCall(createCall, "performCreate2", [1, testContract.data, salt], nonce, true);
            await expect(executeTxWithSigners(NXV, tx, [user1])).to.revertedWith("call-failed");
        });

        it("should successfully create contract and emit event", async () => {
            const {
                NXV,
                createCall,
                testContract,
                signers: [user1],
            } = await setupTests();
            const NXVAddress = await NXV.getAddress();

            const address = ethers.getCreate2Address(NXVAddress, salt, ethers.keccak256(testContract.data));

            // We require this as 'emit' check the address of the event
            const NXVCreateCall = createCall.attach(NXVAddress);
            const tx = await buildContractCall(createCall, "performCreate2", [0, testContract.data, salt], nonce, true);
            await expect(executeTxWithSigners(NXV, tx, [user1]))
                .to.emit(NXV, "ExecutionSuccess")
                .and.to.emit(NXVCreateCall, "ContractCreation")
                .withArgs(address);

            const newContract = new ethers.Contract(address, testContract.interface, user1);
            expect(await newContract.creator()).to.be.eq(NXVAddress);
        });

        it("should successfully create contract and send along ether", async () => {
            const {
                NXV,
                createCall,
                testContract,
                signers: [user1],
            } = await setupTests();
            const NXVAddress = await NXV.getAddress();
            await user1.sendTransaction({ to: NXVAddress, value: ethers.parseEther("1") });
            await expect(await hre.ethers.provider.getBalance(NXVAddress)).to.eq(ethers.parseEther("1"));

            const address = ethers.getCreate2Address(NXVAddress, salt, ethers.keccak256(testContract.data));

            // We require this as 'emit' check the address of the event
            const NXVCreateCall = createCall.attach(NXVAddress);
            const tx = await buildContractCall(
                createCall,
                "performCreate2",
                [ethers.parseEther("1"), testContract.data, salt],
                nonce,
                true,
            );
            await expect(executeTxWithSigners(NXV, tx, [user1]))
                .to.emit(NXV, "ExecutionSuccess")
                .and.to.emit(NXVCreateCall, "ContractCreation")
                .withArgs(address);

            await expect(await hre.ethers.provider.getBalance(NXVAddress)).to.eq(ethers.parseEther("0"));
            await expect(await hre.ethers.provider.getBalance(address)).to.eq(ethers.parseEther("1"));
            const newContract = new ethers.Contract(address, testContract.interface, user1);
            expect(await newContract.creator()).to.be.eq(NXVAddress);
        });
    });
});
