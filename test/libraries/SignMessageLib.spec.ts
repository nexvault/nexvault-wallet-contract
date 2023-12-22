import { expect } from "chai";
import hre, { deployments, ethers } from "hardhat";
import { getNXVWithOwners } from "../utils/setup";
import { executeContractCallWithSigners, calculateNXVMessageHash } from "../../src/utils/execution";
import { chainId } from "../utils/encoding";

describe("SignMessageLib", () => {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const lib = await (await hre.ethers.getContractFactory("SignMessageLib")).deploy();
        const signers = await ethers.getSigners();
        const [user1, user2] = signers;
        return {
            NXV: await getNXVWithOwners([user1.address, user2.address]),
            lib,
            signers,
        };
    });

    describe("signMessage", () => {
        it("can only if msg.sender provides domain separator", async () => {
            const { lib } = await setupTests();
            await expect(lib.signMessage("0xbaddad")).to.be.reverted;
        });

        it("should emit event", async () => {
            const {
                NXV,
                lib,
                signers: [user1, user2],
            } = await setupTests();
            const NXVAddress = await NXV.getAddress();
            // Required to check that the event was emitted from the right address
            const libNXV = lib.attach(NXVAddress);
            const messageHash = calculateNXVMessageHash(NXVAddress, "0xbaddad", await chainId());

            expect(await NXV.signedMessages(messageHash)).to.be.eq(0);

            await expect(executeContractCallWithSigners(NXV, lib, "signMessage", ["0xbaddad"], [user1, user2], true))
                .to.emit(libNXV, "SignMsg")
                .withArgs(messageHash);

            expect(await NXV.signedMessages(messageHash)).to.be.eq(1);
        });

        it("can be used only via DELEGATECALL opcode", async () => {
            const { lib } = await setupTests();

            // ethers v6 throws instead of reverting
            await expect(lib.signMessage("0xbaddad")).to.be.rejectedWith(
                "function selector was not recognized and there's no fallback function",
            );
        });

        it("changes the expected storage slot without touching the most important ones", async () => {
            const {
                NXV,
                lib,
                signers: [user1, user2],
            } = await setupTests();

            const NXVAddress = await NXV.getAddress();
            const SIGNED_MESSAGES_MAPPING_STORAGE_SLOT = 6;
            const message = "no rugpull, funds must be safu";
            const eip191MessageHash = hre.ethers.hashMessage(message);
            const NXVInternalMsgHash = calculateNXVMessageHash(NXVAddress, hre.ethers.hashMessage(message), await chainId());
            const expectedStorageSlot = hre.ethers.keccak256(
                hre.ethers.AbiCoder.defaultAbiCoder().encode(
                    ["bytes32", "uint256"],
                    [NXVInternalMsgHash, SIGNED_MESSAGES_MAPPING_STORAGE_SLOT],
                ),
            );

            const masterCopyAddressBeforeSigning = await hre.ethers.provider.getStorage(await NXV.getAddress(), 0);
            const ownerCountBeforeSigning = await hre.ethers.provider.getStorage(await NXV.getAddress(), 3);
            const thresholdBeforeSigning = await hre.ethers.provider.getStorage(await NXV.getAddress(), 4);
            // const nonceBeforeSigning = await hre.ethers.provider.getStorage(await NXV.getAddress(), 5);
            const msgStorageSlotBeforeSigning = await hre.ethers.provider.getStorage(await NXV.getAddress(), expectedStorageSlot);

            // expect(nonceBeforeSigning).to.be.eq(`0x${"0".padStart(64, "0")}`);
            expect(await NXV.signedMessages(NXVInternalMsgHash)).to.be.eq(0);
            expect(msgStorageSlotBeforeSigning).to.be.eq(`0x${"0".padStart(64, "0")}`);

            await executeContractCallWithSigners(NXV, lib, "signMessage", [eip191MessageHash], [user1, user2], true);

            const masterCopyAddressAfterSigning = await hre.ethers.provider.getStorage(await NXV.getAddress(), 0);
            const ownerCountAfterSigning = await hre.ethers.provider.getStorage(await NXV.getAddress(), 3);
            const thresholdAfterSigning = await hre.ethers.provider.getStorage(await NXV.getAddress(), 4);
            // const nonceAfterSigning = await hre.ethers.provider.getStorage(await NXV.getAddress(), 5);
            const msgStorageSlotAfterSigning = await hre.ethers.provider.getStorage(await NXV.getAddress(), expectedStorageSlot);

            expect(await NXV.signedMessages(NXVInternalMsgHash)).to.be.eq(1);
            expect(masterCopyAddressBeforeSigning).to.be.eq(masterCopyAddressAfterSigning);
            expect(thresholdBeforeSigning).to.be.eq(thresholdAfterSigning);
            expect(ownerCountBeforeSigning).to.be.eq(ownerCountAfterSigning);
            // expect(nonceAfterSigning).to.be.eq(`0x${"1".padStart(64, "0")}`);
            expect(msgStorageSlotAfterSigning).to.be.eq(`0x${"1".padStart(64, "0")}`);
        });
    });
});
