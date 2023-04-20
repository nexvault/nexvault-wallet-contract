import { ethers } from "hardhat";

async function main() {
    const walletFactory = await ethers.getContractAt("MultiSigWalletFactory", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
    const walletImplementation = await ethers.getContractAt("MultiSigWalletImplementation", "0xCafac3dD18aC6c6e92c921884f9E4176737C052c");

    const accounts = await ethers.getSigners();
    const owners = [
        accounts[0].address,
        accounts[1].address
    ];
    const walletAddress = '0x0CfcF5A8F5A24F25B553E244B927ddf9315d2d78';

    console.log('MultiSigWalletProxy is:', walletAddress);

    const { chainId } = await ethers.provider.getNetwork();
    const domain = {
        name: 'MultiSigWallet',
        version: '2',
        chainId: chainId,
        verifyingContract: walletAddress
    };
    const types = {
        Transaction: [
            { name: "nonce", type: "uint" },
            { name: "destination", type: "address" },
            { name: "value", type: "uint" },
            { name: "data", type: "bytes" },
        ]
    };

    const txData = {
        nonce: 1,
        destination: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        value: ethers.utils.parseEther('0.1'),
        data: '0x'
    };
    console.log('Transaction data is:', txData)

    const signatures = [];

    const sig0 = await accounts[0]._signTypedData(domain, types, txData);
    const sig0_params = ethers.utils.splitSignature(sig0);
    const sig0_r = sig0_params.r;
    const sig0_s = sig0_params.s;
    const sig0_v = sig0_params.v;
    signatures.push({
        signer: accounts[0].address,
        r: sig0_r,
        s: sig0_s,
        v: sig0_v
    })

    const sig1 = await accounts[1]._signTypedData(domain, types, txData);
    const sig1_params = ethers.utils.splitSignature(sig1);
    const sig1_r = sig1_params.r;
    const sig1_s = sig1_params.s;
    const sig1_v = sig1_params.v;
    signatures.push({
        signer: accounts[1].address,
        r: sig1_r,
        s: sig1_s,
        v: sig1_v
    })

    console.log(`Signer ${owners[0]} signature is: ${sig0}`);
    console.log(`${sig0_r}, ${sig0_s}, ${sig0_v}`);
    console.log(`Signer ${owners[1]} signature is: ${sig1}`);
    console.log(`${sig1_r}, ${sig1_s}, ${sig1_v}`);

    console.log(`${ethers.utils.verifyTypedData(domain, types, txData, sig0)}`);
    console.log(`${ethers.utils.verifyTypedData(domain, types, txData, sig1)}`);

    const walletImpl = walletImplementation.attach(walletAddress);

    const sortedSignatures = signatures.sort((a: any, b: any) => a.signer - b.signer);
    const transaction = await walletImpl.batchSignature(
        txData,
        sortedSignatures
    );
    const receipt = await transaction.wait();
    console.log('Transaction Hash:', receipt.transactionHash);

    const gasUsed = receipt.gasUsed;

    console.log('Transaction gasUsed:', gasUsed.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});