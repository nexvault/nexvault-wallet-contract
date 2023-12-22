import { expect } from "chai";
import { deployments, ethers, userConfig } from "hardhat";
import { AddressZero } from "@ethersproject/constants";
import { getNXVWithOwners } from "../utils/setup";
import { executeContractCallWithSigners } from "../../src/utils/execution";
import { AddressOne } from "../../src/utils/constants";

describe("OwnerManager", () => {

    // beforeEach(async () => {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture(); // 这将会运行所有的部署脚本
        const signers = await ethers.getSigners();
        const [user1] = signers;
        // console.log(user1.address);
        return {
            nxv: await getNXVWithOwners([user1.address]),
            signers,
        }
    });

    describe("addOwnerWithThreshold", () => {
        it("can only be called from NXV itself", async () => {
            const {
                nxv,
                signers: [, user2],
            } = await setupTests();
            await expect(nxv.addOwnerWithThreshold(user2.address, 1)).to.be.revertedWith("Only be called from this contract");
            // console.log(signers[0].address);
            // console.log(multiSigWallet);
        });

        it("can not set NXV itself", async () => {
            const {
                nxv,
                signers: [user1],
            } = await setupTests();
            const NXVAddress = await nxv.getAddress();

            await expect(executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [NXVAddress, 1], [user1])).to.revertedWith(
                "call-failed",
            );
        });

        it("can not set sentinel", async () => {
            const {
                nxv,
                signers: [user1],
            } = await setupTests();

            await expect(executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [AddressOne, 1], [user1])).to.revertedWith(
                "call-failed",
            );
        });

        it("can not set 0 Address", async () => {
            const {
                nxv,
                signers: [user1],
            } = await setupTests();
            await expect(executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [AddressZero, 1], [user1])).to.revertedWith(
                "call-failed",
            );
        });

        it("can not add owner twice", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1]);

            await expect(executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1])).to.revertedWith(
                "call-failed",
            );
        });

        it("can not add owner and change threshold to 0", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await expect(executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 0], [user1])).to.revertedWith(
                "call-failed",
            );
        });

        it("can not add owner and change threshold to larger number than new owner count", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await expect(executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 3], [user1])).to.revertedWith(
                "call-failed",
            );
        });

        it("emits event for new owner", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await expect(executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1]))
                .to.emit(nxv, "AddedOwner")
                .withArgs(user2.address)
                .and.to.not.emit(nxv, "ChangedThreshold");

            await expect(await nxv.getThreshold()).to.equal(1n);
            await expect(await nxv.isOwner(user1.address)).to.be.true;
            await expect(await nxv.getOwners()).to.deep.eq([user2.address, user1.address]);
        });

        it("emits event for new owner and threshold if changed", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await expect(executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 2], [user1]))
                .to.emit(nxv, "AddedOwner")
                .withArgs(user2.address)
                .and.to.emit(nxv, "ChangedThreshold")
                .withArgs(2);

            await expect(await nxv.getThreshold()).to.be.deep.eq(2n);
            await expect(await nxv.isOwner(user1.address)).to.be.true;
            await expect(await nxv.getOwners()).to.be.deep.equal([user2.address, user1.address]);
        });
    });

    describe("removeOwner", () => {
        it("can only be called from NXV itself", async () => {
            const {
                nxv,
                signers: [, user2],
            } = await setupTests();
            await expect(nxv.removeOwner(AddressOne, user2.address, 1)).to.be.revertedWith("Only be called from this contract");
        });

        it("can not remove sentinel", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1]);

            await expect(executeContractCallWithSigners(nxv, nxv, "removeOwner", [AddressOne, AddressOne, 1], [user1])).to.revertedWith(
                "call-failed",
            );
        });

        it("can not remove 0 Address", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1]);

            await expect(executeContractCallWithSigners(nxv, nxv, "removeOwner", [AddressOne, AddressZero, 1], [user1])).to.revertedWith(
                "call-failed",
            );
        });

        it("Invalid prevOwner, owner pair provided - Invalid target", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1]);
            await expect(
                executeContractCallWithSigners(nxv, nxv, "removeOwner", [AddressOne, user1.address, 1], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("Invalid prevOwner, owner pair provided - Invalid sentinel", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1]);
            await expect(
                executeContractCallWithSigners(nxv, nxv, "removeOwner", [AddressZero, user2.address, 1], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("Invalid prevOwner, owner pair provided - Invalid source", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1]);
            await expect(
                executeContractCallWithSigners(nxv, nxv, "removeOwner", [user1.address, user2.address, 1], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("can not remove owner and change threshold to larger number than new owner count", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1]);
            await expect(
                executeContractCallWithSigners(nxv, nxv, "removeOwner", [user2.address, user1.address, 2], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("can not remove owner and change threshold to 0", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1]);
            await expect(
                executeContractCallWithSigners(nxv, nxv, "removeOwner", [user2.address, user1.address, 0], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("can not remove owner only owner", async () => {
            const {
                nxv,
                signers: [user1],
            } = await setupTests();
            await expect(
                executeContractCallWithSigners(nxv, nxv, "removeOwner", [AddressOne, user1.address, 1], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("emits event for removed owner and threshold if changed", async () => {
            const {
                nxv,
                signers: [user1, user2, user3],
            } = await setupTests();
            await executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1]);
            await executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user3.address, 2], [user1]);
            await expect(await nxv.getOwners()).to.be.deep.equal([user3.address, user2.address, user1.address]);
            await expect(await nxv.getThreshold()).to.be.deep.eq(2n);
            await expect(await nxv.isOwner(user1.address)).to.be.true;
            await expect(await nxv.isOwner(user2.address)).to.be.true;
            await expect(await nxv.isOwner(user3.address)).to.be.true;

            await expect(executeContractCallWithSigners(nxv, nxv, "removeOwner", [user3.address, user2.address, 1], [user1, user2]))
                .to.emit(nxv, "RemovedOwner")
                .withArgs(user2.address)
                .and.to.emit(nxv, "ChangedThreshold")
                .withArgs(1);
            await expect(await nxv.getOwners()).to.be.deep.equal([user3.address, user1.address]);
            await expect(await nxv.getThreshold()).to.be.deep.eq(1n);
            await expect(await nxv.isOwner(user1.address)).to.be.true;
            await expect(await nxv.isOwner(user2.address)).to.be.false;
            await expect(await nxv.isOwner(user3.address)).to.be.true;

            await expect(executeContractCallWithSigners(nxv, nxv, "removeOwner", [AddressOne, user3.address, 1], [user1]))
                .to.emit(nxv, "RemovedOwner")
                .withArgs(user3.address)
                .and.to.not.emit(nxv, "ChangedThreshold");
            await expect(await nxv.getThreshold()).to.be.deep.eq(1n);
            await expect(await nxv.isOwner(user1.address)).to.be.true;
            await expect(await nxv.isOwner(user2.address)).to.be.false;
            await expect(await nxv.isOwner(user3.address)).to.be.false;
            await expect(await nxv.getOwners()).to.be.deep.equal([user1.address]);
        });

        it("Check internal ownerCount state", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await executeContractCallWithSigners(nxv, nxv, "addOwnerWithThreshold", [user2.address, 1], [user1]);
            await expect(
                executeContractCallWithSigners(nxv, nxv, "removeOwner", [user2.address, user1.address, 2], [user1]),
            ).to.revertedWith("call-failed");
        });
    });

    describe("swapOwner", () => {
        it("can only be called from NXV itself", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await expect(nxv.swapOwner(AddressOne, user1.address, user2.address)).to.be.revertedWith("Only be called from this contract");
        });

        it("can not swap in NXV itself", async () => {
            const {
                nxv,
                signers: [user1],
            } = await setupTests();
            const NXVAddress = await nxv.getAddress();

            await expect(
                executeContractCallWithSigners(nxv, nxv, "swapOwner", [AddressOne, user1.address, NXVAddress], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("can not swap in sentinel", async () => {
            const {
                nxv,
                signers: [user1],
            } = await setupTests();

            await expect(
                executeContractCallWithSigners(nxv, nxv, "swapOwner", [AddressOne, user1.address, AddressOne], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("can not swap in 0 Address", async () => {
            const {
                nxv,
                signers: [user1],
            } = await setupTests();

            await expect(
                executeContractCallWithSigners(nxv, nxv, "swapOwner", [AddressOne, user1.address, AddressZero], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("can not swap in existing owner", async () => {
            const {
                nxv,
                signers: [user1],
            } = await setupTests();

            await expect(
                executeContractCallWithSigners(nxv, nxv, "swapOwner", [AddressOne, user1.address, user1.address], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("can not swap out sentinel", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();

            await expect(
                executeContractCallWithSigners(nxv, nxv, "swapOwner", [user1.address, AddressOne, user2.address], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("can not swap out 0 address", async () => {
            const {
                nxv,
                signers: [user1, user2, user3],
            } = await setupTests();

            await expect(
                executeContractCallWithSigners(nxv, nxv, "swapOwner", [user3.address, AddressZero, user2.address], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("Invalid prevOwner, owner pair provided - Invalid target", async () => {
            const {
                nxv,
                signers: [user1, user2, user3],
            } = await setupTests();
            await expect(
                executeContractCallWithSigners(nxv, nxv, "swapOwner", [AddressOne, user3.address, user2.address], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("Invalid prevOwner, owner pair provided - Invalid sentinel", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await expect(
                executeContractCallWithSigners(nxv, nxv, "swapOwner", [AddressZero, user1.address, user2.address], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("Invalid prevOwner, owner pair provided - Invalid source", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await expect(
                executeContractCallWithSigners(nxv, nxv, "swapOwner", [user2.address, user1.address, user2.address], [user1]),
            ).to.revertedWith("call-failed");
        });

        it("emits event for replacing owner", async () => {
            const {
                nxv,
                signers: [user1, user2],
            } = await setupTests();
            await expect(await nxv.getOwners()).to.be.deep.eq([user1.address]);
            await expect(await nxv.getThreshold()).to.eq(1n);
            await expect(await nxv.isOwner(user1.address)).to.be.true;
            await expect(await nxv.isOwner(user2.address)).to.be.false;

            await expect(executeContractCallWithSigners(nxv, nxv, "swapOwner", [AddressOne, user1.address, user2.address], [user1]))
                .to.emit(nxv, "RemovedOwner")
                .withArgs(user1.address)
                .and.to.emit(nxv, "AddedOwner")
                .withArgs(user2.address);
            await expect(await nxv.getOwners()).to.be.deep.equal([user2.address]);
            await expect(await nxv.getThreshold()).to.eq(1n);
            await expect(await nxv.isOwner(user1.address)).to.be.false;
            await expect(await nxv.isOwner(user2.address)).to.be.true;
        });
    });

    describe("changeThreshold", async () => {
        it("can only be called from NXV itself", async () => {
            const { nxv } = await setupTests();
            await expect(nxv.changeThreshold(1)).to.be.revertedWith("Only be called from this contract");
        });
    });
});
