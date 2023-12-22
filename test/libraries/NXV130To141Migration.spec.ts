import { expect } from "chai";
import hre, { ethers, deployments } from "hardhat";
import { getNXVWithSingleton, migrationContractFrom130To141, getNXVSingletonAt } from "../utils/setup";
import deploymentData from "../json/NXVDeployment.json";
import NXVRuntimeBytecode from "../json/NXVRuntimeBytecode.json";
import { executeContractCallWithSigners } from "../../src/utils/execution";

const NXV_SINGLETON_141_ADDRESS = "0x0787Bedd6bb2Db4c9013B736BC251e9Edd091bdC";

const COMPATIBILITY_FALLBACK_HANDLER_141 = "0x542a2e3c52E8C78300906ec29786a9E8dE33C4B9";

const FALLBACK_HANDLER_STORAGE_SLOT = "0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5";

describe("NXV130To141Migration library", () => {
    const migratedInterface = new ethers.Interface(["function masterCopy() view returns(address)"]);

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();

        // Set the runtime code for hardcoded addresses
        await hre.network.provider.send("hardhat_setCode", [NXV_SINGLETON_141_ADDRESS, NXVRuntimeBytecode.NXV141]);
        await hre.network.provider.send("hardhat_setCode", [
            COMPATIBILITY_FALLBACK_HANDLER_141,
            NXVRuntimeBytecode.NXV141fallbackHandler,
        ]);

        const signers = await ethers.getSigners();
        const [user1] = signers;
        const singleton130Address = (await (await user1.sendTransaction({ data: deploymentData.NXV130 })).wait())?.contractAddress;
        if (!singleton130Address) {
            throw new Error("Could not deploy NXV130");
        }
        const singleton130 = await getNXVSingletonAt(singleton130Address);

        const migration: any = await (await migrationContractFrom130To141()).deploy();
        return {
            NXV130: await getNXVWithSingleton(singleton130, [user1.address]),
            migration,
            signers,
        };
    });

    describe("constructor", () => {
        it("cannot be initialized if the contracts are not deployed", async () => {
            const factory = await migrationContractFrom130To141();
            await expect(factory.deploy()).to.be.revertedWith("NXV 1.2.1 Singleton is not deployed");
        });
    });

    describe("migrate", () => {
        it("can only be called from NXV itself", async () => {
            const { migration } = await setupTests();
            await expect(migration.migrate()).to.be.revertedWith("Migration should only be called via delegatecall");
        });

        it("can migrate", async () => {
            const {
                NXV130,
                migration,
                signers: [user1],
            } = await setupTests();
            const NXVAddress = await NXV130.getAddress();
            // The emit matcher checks the address, which is the NXV as delegatecall is used
            const migrationNXV = migration.attach(NXVAddress);

            await expect(executeContractCallWithSigners(NXV130, migration, "migrate", [], [user1], true))
                .to.emit(migrationNXV, "ChangedMasterCopy")
                .withArgs(NXV_SINGLETON_141_ADDRESS);

            const singletonResp = await user1.call({ to: NXVAddress, data: migratedInterface.encodeFunctionData("masterCopy") });
            await expect(migratedInterface.decodeFunctionResult("masterCopy", singletonResp)[0]).to.eq(NXV_SINGLETON_141_ADDRESS);
        });

        it("doesn't touch important storage slots", async () => {
            const {
                NXV130,
                migration,
                signers: [user1],
            } = await setupTests();
            const NXVAddress = await NXV130.getAddress();

            const ownerCountBeforeMigration = await hre.ethers.provider.getStorage(NXVAddress, 2);
            const thresholdBeforeMigration = await hre.ethers.provider.getStorage(NXVAddress, 3);
            const nonceBeforeMigration = await hre.ethers.provider.getStorage(NXVAddress, 5);

            expect(executeContractCallWithSigners(NXV130, migration, "migrate", [], [user1], true));

            expect(await hre.ethers.provider.getStorage(NXVAddress, 2)).to.be.eq(ownerCountBeforeMigration);
            expect(await hre.ethers.provider.getStorage(NXVAddress, 3)).to.be.eq(thresholdBeforeMigration);
            expect(await hre.ethers.provider.getStorage(NXVAddress, 5)).to.be.eq(nonceBeforeMigration);
        });
    });

    describe("migrateWithFallbackHandler", () => {
        it("can only be called from NXV itself", async () => {
            const { migration } = await setupTests();
            await expect(migration.migrateWithFallbackHandler()).to.be.revertedWith("Migration should only be called via delegatecall");
        });

        it("can migrate", async () => {
            const {
                NXV130,
                migration,
                signers: [user1],
            } = await setupTests();
            const NXVAddress = await NXV130.getAddress();
            // The emit matcher checks the address, which is the NXV as delegatecall is used
            const migrationNXV = migration.attach(NXVAddress);

            await expect(executeContractCallWithSigners(NXV130, migration, "migrateWithFallbackHandler", [], [user1], true))
                .to.emit(migrationNXV, "ChangedMasterCopy")
                .withArgs(NXV_SINGLETON_141_ADDRESS)
                .and.to.emit(NXV130, "ChangedFallbackHandler")
                .withArgs(COMPATIBILITY_FALLBACK_HANDLER_141);

            const singletonResp = await user1.call({ to: NXVAddress, data: migratedInterface.encodeFunctionData("masterCopy") });
            await expect(migratedInterface.decodeFunctionResult("masterCopy", singletonResp)[0]).to.eq(NXV_SINGLETON_141_ADDRESS);

            expect(await NXV130.getStorageAt(FALLBACK_HANDLER_STORAGE_SLOT, 1)).to.eq(
                "0x" + COMPATIBILITY_FALLBACK_HANDLER_141.slice(2).toLowerCase().padStart(64, "0"),
            );
        });

        it("doesn't touch important storage slots", async () => {
            const {
                NXV130,
                migration,
                signers: [user1],
            } = await setupTests();
            const NXVAddress = await NXV130.getAddress();

            const ownerCountBeforeMigration = await hre.ethers.provider.getStorage(NXVAddress, 2);
            const thresholdBeforeMigration = await hre.ethers.provider.getStorage(NXVAddress, 3);
            const nonceBeforeMigration = await hre.ethers.provider.getStorage(NXVAddress, 5);

            await expect(executeContractCallWithSigners(NXV130, migration, "migrateWithFallbackHandler", [], [user1], true));

            expect(await hre.ethers.provider.getStorage(NXVAddress, 2)).to.be.eq(ownerCountBeforeMigration);
            expect(await hre.ethers.provider.getStorage(NXVAddress, 3)).to.be.eq(thresholdBeforeMigration);
            expect(await hre.ethers.provider.getStorage(NXVAddress, 5)).to.be.eq(nonceBeforeMigration);
        });
    });
});
