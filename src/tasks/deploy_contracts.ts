import { task } from "hardhat/config";

task("deploy-contracts", "Deploys and verifies Safe contracts").setAction(async (_, hre) => {
    await hre.run("deploy");
    await hre.run("etherscan-verify", { forceLicense: true, license: "LGPL-3.0" });
    await hre.run("sourcify");
    await hre.run("local-verify");
});

export {};