import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("medication:add", "Add a medication record")
  .addParam("contract", "The address of the EncryptedMedicationRecord contract")
  .addParam("namehash", "The name hash value (number)")
  .addParam("dosage", "The dosage value (number)")
  .setAction(async (taskArgs: TaskArguments, hre) => {
    const { ethers, fhevm } = hre;
    const contractAddress = taskArgs.contract;
    const nameHash = parseInt(taskArgs.namehash);
    const dosageValue = parseInt(taskArgs.dosage);

    const [signer] = await ethers.getSigners();
    console.log(`Using signer: ${signer.address}`);

    const contract = await ethers.getContractAt("EncryptedMedicationRecord", contractAddress);

    // Encrypt name hash
    const encryptedNameHash = await fhevm
      .createEncryptedInput(contractAddress, signer.address)
      .add32(nameHash)
      .encrypt();

    // Encrypt dosage value
    const encryptedDosage = await fhevm
      .createEncryptedInput(contractAddress, signer.address)
      .add32(dosageValue)
      .encrypt();

    console.log("Adding medication record...");
    const tx = await contract
      .connect(signer)
      .addMedicationRecord(
        encryptedNameHash.handles[0],
        encryptedDosage.handles[0],
        encryptedNameHash.inputProof,
        encryptedDosage.inputProof
      );

    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log("Medication record added successfully!");
  });

task("medication:count", "Get medication record count for a user")
  .addParam("contract", "The address of the EncryptedMedicationRecord contract")
  .addParam("user", "The user address")
  .setAction(async (taskArgs: TaskArguments, hre) => {
    const { ethers } = hre;
    const contractAddress = taskArgs.contract;
    const userAddress = taskArgs.user;

    const contract = await ethers.getContractAt("EncryptedMedicationRecord", contractAddress);
    const count = await contract.getRecordCount(userAddress);
    console.log(`Record count for ${userAddress}: ${count.toString()}`);
  });

task("medication:get", "Get a medication record")
  .addParam("contract", "The address of the EncryptedMedicationRecord contract")
  .addParam("user", "The user address")
  .addParam("index", "The record index")
  .setAction(async (taskArgs: TaskArguments, hre) => {
    const { ethers, fhevm } = hre;
    const contractAddress = taskArgs.contract;
    const userAddress = taskArgs.user;
    const index = parseInt(taskArgs.index);

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("EncryptedMedicationRecord", contractAddress);
    
    const [nameHash, dosageValue, timestamp] = await contract.getMedicationRecord(userAddress, index);
    
    console.log(`Record ${index} for ${userAddress}:`);
    console.log(`  Name Hash (encrypted): ${ethers.hexlify(nameHash)}`);
    console.log(`  Dosage Value (encrypted): ${ethers.hexlify(dosageValue)}`);
    console.log(`  Timestamp: ${timestamp.toString()}`);

    // Try to decrypt if we have permission
    try {
      const decryptedNameHash = await fhevm.userDecryptEuint(
        "euint32" as any,
        nameHash,
        contractAddress,
        signer
      );
      const decryptedDosage = await fhevm.userDecryptEuint(
        "euint32" as any,
        dosageValue,
        contractAddress,
        signer
      );
      console.log(`  Decrypted Name Hash: ${decryptedNameHash}`);
      console.log(`  Decrypted Dosage: ${decryptedDosage}`);
    } catch (error) {
      console.log("  (Could not decrypt - may not have permission)");
    }
  });

