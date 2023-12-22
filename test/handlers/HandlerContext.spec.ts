import { expect } from "chai";
import hre, { deployments, ethers } from "hardhat";
import { AddressZero } from "@ethersproject/constants";
import { getNXVTemplate } from "../utils/setup";

describe("HandlerContext", () => {
    const setup = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const TestHandler = await hre.ethers.getContractFactory("TestHandler");
        const handler = await TestHandler.deploy();
        const signers = await ethers.getSigners();
        return {
            NXV: await getNXVTemplate(),
            handler,
            signers,
        };
    });

    it("parses information correctly", async () => {
        const {
            handler,
            signers: [user1, user2],
        } = await setup();
        const handlerAddress = await handler.getAddress();

        const response = await user1.call({
            to: handlerAddress,
            data: handler.interface.encodeFunctionData("dudududu") + user2.address.slice(2),
        });
        expect(handler.interface.decodeFunctionResult("dudududu", response)).to.be.deep.eq([user2.address, user1.address]);
    });

    it("works with the NXV", async () => {
        const {
            NXV,
            handler,
            signers: [user1, user2],
        } = await setup();
        const handlerAddress = await handler.getAddress();
        const NXVAddress = await NXV.getAddress();
        await NXV.initialize([user1.address, user2.address], 1, handlerAddress);

        const response = await user1.call({
            to: NXVAddress,
            data: handler.interface.encodeFunctionData("dudududu"),
        });

        expect(handler.interface.decodeFunctionResult("dudududu", response)).to.be.deep.eq([user1.address, NXVAddress]);
    });
});
