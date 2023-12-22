import { expect } from "chai";
import hre, { deployments, ethers } from "hardhat";
import { AddressZero } from "@ethersproject/constants";
import { getCompatFallbackHandler, getNXVWithOwners } from "../utils/setup";
import {
    buildSignatureBytes,
    executeContractCallWithSigners,
    calculateNXVMessageHash,
    buildContractSignature,
    EIP712_NXV_MESSAGE_TYPE,
    signHash,
} from "../../src/utils/execution";
import { chainId } from "../utils/encoding";
import { killLibContract } from "../utils/contracts";

describe("CompatibilityFallbackHandler", () => {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const signLib = await (await hre.ethers.getContractFactory("SignMessageLib")).deploy();
        const handler = await getCompatFallbackHandler();
        const handlerAddress = await handler.getAddress();
        const signers = await ethers.getSigners();
        const [user1, user2] = signers;
        const signerNXV = await getNXVWithOwners([user1.address], 1, handlerAddress);
        const signerNXVAddress = await signerNXV.getAddress();
        const NXV = await getNXVWithOwners([user1.address, user2.address, signerNXVAddress], 1, handlerAddress);
        const NXVAddress = await NXV.getAddress();
        const validator = await getCompatFallbackHandler(NXVAddress);
        const killLib = await killLibContract(user1);
        return {
            NXV,
            validator,
            handler,
            killLib,
            signLib,
            signerNXV,
            signers,
        };
    });

    describe("ERC1155", () => {
        it("to handle onERC1155Received", async () => {
            const { handler } = await setupTests();
            await expect(await handler.onERC1155Received.staticCall(AddressZero, AddressZero, 0, 0, "0x")).to.be.eq("0xf23a6e61");
        });

        it("to handle onERC1155BatchReceived", async () => {
            const { handler } = await setupTests();
            await expect(await handler.onERC1155BatchReceived.staticCall(AddressZero, AddressZero, [], [], "0x")).to.be.eq("0xbc197c81");
        });
    });

    describe("ERC721", () => {
        it("to handle onERC721Received", async () => {
            const { handler } = await setupTests();
            await expect(await handler.onERC721Received.staticCall(AddressZero, AddressZero, 0, "0x")).to.be.eq("0x150b7a02");
        });
    });

    describe("ERC777", () => {
        it("to handle tokensReceived", async () => {
            const { handler } = await setupTests();
            await handler.tokensReceived.staticCall(AddressZero, AddressZero, AddressZero, 0, "0x", "0x");
        });
    });

    describe("isValidSignature(bytes32,bytes)", () => {
        it("should revert if called directly", async () => {
            const { handler } = await setupTests();
            const dataHash = ethers.keccak256("0xbaddad");
            await expect(handler.isValidSignature.staticCall(dataHash, "0x")).to.be.reverted;
        });

        it("should revert if message was not signed", async () => {
            const { validator } = await setupTests();
            const dataHash = ethers.keccak256("0xbaddad");
            await expect(validator.isValidSignature.staticCall(dataHash, "0x")).to.be.revertedWith("Hash not approved");
        });

        it("should revert if signature is not valid", async () => {
            const { validator } = await setupTests();
            const dataHash = ethers.keccak256("0xbaddad");
            await expect(validator.isValidSignature.staticCall(dataHash, "0xdeaddeaddeaddead")).to.be.reverted;
        });

        it("should return magic value if message was signed", async () => {
            const {
                NXV,
                validator,
                signLib,
                signers: [user1, user2],
            } = await setupTests();
            const dataHash = ethers.keccak256("0xbaddad");
            await executeContractCallWithSigners(NXV, signLib, "signMessage", [dataHash], [user1, user2], true);
            expect(await validator.isValidSignature.staticCall(dataHash, "0x")).to.be.eq("0x1626ba7e");
        });

        it("should return magic value if enough owners signed and allow a mix different signature types", async () => {
            const {
                validator,
                signerNXV,
                signers: [user1, user2],
            } = await setupTests();
            const signerNXVAddress = await signerNXV.getAddress();
            const validatorAddress = await validator.getAddress();
            const dataHash = ethers.keccak256("0xbaddad");
            const typedDataSig = {
                signer: user1.address,
                data: await user1.signTypedData(
                    { name: "MultiSigWallet", version: "2", verifyingContract: validatorAddress, chainId: await chainId() },
                    EIP712_NXV_MESSAGE_TYPE,
                    { message: dataHash },
                ),
            };
            const ethSignSig = await signHash(user2, calculateNXVMessageHash(validatorAddress, dataHash, await chainId()));
            const validatorNXVMessageHash = calculateNXVMessageHash(validatorAddress, dataHash, await chainId());
            const signerNXVMessageHash = calculateNXVMessageHash(signerNXVAddress, validatorNXVMessageHash, await chainId());

            const signerNXVOwnerSignature = await signHash(user1, signerNXVMessageHash);

            const signerNXVSig = buildContractSignature(signerNXVAddress, signerNXVOwnerSignature.data);

            // console.log(buildSignatureBytes([typedDataSig]))
            expect(
                await validator.isValidSignature.staticCall(dataHash, buildSignatureBytes([typedDataSig])),
            ).to.be.eq("0x1626ba7e");
        });
    });

    describe("getMessageHash", () => {
        it("should generate the correct hash", async () => {
            const { NXV, validator } = await setupTests();
            const NXVAddress = await NXV.getAddress();
            expect(await validator.getMessageHash("0xdead")).to.be.eq(calculateNXVMessageHash(NXVAddress, "0xdead", await chainId()));
        });
    });

    describe("getMessageHashForNXV", () => {
        it("should revert if target does not return domain separator", async () => {
            const { handler } = await setupTests();
            const handlerAddress = await handler.getAddress();
            await expect(handler.getMessageHashForNxv(handlerAddress, "0xdead")).to.be.reverted;
        });

        it("should generate the correct hash", async () => {
            const { handler, NXV } = await setupTests();
            const NXVAddress = await NXV.getAddress();
            expect(await handler.getMessageHashForNxv(NXVAddress, "0xdead")).to.be.eq(
                calculateNXVMessageHash(NXVAddress, "0xdead", await chainId()),
            );
        });
    });

    describe("simulate", () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        it("can be called for any NXV", async () => {});

        it("should revert changes", async () => {
            const { validator, killLib } = await setupTests();
            const validatorAddress = await validator.getAddress();
            const killLibAddress = await killLib.getAddress();
            const code = await ethers.provider.getCode(validatorAddress);
            expect(await validator.simulate.staticCall(killLibAddress, killLib.interface.encodeFunctionData("killme"))).to.be.eq("0x");
            expect(await ethers.provider.getCode(validatorAddress)).to.be.eq(code);
        });

        it("should return result", async () => {
            const { validator, killLib, handler } = await setupTests();
            const killLibAddress = await killLib.getAddress();
            const handlerAddress = await handler.getAddress();
            expect(await validator.simulate.staticCall(killLibAddress, killLib.interface.encodeFunctionData("expose"))).to.be.eq(
                "0x000000000000000000000000" + handlerAddress.slice(2).toLowerCase(),
            );
        });

        it("should propagate revert message", async () => {
            const { validator, killLib } = await setupTests();
            const killLibAddress = await killLib.getAddress();
            await expect(validator.simulate.staticCall(killLibAddress, killLib.interface.encodeFunctionData("trever"))).to.revertedWith(
                "Why are you doing this?",
            );
        });

        it("should simulate transaction", async () => {
            const { validator, killLib } = await setupTests();
            const validatorAddress = await validator.getAddress();
            const killLibAddress = await killLib.getAddress();
            const estimate = await validator.simulate.staticCall(
                killLibAddress,
                killLib.interface.encodeFunctionData("estimate", [validatorAddress, "0x"]),
            );
            expect(parseInt(estimate, 16)).to.be.lte(5000);
        });

        it("should return modified state", async () => {
            const { validator, killLib } = await setupTests();
            const killLibAddress = await killLib.getAddress();
            const value = await validator.simulate.staticCall(killLibAddress, killLib.interface.encodeFunctionData("updateAndGet", []));
            expect(value).to.be.eq(1n);
            expect(await killLib.value()).to.be.eq(0n);
        });
    });
});
