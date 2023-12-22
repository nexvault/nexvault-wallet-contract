import { Signer, BigNumberish, BaseContract } from "ethers";
import { AddressZero } from "@ethersproject/constants";
import { MultiSigWallet } from "../../typechain-types";
import { Sign } from "crypto";
import { ethers } from "hardhat";

export const EIP_DOMAIN = {
    EIP712Domain: [
        { type: "string", name: "name" },
        { type: "string", name: "version" },
        { type: "uint256", name: "chainId" },
        { type: "address", name: "verifyingContract" },
    ],
};

export const EIP712_NXV_TX_TYPE = {
    // "NXVTx(address to,uint256 value,bytes data,uint8 operation,uint256 NXVTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
    Transaction: [
        { type: "address", name: "destination" },
        { type: "uint256", name: "value" },
        { type: "bytes", name: "data" },
        { type: "uint8", name: "operation" },
        { type: "uint256", name: "nonce" },
    ],
};

export const EIP712_NXV_MESSAGE_TYPE = {
    // "NXVMessage(bytes message)"
    NXVMessage: [{ type: "bytes", name: "message" }],
};

export interface MetaTransaction {
    destination: string;
    value: BigNumberish;
    data: string;
    operation: number;
}

export interface NXVTransaction extends MetaTransaction {
    nonce: BigNumberish;
}

export interface NXVSignature {
    signer: string;
    data: string;
    // a flag to indicate if the signature is a contract signature and the data has to be appended to the dynamic part of signature bytes
    dynamic?: true;
}

export const calculateNXVDomainSeparator = (NXVAddress: string, chainId: BigNumberish): string => {
    return ethers.TypedDataEncoder.hashDomain({ verifyingContract: NXVAddress, chainId });
};

export const preimageNXVTransactionHash = (NXVAddress: string, NXVTx: NXVTransaction, chainId: BigNumberish): string => {
    return ethers.TypedDataEncoder.encode({ verifyingContract: NXVAddress, chainId }, EIP712_NXV_TX_TYPE, NXVTx);
};

export const calculateNXVTransactionHash = (NXVAddress: string, NXVTx: NXVTransaction, chainId: BigNumberish): string => {
    return ethers.TypedDataEncoder.hash({ verifyingContract: NXVAddress, chainId }, EIP712_NXV_TX_TYPE, NXVTx);
};

export const preimageNXVMessageHash = (NXVAddress: string, message: string, chainId: BigNumberish): string => {
    return ethers.TypedDataEncoder.encode({ verifyingContract: NXVAddress, chainId }, EIP712_NXV_MESSAGE_TYPE, { message });
};

export const calculateNXVMessageHash = (NXVAddress: string, message: string, chainId: BigNumberish): string => {
    return ethers.TypedDataEncoder.hash({ name: "MultiSigWallet", version: "2", verifyingContract: NXVAddress, chainId }, EIP712_NXV_MESSAGE_TYPE, { message });
};

// export const NXVApproveHash = async (
//     signer: Signer,
//     NXV: MultiSigWallet,
//     NXVTx: NXVTransaction,
//     skipOnChainApproval?: boolean,
// ): Promise<NXVSignature> => {
//     if (!skipOnChainApproval) {
//         if (!signer.provider) throw Error("Provider required for on-chain approval");
//         const chainId = (await signer.provider.getNetwork()).chainId;
//         const NXVAddress = await NXV.getAddress();
//         const typedDataHash = calculateNXVTransactionHash(NXVAddress, NXVTx, chainId);
//         const signerNXV = NXV.connect(signer);
//         await signerNXV.approveHash(typedDataHash);
//     }
//     const signerAddress = await signer.getAddress();
//     return {
//         signer: signerAddress,
//         data:
//             "0x000000000000000000000000" +
//             signerAddress.slice(2) +
//             "0000000000000000000000000000000000000000000000000000000000000000" +
//             "01",
//     };
// };

export const NXVSignTypedData = async (
    signer: any,
    NXVAddress: string,
    NXVTx: NXVTransaction,
    chainId?: BigNumberish,
): Promise<NXVSignature> => {
    
    // if (!chainId && !signer.provider) throw Error("Provider required to retrieve chainId");
    // const cid = chainId || (await signer.provider!.getNetwork()).chainId;
    // const { chainId } = await ethers.provider.getNetwork();
    const cid = chainId || (await ethers.provider.getNetwork()).chainId;
    const signerAddress = await signer.getAddress();
    // console.log("signerAddress", signerAddress);
    const domain = {
        name: 'MultiSigWallet',
        version: '2',
        chainId: cid,
        verifyingContract: NXVAddress
    };
    
    const types = {
        Transaction:[
            { name: "destination", type: "address" },
            { name: "value", type: "uint256" },
            { name: "data", type: "bytes" },
            { name: "operation", type: "uint8" },
            { name: "nonce", type: "uint256" },
        ]
    };
    const sig = await signer.signTypedData(domain, types, NXVTx);
    return {
        signer: signerAddress,
        data: await signer.signTypedData(domain, types, NXVTx),
    };
};

