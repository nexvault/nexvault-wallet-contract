import { expect } from "chai";
import hre from "hardhat";
import { getContractStorageLayout } from "../utils/storage";

const EXPECTED_LAYOUT = [
    { name: "singleton", slot: "0", offset: 0, type: "t_address" },
    {
        name: "owners",
        slot: "1",
        offset: 0,
        type: "t_mapping(t_address,t_address)",
    },
    { name: "ownerCount", slot: "2", offset: 0, type: "t_uint256" },
    { name: "threshold", slot: "3", offset: 0, type: "t_uint256" },
    {
        name: "txExists",
        slot: "4",
        offset: 0,
        type: "t_mapping(t_bytes32,t_bool)",
    },
    {
        name: "txNonces",
        slot: "5",
        offset: 0,
        type: "t_mapping(t_uint256,t_bool)",
    },
    {
        name: "signedMessages",
        slot: "6",
        offset: 0,
        type: "t_mapping(t_bytes32,t_uint256)",
    },
];

describe("NXVStorage", () => {
    it("follows the expected storage layout", async () => {
        const NXVStorageLayout = await getContractStorageLayout(hre, "NXVStorage");

        expect(NXVStorageLayout).to.deep.eq(EXPECTED_LAYOUT);
    });
});
