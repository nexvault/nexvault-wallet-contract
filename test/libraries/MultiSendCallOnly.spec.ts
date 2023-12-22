import { expect } from "chai";
import hre, { deployments, ethers } from "hardhat";
import { deployContract, getMock, getMultiSendCallOnly, getNXVWithOwners, getDelegateCaller } from "../utils/setup";
import { buildContractCall, buildNXVTransaction, executeTx, executeTxWithSigners, MetaTransaction } from "../../src/utils/execution";
import { buildMultiSendNXVTx } from "../../src/utils/multisend";


let nonce: any;
describe("MultiSendCallOnly", () => {
    nonce = new Date().getTime()
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const setterSource = `
            contract StorageSetter {
                function setStorage(bytes3 data) public {
                    bytes32 slot = 0x4242424242424242424242424242424242424242424242424242424242424242;
                    // solhint-disable-next-line no-inline-assembly
                    assembly {
                        sstore(slot, data)
                    }
                }
            }`;
        const signers = await ethers.getSigners();
        const [user1] = signers;
        const storageSetter = await deployContract(user1, setterSource);
        return {
            NXV: await getNXVWithOwners([user1.address]),
            multiSend: await getMultiSendCallOnly(),
            // mock: await getMock(),
            // delegateCaller: await getDelegateCaller(),
            storageSetter,
            signers,
        };
    });

    describe("multiSend", () => {
        it("Should fail when using invalid operation", async () => {
            const {
                NXV,
                multiSend,
                signers: [user1, user2],
            } = await setupTests();

            const txs = [buildNXVTransaction({ destination: user2.address, operation: 2, nonce: 0 })];
            const NXVTx = await buildMultiSendNXVTx(multiSend, txs, nonce);

            // await expect(executeTx(NXV, NXVTx, [await NXVApproveHash(user1, NXV, NXVTx, true)])).to.revertedWith("GS013");
            await expect(executeTxWithSigners(NXV, NXVTx, [user1])).to.revertedWith("call-failed");
        });

        it("Should fail when using delegatecall operation", async () => {
            const {
                NXV,
                multiSend,
                signers: [user1, user2],
            } = await setupTests();

            const txs = [buildNXVTransaction({ destination: user2.address, operation: 1, nonce: 0 })];
            const NXVTx = await buildMultiSendNXVTx(multiSend, txs, nonce);
            await expect(executeTxWithSigners(NXV, NXVTx, [user1])).to.revertedWith("call-failed");
        });

        it("Can execute empty multisend", async () => {
            const {
                NXV,
                multiSend,
                signers: [user1],
            } = await setupTests();

            const txs: MetaTransaction[] = [];
            const NXVTx = await buildMultiSendNXVTx(multiSend, txs, nonce);
            await expect(executeTxWithSigners(NXV, NXVTx, [user1])).to.emit(NXV, "ExecutionSuccess");
        });

        it("Can execute single ether transfer", async () => {
            const {
                NXV,
                multiSend,
                signers: [user1, user2],
            } = await setupTests();
            await user1.sendTransaction({ to: await NXV.getAddress(), value: ethers.parseEther("1") });
            const userBalance = await hre.ethers.provider.getBalance(user2.address);
            await expect(await hre.ethers.provider.getBalance(await NXV.getAddress())).to.be.deep.eq(ethers.parseEther("1"));

            const txs: MetaTransaction[] = [buildNXVTransaction({ destination: user2.address, value: ethers.parseEther("1"), nonce: 0 })];
            const NXVTx = await buildMultiSendNXVTx(multiSend, txs, nonce);
            await expect(executeTxWithSigners(NXV, NXVTx, [user1])).to.emit(NXV, "ExecutionSuccess");

            await expect(await hre.ethers.provider.getBalance(await NXV.getAddress())).to.eq(ethers.parseEther("0"));
            await expect(await hre.ethers.provider.getBalance(user2.address)).to.eq(userBalance + ethers.parseEther("1"));
        });

        it("reverts all tx if any fails", async () => {
            const {
                NXV,
                multiSend,
                signers: [user1, user2],
            } = await setupTests();
            await user1.sendTransaction({ to: await NXV.getAddress(), value: ethers.parseEther("1") });
            const userBalance = await hre.ethers.provider.getBalance(user2.address);
            await expect(await hre.ethers.provider.getBalance(await NXV.getAddress())).to.eq(ethers.parseEther("1"));

            const txs: MetaTransaction[] = [
                buildNXVTransaction({ destination: user2.address, value: ethers.parseEther("1"), nonce: 0 }),
                buildNXVTransaction({ destination: user2.address, value: ethers.parseEther("1"), nonce: 0 }),
            ];
            const NXVTx = await buildMultiSendNXVTx(multiSend, txs, nonce);
            await expect(executeTxWithSigners(NXV, NXVTx, [user1])).to.revertedWith("call-failed");

            await expect(await hre.ethers.provider.getBalance(await NXV.getAddress())).to.eq(ethers.parseEther("1"));
            await expect(await hre.ethers.provider.getBalance(user2.address)).to.eq(userBalance);
        });

        it("can be used when ETH is sent with execution", async () => {
            const {
                NXV,
                multiSend,
                storageSetter,
                signers: [user1],
            } = await setupTests();

            const txs: MetaTransaction[] = [await buildContractCall(storageSetter, "setStorage", ["0xbaddad"], 0)];
            const NXVTx = await buildMultiSendNXVTx(multiSend, txs, nonce);

            await expect(await hre.ethers.provider.getBalance(await NXV.getAddress())).to.eq(ethers.parseEther("0"));
            await expect(executeTxWithSigners(NXV, NXVTx, [user1], { value: ethers.parseEther("1") })).to.emit(NXV, "ExecutionSuccess");

            await expect(await hre.ethers.provider.getBalance(await NXV.getAddress())).to.eq(ethers.parseEther("1"));
        });

        it("can execute contract calls", async () => {
            const {
                NXV,
                multiSend,
                storageSetter,
                signers: [user1],
            } = await setupTests();
            const storageSetterAddress = await storageSetter.getAddress();

            const txs: MetaTransaction[] = [await buildContractCall(storageSetter, "setStorage", ["0xbaddad"], 0)];
            const NXVTx = await buildMultiSendNXVTx(multiSend, txs, nonce);
            await expect(executeTxWithSigners(NXV, NXVTx, [user1])).to.emit(NXV, "ExecutionSuccess");

            await expect(
                await hre.ethers.provider.getStorage(
                    await NXV.getAddress(),
                    "0x4242424242424242424242424242424242424242424242424242424242424242",
                ),
            ).to.be.eq("0x" + "".padEnd(64, "0"));
            await expect(
                await hre.ethers.provider.getStorage(
                    storageSetterAddress,
                    "0x4242424242424242424242424242424242424242424242424242424242424242",
                ),
            ).to.be.eq("0x" + "baddad".padEnd(64, "0"));
        });

        it("can execute combinations", async () => {
            const {
                NXV,
                multiSend,
                storageSetter,
                signers: [user1, user2],
            } = await setupTests();
            const storageSetterAddress = await storageSetter.getAddress();

            await user1.sendTransaction({ to: await NXV.getAddress(), value: ethers.parseEther("1") });
            const userBalance = await hre.ethers.provider.getBalance(user2.address);
            await expect(await hre.ethers.provider.getBalance(await NXV.getAddress())).to.eq(ethers.parseEther("1"));

            const txs: MetaTransaction[] = [
                buildNXVTransaction({ destination: user2.address, value: ethers.parseEther("1"), nonce: 0 }),
                await buildContractCall(storageSetter, "setStorage", ["0xbaddad"], 0),
            ];
            const NXVTx = await buildMultiSendNXVTx(multiSend, txs, nonce);
            await expect(executeTxWithSigners(NXV, NXVTx, [user1])).to.emit(NXV, "ExecutionSuccess");

            await expect(await hre.ethers.provider.getBalance(await NXV.getAddress())).to.eq(ethers.parseEther("0"));
            await expect(await hre.ethers.provider.getBalance(user2.address)).to.eq(userBalance + ethers.parseEther("1"));
            await expect(
                await hre.ethers.provider.getStorage(
                    await NXV.getAddress(),
                    "0x4242424242424242424242424242424242424242424242424242424242424242",
                ),
            ).to.be.eq("0x" + "".padEnd(64, "0"));
            await expect(
                await hre.ethers.provider.getStorage(
                    storageSetterAddress,
                    "0x4242424242424242424242424242424242424242424242424242424242424242",
                ),
            ).to.be.eq("0x" + "baddad".padEnd(64, "0"));
        });

        // it("can bubble up revert message on call", async () => {
        //     const { delegateCaller, multiSend, mock } = await setupTests();
        //     const mockAddress = await mock.getAddress();
        //     const multisendAddress = await multiSend.getAddress();

        //     const triggerCalldata = "0xbaddad";
        //     const errorMessage = "Some random message";

        //     await mock.givenCalldataRevertWithMessage(triggerCalldata, errorMessage);

        //     const txs: MetaTransaction[] = [
        //         {
        //             destination: mockAddress,
        //             value: 0,
        //             data: triggerCalldata,
        //             operation: 0,
        //         },
        //     ];
        //     const { data } = await buildMultiSendNXVTx(multiSend, txs, 0);

        //     await expect(delegateCaller.makeDelegatecall.staticCall(multisendAddress, data)).to.be.revertedWith(errorMessage);
        // });
    });
});