export const signHash = async (signer: Signer, hash: string): Promise<NXVSignature> => {
    const typedDataHash = ethers.getBytes(hash);
    const signerAddress = await signer.getAddress();
    return {
        signer: signerAddress,
        data: (await signer.signMessage(typedDataHash)).replace(/1b$/, "1f").replace(/1c$/, "20"),
    };
};

export const NXVSignMessage = async (
    signer: Signer,
    NXVAddress: string,
    NXVTx: NXVTransaction,
    chainId?: BigNumberish,
): Promise<NXVSignature> => {
    const cid = chainId || (await signer.provider!.getNetwork()).chainId;
    return signHash(signer, calculateNXVTransactionHash(NXVAddress, NXVTx, cid));
};

export const buildContractSignature = (signerAddress: string, signature: string): NXVSignature => {
    return {
        signer: signerAddress,
        data: signature,
        dynamic: true,
    };
};

export const buildSignatureBytes = (signatures: NXVSignature[]): string => {
    const SIGNATURE_LENGTH_BYTES = 65;
    signatures.sort((left, right) => left.signer.toLowerCase().localeCompare(right.signer.toLowerCase()));

    let signatureBytes = "0x";
    let dynamicBytes = "";
    for (const sig of signatures) {
        if (sig.dynamic) {
            /* 
                A contract signature has a static part of 65 bytes and the dynamic part that needs to be appended 
                at the end of signature bytes.
                The signature format is
                Signature type == 0
                Constant part: 65 bytes
                {32-bytes signature verifier}{32-bytes dynamic data position}{1-byte signature type}
                Dynamic part (solidity bytes): 32 bytes + signature data length
                {32-bytes signature length}{bytes signature data}
            */
            const dynamicPartPosition = (signatures.length * SIGNATURE_LENGTH_BYTES + dynamicBytes.length / 2)
                .toString(16)
                .padStart(64, "0");
            const dynamicPartLength = (sig.data.slice(2).length / 2).toString(16).padStart(64, "0");
            const staticSignature = `${sig.signer.slice(2).padStart(64, "0")}${dynamicPartPosition}00`;
            const dynamicPartWithLength = `${dynamicPartLength}${sig.data.slice(2)}`;

            signatureBytes += staticSignature;
            dynamicBytes += dynamicPartWithLength;
        } else {
            signatureBytes += sig.data.slice(2);
        }
    }

    return signatureBytes + dynamicBytes;
};

export const logGas = async (message: string, tx: Promise<any>, skip?: boolean): Promise<any> => {
    return tx.then(async (result) => {
        const receipt = await result.wait();
        if (!skip) console.log("           Used", receipt.gasUsed, `gas for >${message}<`);
        return result;
    });
};

export const executeTx = async (NXV: MultiSigWallet, NXVTx: NXVTransaction, signatures: NXVSignature[], overrides?: any): Promise<any> => {
    const signatureBytes = buildSignatureBytes(signatures);
    // console.log("signatureBytes", signatureBytes);
    return NXV.batchSignature(
        NXVTx.destination,
        NXVTx.value,
        NXVTx.data,
        NXVTx.operation,
        NXVTx.nonce,  // todo
        signatureBytes,
        overrides || {},
    );
};

export const buildContractCall = async (
    contract: BaseContract,
    method: string,
    params: any[],
    nonce: BigNumberish,
    delegateCall?: boolean,
    overrides?: Partial<NXVTransaction>,
): Promise<NXVTransaction> => {
    const data = contract.interface.encodeFunctionData(method, params);
    const contractAddress = await contract.getAddress();

    return buildNXVTransaction(
        Object.assign(
            {
                destination: contractAddress,
                data,
                operation: delegateCall ? 1 : 0,
                nonce,
            },
            overrides,
        ),
    );
};

export const executeTxWithSigners = async (NXV: MultiSigWallet, tx: NXVTransaction, signers: Signer[], overrides?: any) => {
    const NXVAddress = await NXV.getAddress();
    const sigs = await Promise.all(signers.map((signer) => NXVSignTypedData(signer, NXVAddress, tx)));
    // console.log("sigs", sigs);
    return executeTx(NXV, tx, sigs, overrides);
};

export const executeContractCallWithSigners = async (
    NXV: MultiSigWallet,
    contract: BaseContract,
    method: string,
    params: any[],
    signers: Signer[],
    delegateCall?: boolean,
    overrides?: Partial<NXVTransaction>,
) => {
    const saltNonce: number = new Date().getTime();
    const tx = await buildContractCall(contract, method, params, saltNonce, delegateCall, overrides);
    return executeTxWithSigners(NXV, tx, signers);
};

export const buildNXVTransaction = (template: {
    destination: string;
    value?: BigNumberish;
    data?: string;
    operation?: number;
    nonce: BigNumberish;
}): NXVTransaction => {
    return {
        destination: template.destination,
        value: template.value || 0,
        data: template.data || "0x",
        operation: template.operation || 0,
        nonce: template.nonce,
    };
};
