import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { EncryptedMedicationRecord } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("EncryptedMedicationRecordSepolia", function () {
  let signers: Signers;
  let medicationContract: EncryptedMedicationRecord;
  let medicationContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const EncryptedMedicationRecordDeployment = await deployments.get("EncryptedMedicationRecord");
      medicationContractAddress = EncryptedMedicationRecordDeployment.address;
      medicationContract = await ethers.getContractAt("EncryptedMedicationRecord", EncryptedMedicationRecordDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should add a medication record on Sepolia", async function () {
    steps = 10;
    this.timeout(4 * 40000);

    const nameHashValue = 12345;
    const dosageValue = 100;

    progress("Encrypting name hash...");
    const encryptedNameHash = await fhevm
      .createEncryptedInput(medicationContractAddress, signers.alice.address)
      .add32(nameHashValue)
      .encrypt();

    progress("Encrypting dosage value...");
    const encryptedDosage = await fhevm
      .createEncryptedInput(medicationContractAddress, signers.alice.address)
      .add32(dosageValue)
      .encrypt();

    progress(`Calling addMedicationRecord...`);
    const tx = await medicationContract
      .connect(signers.alice)
      .addMedicationRecord(
        encryptedNameHash.handles[0],
        encryptedDosage.handles[0],
        encryptedNameHash.inputProof,
        encryptedDosage.inputProof
      );
    await tx.wait();

    progress("Checking record count...");
    const recordCount = await medicationContract.getRecordCount(signers.alice.address);
    expect(recordCount).to.eq(1);

    progress("Getting medication record...");
    const [encryptedNameHashResult, encryptedDosageResult, timestamp] = 
      await medicationContract.getMedicationRecord(signers.alice.address, 0);
    
    expect(timestamp).to.be.gt(0);

    progress("Decrypting name hash...");
    const decryptedNameHash = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedNameHashResult,
      medicationContractAddress,
      signers.alice,
    );

    progress("Decrypting dosage value...");
    const decryptedDosage = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedDosageResult,
      medicationContractAddress,
      signers.alice,
    );

    progress(`Verifying decrypted values...`);
    expect(decryptedNameHash).to.eq(nameHashValue);
    expect(decryptedDosage).to.eq(dosageValue);
  });
});

