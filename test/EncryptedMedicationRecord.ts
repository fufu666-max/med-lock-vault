import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EncryptedMedicationRecord, EncryptedMedicationRecord__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedMedicationRecord")) as EncryptedMedicationRecord__factory;
  const medicationContract = (await factory.deploy()) as EncryptedMedicationRecord;
  const medicationContractAddress = await medicationContract.getAddress();

  return { medicationContract, medicationContractAddress };
}

describe("EncryptedMedicationRecord", function () {
  let signers: Signers;
  let medicationContract: EncryptedMedicationRecord;
  let medicationContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ medicationContract, medicationContractAddress } = await deployFixture());
  });

  it("should have zero records after deployment", async function () {
    const recordCount = await medicationContract.getRecordCount(signers.alice.address);
    expect(recordCount).to.eq(0);
  });

  it("should add a medication record with encrypted data", async function () {
    // Create a simple hash for medication name (using a small number for simplicity)
    // In production, this would be a proper hash of the medication name
    const nameHashValue = 12345; // Simplified hash representation
    const dosageValue = 100; // 100mg

    // Encrypt name hash
    const encryptedNameHash = await fhevm
      .createEncryptedInput(medicationContractAddress, signers.alice.address)
      .add32(nameHashValue)
      .encrypt();

    // Encrypt dosage value
    const encryptedDosage = await fhevm
      .createEncryptedInput(medicationContractAddress, signers.alice.address)
      .add32(dosageValue)
      .encrypt();

    const tx = await medicationContract
      .connect(signers.alice)
      .addMedicationRecord(
        encryptedNameHash.handles[0],
        encryptedDosage.handles[0],
        encryptedNameHash.inputProof,
        encryptedDosage.inputProof
      );
    await tx.wait();

    const recordCount = await medicationContract.getRecordCount(signers.alice.address);
    expect(recordCount).to.eq(1);

    // Get the record
    const [encryptedNameHashResult, encryptedDosageResult, timestamp] = 
      await medicationContract.getMedicationRecord(signers.alice.address, 0);
    
    expect(timestamp).to.be.gt(0);

    // Decrypt and verify
    const decryptedNameHash = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedNameHashResult,
      medicationContractAddress,
      signers.alice,
    );

    const decryptedDosage = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedDosageResult,
      medicationContractAddress,
      signers.alice,
    );

    expect(decryptedNameHash).to.eq(nameHashValue);
    expect(decryptedDosage).to.eq(dosageValue);
  });

  it("should allow adding multiple records", async function () {
    const nameHash1 = 111;
    const dosage1 = 50;
    const nameHash2 = 222;
    const dosage2 = 200;

    // Add first record
    const encryptedNameHash1 = await fhevm
      .createEncryptedInput(medicationContractAddress, signers.alice.address)
      .add32(nameHash1)
      .encrypt();
    const encryptedDosage1 = await fhevm
      .createEncryptedInput(medicationContractAddress, signers.alice.address)
      .add32(dosage1)
      .encrypt();

    await medicationContract
      .connect(signers.alice)
      .addMedicationRecord(
        encryptedNameHash1.handles[0],
        encryptedDosage1.handles[0],
        encryptedNameHash1.inputProof,
        encryptedDosage1.inputProof
      );

    // Add second record
    const encryptedNameHash2 = await fhevm
      .createEncryptedInput(medicationContractAddress, signers.alice.address)
      .add32(nameHash2)
      .encrypt();
    const encryptedDosage2 = await fhevm
      .createEncryptedInput(medicationContractAddress, signers.alice.address)
      .add32(dosage2)
      .encrypt();

    await medicationContract
      .connect(signers.alice)
      .addMedicationRecord(
        encryptedNameHash2.handles[0],
        encryptedDosage2.handles[0],
        encryptedNameHash2.inputProof,
        encryptedDosage2.inputProof
      );

    const recordCount = await medicationContract.getRecordCount(signers.alice.address);
    expect(recordCount).to.eq(2);
  });

  it("should revert when accessing non-existent record", async function () {
    await expect(
      medicationContract.getMedicationRecord(signers.alice.address, 0)
    ).to.be.revertedWith("Record index out of bounds");
  });
});

