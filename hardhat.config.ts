import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import "hardhat-deploy";
import { DeterministicDeploymentInfo } from "hardhat-deploy/dist/types";
import "./src/tasks/local_verify";
import "./src/tasks/deploy_contracts";
import "./src/tasks/show_codesize";

import 'dotenv/config';
import { version } from 'yargs';
require("dotenv").config({ path: ".env" });
import "./src/tasks/deploy_contracts_single";

const privateKey1 = process.env.PRIVATE_KEY1 || "";
const privateKey2 = process.env.PRIVATE_KEY2 || "";
const mnemonic = process.env.MNEMONIC || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  paths: {
    artifacts: "build/artifacts",
    cache: "build/cache",
    deploy: "src/deploy",
    sources: "contracts",
  },
  typechain: {
      outDir: "typechain-types",
      target: "ethers-v6",
  },
  solidity: {
    compilers: [ {version: "0.8.6"}, {version: "0.7.5"}, {version: "0.6.5"} ],
  },
  networks: {
    localhost: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 30000000,
      gas: 30000000
    },
    goerli: {
      // url: 'https://eth-goerli.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
      url: process.env.ALCHEMY_API_KEY,
      // accounts: mnemonic ? { mnemonic } : undefined,
      accounts: [
        privateKey1,
        privateKey2
      ],
      gas: 3000000,
      // gasPrice: 2000000000,
      allowUnlimitedContractSize: true
    },
  },
  // deterministicDeployment,
  namedAccounts: {
    deployer: 0,
  },
  mocha: {
      timeout: 2000000,
  },
  // paths: {
  //   deploy: './src/deploy', // 确保这里的路径指向你的部署脚本所在的目录
  //   // ... 其他路径配置
  // },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  // Constructor arguments are not required for Sourcify verification
  sourcify: {
    enabled: true,
  },
};

export default config;
