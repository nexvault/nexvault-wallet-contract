import { ethers } from "ethers";

export const keccak256 = (message: string): string => {
  // 使用ethers.js库计算Keccak256哈希
  const hash = ethers.keccak256(ethers.toUtf8Bytes(message));
  return hash;
}

// 使用示例
const message = "NXVMessage(bytes message)";
const hash = keccak256(message);
console.log(`Keccak256 Hash of "${message}":`, hash);
