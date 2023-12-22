import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const Address0 = "0x".padEnd(42, "0");

export const walletAddress = '0x0B92A6Ee55E526690c0a31c3753AcC582e12CF45';

// Safe Owner Private Keys
const owner1PrivateKey = process.env.OWNER1_PRIVATE_KEY ?? '';
const owner2PrivateKey = process.env.OWNER2_PRIVATE_KEY ?? '';
// Safe Owner Sign Private Keys
export const ownerSignKey1 = process.env.OWNER1_PRIVATE_KEY_SIGN ?? '';
export const ownerSignKey2 = process.env.OWNER2_PRIVATE_KEY_SIGN ?? '';

const goerliAPI = process.env.QuickNode_API_KEY ?? '';
const provider = new ethers.JsonRpcProvider(goerliAPI);

export const owner1Wallet = new ethers.Wallet(owner1PrivateKey, provider);
export const owner2Wallet = new ethers.Wallet(owner2PrivateKey, provider);

export const walletImplementationAddress = '0x0787Bedd6bb2Db4c9013B736BC251e9Edd091bdC';

export const getWalletImplementation = async () => {
    return await ethers.getContractAt("MultiSigWallet", walletImplementationAddress);
};

export const getWalletProxy = async () => {
    const walletImpl = await getWalletImplementation();
    return walletImpl.attach(walletAddress) as any;
};

export const saltNonce: number = new Date().getTime();
