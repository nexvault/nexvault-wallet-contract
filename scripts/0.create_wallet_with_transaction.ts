import { ethers } from "hardhat";

async function main() {
    const walletFactory = await ethers.getContractAt("MultiSigWalletFactory", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
    const walletImplementation = await ethers.getContractAt("MultiSigWalletImplementation", "0xCafac3dD18aC6c6e92c921884f9E4176737C052c");
    
    const accounts = await ethers.getSigners();
    const owners = [
        accounts[0].address,
        accounts[1].address
    ];
    const required = 2;
    const nonce = 1;
    const walletAddress = await walletFactory.calculateMultiSigWalletAddress(
        walletImplementation.address,
        owners,
        required,
        nonce
    );
    console.log('MultiSigWalletProxy will be deployed to:', walletAddress);
    
    console.log('Sending 0.1 Ether to this MultiSigWallet contract will be deployed...');
    
    await accounts[0].sendTransaction({
        to: walletAddress,
        value: ethers.utils.parseEther('0.1')
    });
    
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
        nonce: 0,
        destination: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        value: ethers.utils.parseEther('0.001'),
        data: "0x",
    };

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

    const transaction = await walletFactory.createMultiSigWalletWithTransaction(
        walletImplementation.address,
        owners,
        required,
        nonce,
        txData,
        signatures
    );
    const receipt = await transaction.wait();
    const event = receipt.events?.find((event: { event: string; }) => event.event === 'NewMultiSigWalletCreated');
    const walletAddress2 = event?.args[0];
    console.log('MultiSigWalletProxy deployed to:', walletAddress2);
    console.log('Deployment Hash:', receipt.transactionHash);

    const gasUsed = receipt.gasUsed;

    console.log('Transaction gasUsed:', gasUsed.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});