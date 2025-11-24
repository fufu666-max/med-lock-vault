import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "./useInMemoryStorage";

// Contract ABI
const EncryptedMedicationRecordABI = [
  "function addMedicationRecord(bytes32 encryptedNameHash, bytes32 encryptedDosageValue, bytes calldata nameProof, bytes calldata dosageProof) external",
  "function getMedicationRecord(address user, uint256 index) external view returns (bytes32 nameHash, bytes32 dosageValue, uint256 timestamp)",
  "function getRecordCount(address user) external view returns (uint256)",
  "function grantAccess(address authorizedAddress, uint256 recordIndex) external",
  "event MedicationRecordAdded(address indexed user, uint256 indexed recordIndex, uint256 timestamp)",
];

export interface MedicationRecord {
  nameHash: number;
  dosageValue: number;
  timestamp: number;
  index: number;
}

interface UseMedicationRecordState {
  contractAddress: string | undefined;
  records: MedicationRecord[];
  isLoading: boolean;
  message: string | undefined;
  addMedicationRecord: (nameHash: number, dosageValue: number) => Promise<void>;
  decryptRecord: (index: number) => Promise<MedicationRecord | null>;
  loadRecords: () => Promise<void>;
}

export function useMedicationRecord(contractAddress: string | undefined): UseMedicationRecordState {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();

  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersProvider, setEthersProvider] = useState<ethers.JsonRpcProvider | undefined>(undefined);

  // Get EIP1193 provider
  const eip1193Provider = useCallback(() => {
    if (chainId === 31337) {
      return "http://localhost:8545";
    }
    if (walletClient?.transport) {
      const transport = walletClient.transport as any;
      if (transport.value && typeof transport.value.request === "function") {
        return transport.value;
      }
      if (typeof transport.request === "function") {
        return transport;
      }
    }
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return undefined;
  }, [chainId, walletClient]);

  // Initialize FHEVM
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: eip1193Provider(),
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected && !!contractAddress,
  });

  // Convert walletClient to ethers signer
  useEffect(() => {
    if (!walletClient || !chainId) {
      setEthersSigner(undefined);
      setEthersProvider(undefined);
      return;
    }

    const setupEthers = async () => {
      try {
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        setEthersProvider(provider as any);
        setEthersSigner(signer);
      } catch (error) {
        console.error("Error setting up ethers:", error);
        setEthersSigner(undefined);
        setEthersProvider(undefined);
      }
    };

    setupEthers();
  }, [walletClient, chainId]);

  const addMedicationRecord = useCallback(
    async (nameHash: number, dosageValue: number) => {
      if (!contractAddress || !ethersSigner || !fhevmInstance || !address || !ethersProvider) {
        const error = new Error("Missing requirements for adding medication record");
        setMessage(error.message);
        throw error;
      }

      try {
        setIsLoading(true);
        setMessage("Encrypting medication data...");

        // Encrypt name hash
        const encryptedNameHashInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedNameHashInput.add32(nameHash);
        const encryptedNameHash = await encryptedNameHashInput.encrypt();

        // Encrypt dosage value
        const encryptedDosageInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedDosageInput.add32(dosageValue);
        const encryptedDosage = await encryptedDosageInput.encrypt();

        setMessage("Submitting to blockchain...");

        const contractCode = await ethersProvider.getCode(contractAddress);
        if (contractCode === "0x" || contractCode.length <= 2) {
          throw new Error(`Contract not deployed at ${contractAddress}. Please deploy the contract first.`);
        }

        const contract = new ethers.Contract(contractAddress, EncryptedMedicationRecordABI, ethersSigner);

        const tx = await contract.addMedicationRecord(
          encryptedNameHash.handles[0],
          encryptedDosage.handles[0],
          encryptedNameHash.inputProof,
          encryptedDosage.inputProof,
          {
            gasLimit: 5000000,
          }
        );

        await tx.wait();
        setMessage("Medication record added successfully. Refreshing...");
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        await loadRecords();
      } catch (error: any) {
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error: ${errorMessage}`);
        console.error("[useMedicationRecord] Error adding record:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, ethersProvider]
  );

  const decryptRecord = useCallback(
    async (index: number): Promise<MedicationRecord | null> => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
        setMessage("Missing requirements for decryption");
        return null;
      }

      try {
        setMessage("Decrypting medication record...");

        const contract = new ethers.Contract(contractAddress, EncryptedMedicationRecordABI, ethersProvider);
        const [encryptedNameHash, encryptedDosageValue, timestamp] = await contract.getMedicationRecord(address, index);

        let nameHashHandle = typeof encryptedNameHash === "string" ? encryptedNameHash : ethers.hexlify(encryptedNameHash);
        let dosageHandle = typeof encryptedDosageValue === "string" ? encryptedDosageValue : ethers.hexlify(encryptedDosageValue);

        if (nameHashHandle && nameHashHandle.startsWith("0x")) {
          nameHashHandle = nameHashHandle.toLowerCase();
        }
        if (dosageHandle && dosageHandle.startsWith("0x")) {
          dosageHandle = dosageHandle.toLowerCase();
        }

        // Generate keypair for EIP712 signature
        let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
        if (typeof (fhevmInstance as any).generateKeypair === "function") {
          keypair = (fhevmInstance as any).generateKeypair();
        } else {
          keypair = {
            publicKey: new Uint8Array(32).fill(0),
            privateKey: new Uint8Array(32).fill(0),
          };
        }

        // Create EIP712 signature
        const contractAddresses = [contractAddress as `0x${string}`];
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "10";

        let eip712: any;
        if (typeof (fhevmInstance as any).createEIP712 === "function") {
          eip712 = (fhevmInstance as any).createEIP712(
            keypair.publicKey,
            contractAddresses,
            startTimestamp,
            durationDays
          );
        } else {
          eip712 = {
            domain: {
              name: "FHEVM",
              version: "1",
              chainId: chainId,
              verifyingContract: contractAddresses[0],
            },
            types: {
              UserDecryptRequestVerification: [
                { name: "publicKey", type: "bytes" },
                { name: "contractAddresses", type: "address[]" },
                { name: "startTimestamp", type: "string" },
                { name: "durationDays", type: "string" },
              ],
            },
            message: {
              publicKey: ethers.hexlify(keypair.publicKey),
              contractAddresses,
              startTimestamp,
              durationDays,
            },
          };
        }

        const signature = await ethersSigner.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );

        const signatureForDecrypt = chainId === 31337 
          ? signature.replace("0x", "") 
          : signature;

        // Decrypt both values
        const handleContractPairs = [
          { handle: nameHashHandle, contractAddress: contractAddress as `0x${string}` },
          { handle: dosageHandle, contractAddress: contractAddress as `0x${string}` },
        ];

        const decryptedResult = await (fhevmInstance as any).userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signatureForDecrypt,
          contractAddresses,
          address as `0x${string}`,
          startTimestamp,
          durationDays
        );

        const decryptedNameHash = Number(decryptedResult[nameHashHandle] || 0);
        const decryptedDosage = Number(decryptedResult[dosageHandle] || 0);

        return {
          nameHash: decryptedNameHash,
          dosageValue: decryptedDosage,
          timestamp: Number(timestamp),
          index,
        };
      } catch (error: any) {
        console.error("[useMedicationRecord] Error decrypting record:", error);
        setMessage(`Error decrypting: ${error.message || String(error)}`);
        return null;
      }
    },
    [contractAddress, ethersProvider, fhevmInstance, ethersSigner, address, chainId]
  );

  const loadRecords = useCallback(async () => {
    if (!contractAddress || !ethersProvider || !address) {
      return;
    }

    try {
      setIsLoading(true);

      const contractCode = await ethersProvider.getCode(contractAddress);
      if (contractCode === "0x" || contractCode.length <= 2) {
        setMessage(`Contract not deployed at ${contractAddress}. Please deploy the contract first.`);
        setRecords([]);
        return;
      }

      const contract = new ethers.Contract(contractAddress, EncryptedMedicationRecordABI, ethersProvider);
      const recordCount = await contract.getRecordCount(address);
      
      const recordPromises: Promise<MedicationRecord | null>[] = [];
      for (let i = 0; i < Number(recordCount); i++) {
        recordPromises.push(decryptRecord(i));
      }

      const decryptedRecords = await Promise.all(recordPromises);
      const validRecords = decryptedRecords.filter((r): r is MedicationRecord => r !== null);
      setRecords(validRecords);
    } catch (error: any) {
      console.error("[useMedicationRecord] Error loading records:", error);
      setMessage(`Error loading records: ${error.message || String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, ethersProvider, address, decryptRecord]);

  useEffect(() => {
    if (contractAddress && ethersProvider && address) {
      loadRecords();
    }
  }, [contractAddress, ethersProvider, address, loadRecords]);

  return {
    contractAddress,
    records,
    isLoading,
    message,
    addMedicationRecord,
    decryptRecord,
    loadRecords,
  };
}

