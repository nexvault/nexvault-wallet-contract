import { ethers, BigNumberish } from "ethers";
import { buildContractCall, MetaTransaction, NXVTransaction } from "./execution";
import { MultiSend } from "../../typechain-types";

const encodeMetaTransaction = (tx: MetaTransaction): string => {
    const data = ethers.getBytes(tx.data);
    const encoded = ethers.solidityPacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [tx.operation, tx.destination, tx.value, data.length, data],
    );
    return encoded.slice(2);
};

export const encodeMultiSend = (txs: MetaTransaction[]): string => {
    return "0x" + txs.map((tx) => encodeMetaTransaction(tx)).join("");
};

export const buildMultiSendNXVTx = async (
    multiSend: MultiSend,
    txs: MetaTransaction[],
    nonce: BigNumberish,
    overrides?: Partial<NXVTransaction>,
): Promise<NXVTransaction> => {
    return buildContractCall(multiSend, "multiSend", [encodeMultiSend(txs)], nonce, true, overrides);
};
