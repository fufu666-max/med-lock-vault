# Med Lock Vault

A secure, encrypted medication record storage system built on FHEVM (Fully Homomorphic Encryption Virtual Machine). Users can store their medication records (name, dosage, time, notes) encrypted on-chain, with only the user or authorized healthcare professionals able to decrypt and view the data.

## 🚀 Live Demo

Try the application live: **[https://med-lock-vault.vercel.app/](https://med-lock-vault.vercel.app/)**

## 📹 Demo Video

Watch the demo video to see Med Lock Vault in action:

**[Demo Video](https://github.com/WinifredSamson/med-lock-vault/blob/main/med-lock-vault.mp4)**

## Features

- **End-to-End Encryption**: All medication data is encrypted using FHEVM before being stored on-chain
- **Privacy-First**: Data is never stored in plaintext on the blockchain
- **Access Control**: Users can grant access to authorized doctors/caregivers
- **Wallet Integration**: Uses RainbowKit for wallet connection
- **Local & Testnet Support**: Works on local Hardhat network and Sepolia testnet

## Tech Stack

- **Smart Contracts**: Solidity with FHEVM
- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn-ui + Tailwind CSS
- **Wallet**: RainbowKit + wagmi
- **Encryption**: FHEVM (Zama)

## Project Structure

```
med-lock-vault/
├── contracts/              # Smart contracts
│   └── EncryptedMedicationRecord.sol
├── test/                   # Test scripts
│   ├── EncryptedMedicationRecord.ts
│   └── EncryptedMedicationRecordSepolia.ts
├── deploy/                 # Deployment scripts
│   └── deploy.ts
├── ui/                     # Frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks (FHEVM integration)
│   │   ├── fhevm/          # FHEVM utilities
│   │   └── pages/          # Page components
│   └── public/             # Static assets
└── hardhat.config.ts       # Hardhat configuration
```

## Smart Contract

### Contract Overview

The `EncryptedMedicationRecord` contract stores encrypted medication data on-chain using FHEVM. Each medication record contains:

- **Encrypted Name Hash** (`euint32`): Hash of the medication name, encrypted
- **Encrypted Dosage Value** (`euint32`): Dosage value, encrypted
- **Timestamp** (`uint256`): Plain timestamp for sorting (not encrypted)
- **Owner** (`address`): Address of the record owner

### Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedMedicationRecord is SepoliaConfig {
    struct EncryptedMedication {
        euint32 nameHash;        // Hash of medication name (encrypted)
        euint32 dosageValue;     // Dosage value (encrypted)
        uint256 timestamp;       // Plain timestamp for sorting
        address owner;           // Owner of the record
    }

    mapping(address => EncryptedMedication[]) private _userMedications;
    mapping(address => uint256) private _recordCount;

    // Add encrypted medication record
    function addMedicationRecord(
        externalEuint32 encryptedNameHash,
        externalEuint32 encryptedDosageValue,
        bytes calldata nameProof,
        bytes calldata dosageProof
    ) external {
        euint32 nameHash = FHE.fromExternal(encryptedNameHash, nameProof);
        euint32 dosageValue = FHE.fromExternal(encryptedDosageValue, dosageProof);
        
        EncryptedMedication memory newRecord = EncryptedMedication({
            nameHash: nameHash,
            dosageValue: dosageValue,
            timestamp: block.timestamp,
            owner: msg.sender
        });
        
        _userMedications[msg.sender].push(newRecord);
        _recordCount[msg.sender]++;

        // Grant decryption permissions to the user
        FHE.allowThis(nameHash);
        FHE.allow(nameHash, msg.sender);
        FHE.allowThis(dosageValue);
        FHE.allow(dosageValue, msg.sender);
    }

    // Get encrypted medication record
    function getMedicationRecord(
        address user,
        uint256 index
    ) external view returns (
        euint32 nameHash,
        euint32 dosageValue,
        uint256 timestamp
    ) {
        require(index < _recordCount[user], "Record index out of bounds");
        EncryptedMedication memory record = _userMedications[user][index];
        return (record.nameHash, record.dosageValue, record.timestamp);
    }

    // Grant access to authorized addresses
    function grantAccess(address authorizedAddress, uint256 recordIndex) external {
        require(recordIndex < _recordCount[msg.sender], "Record index out of bounds");
        EncryptedMedication storage record = _userMedications[msg.sender][recordIndex];
        require(record.owner == msg.sender, "Only owner can grant access");
        
        FHE.allow(record.nameHash, authorizedAddress);
        FHE.allow(record.dosageValue, authorizedAddress);
    }
}
```

### Key Contract Functions

#### `addMedicationRecord`
Adds a new encrypted medication record to the blockchain.

**Parameters:**
- `encryptedNameHash`: Encrypted hash of medication name (euint32)
- `encryptedDosageValue`: Encrypted dosage value (euint32)
- `nameProof`: FHE input proof for name hash
- `dosageProof`: FHE input proof for dosage value

**Process:**
1. Converts external encrypted values to internal `euint32` using `FHE.fromExternal()`
2. Creates a new `EncryptedMedication` struct
3. Stores the record in the user's medication array
4. Grants decryption permissions to the user with `FHE.allow()`
5. Emits `MedicationRecordAdded` event

#### `getMedicationRecord`
Retrieves an encrypted medication record for a user.

**Parameters:**
- `user`: User address
- `index`: Record index

**Returns:**
- `nameHash`: Encrypted name hash (euint32)
- `dosageValue`: Encrypted dosage value (euint32)
- `timestamp`: Plain timestamp

#### `getRecordCount`
Returns the total number of records for a user.

#### `grantAccess`
Grants decryption permission to an authorized address (e.g., doctor or caregiver).

**Parameters:**
- `authorizedAddress`: Address to grant access to
- `recordIndex`: Index of the record to grant access to

## Encryption & Decryption Logic

### Encryption Flow

The encryption process happens client-side before data is sent to the blockchain:

1. **Client-Side Data Preparation**:
   ```typescript
   // Convert medication name to hash
   function hashString(str: string): number {
     let hash = 0;
     for (let i = 0; i < str.length; i++) {
       const char = str.charCodeAt(i);
       hash = ((hash << 5) - hash) + char;
       hash = hash & hash; // Convert to 32-bit integer
     }
     return Math.abs(hash);
   }

   // Extract numeric value from dosage string (e.g., "100mg" -> 100)
   function extractDosageValue(dosage: string): number {
     const match = dosage.match(/\d+/);
     return match ? parseInt(match[0], 10) : 0;
   }
   ```

2. **FHEVM Encryption**:
   ```typescript
   // Encrypt name hash
   const encryptedNameHashInput = fhevmInstance.createEncryptedInput(
     contractAddress,
     userAddress
   );
   encryptedNameHashInput.add32(nameHash);
   const encryptedNameHash = await encryptedNameHashInput.encrypt();
   // Returns: { handles: string[], inputProof: string }

   // Encrypt dosage value
   const encryptedDosageInput = fhevmInstance.createEncryptedInput(
     contractAddress,
     userAddress
   );
   encryptedDosageInput.add32(dosageValue);
   const encryptedDosage = await encryptedDosageInput.encrypt();
   ```

3. **On-Chain Submission**:
   ```typescript
   const tx = await contract.addMedicationRecord(
     encryptedNameHash.handles[0],      // Encrypted handle
     encryptedDosage.handles[0],        // Encrypted handle
     encryptedNameHash.inputProof,      // Cryptographic proof
     encryptedDosage.inputProof        // Cryptographic proof
   );
   ```

4. **Contract Processing**:
   - Contract verifies the input proofs using `FHE.fromExternal()`
   - Converts external encrypted values to internal `euint32`
   - Stores encrypted data in the user's medication array
   - Grants decryption permissions: `FHE.allow(encryptedValue, user)`

### Decryption Flow

The decryption process happens client-side after fetching encrypted data from the contract:

1. **Get Encrypted Handles**:
   ```typescript
   // Fetch encrypted record from contract
   const [encryptedNameHash, encryptedDosageValue, timestamp] = 
     await contract.getMedicationRecord(userAddress, index);
   
   let nameHashHandle = ethers.hexlify(encryptedNameHash);
   let dosageHandle = ethers.hexlify(encryptedDosageValue);
   ```

2. **Generate Decryption Keypair**:
   ```typescript
   // Generate keypair for EIP712 signature
   const keypair = fhevmInstance.generateKeypair();
   ```

3. **Create EIP712 Signature**:
   ```typescript
   // Create EIP712 typed data for decryption request
   const eip712 = fhevmInstance.createEIP712(
     keypair.publicKey,
     [contractAddress],
     startTimestamp,
     durationDays
   );
   
   // Sign with user's wallet
   const signature = await signer.signTypedData(
     eip712.domain,
     { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
     eip712.message
   );
   ```

4. **Decrypt**:
   ```typescript
   // For local network, remove "0x" prefix from signature
   const signatureForDecrypt = chainId === 31337 
     ? signature.replace("0x", "") 
     : signature;
   
   // Decrypt using FHEVM instance
   const decryptedResult = await fhevmInstance.userDecrypt(
     [
       { handle: nameHashHandle, contractAddress },
       { handle: dosageHandle, contractAddress }
     ],
     keypair.privateKey,
     keypair.publicKey,
     signatureForDecrypt,
     [contractAddress],
     userAddress,
     startTimestamp,
     durationDays
   );
   
   // Extract decrypted values
   const decryptedNameHash = Number(decryptedResult[nameHashHandle] || 0);
   const decryptedDosage = Number(decryptedResult[dosageHandle] || 0);
   ```

### Key Encryption/Decryption Details

#### Encryption Types
- **`euint32`**: Encrypted 32-bit unsigned integer (internal format)
- **`externalEuint32`**: External format for passing encrypted values as function parameters
- **Handle Format**: 66 characters (0x + 64 hex characters)

#### FHE Operations
- **`FHE.fromExternal()`**: Converts external encrypted value to internal format and verifies input proof
- **`FHE.allow()`**: Grants decryption permissions to specific addresses
- **`FHE.allowThis()`**: Grants decryption permission to the contract itself

#### Security Features
- **Input Proof Verification**: All encrypted inputs are verified on-chain before being accepted
- **Permission-Based Decryption**: Only authorized addresses can decrypt data
- **No Plaintext Storage**: Data is never stored in plaintext on the blockchain

## Setup

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0

### Installation

1. Install dependencies for the root project:
```bash
npm install
```

2. Install dependencies for the UI:
```bash
cd ui
npm install
```

### Environment Variables

Create a `.env.local` file in the `ui` directory:

**Option 1: Copy from example file**
```bash
cd ui
cp .env.example .env.local
```

**Option 2: Create manually**
Create a `.env.local` file in the `ui` directory with the following content:

```env
VITE_CONTRACT_ADDRESS=0x...  # Contract address after deployment
VITE_WALLETCONNECT_PROJECT_ID=your_project_id  # Optional, for WalletConnect
```

**Important:** 
- The `.env.local` file is already in `.gitignore` and will not be committed
- After deploying the contract (see Deployment section below), update `VITE_CONTRACT_ADDRESS` with your deployed contract address
- You can find the contract address in the deployment output or in `deployments/localhost/EncryptedMedicationRecord.json`

## Development

### 1. Start Hardhat Node (with FHEVM support)

```bash
npx hardhat node
```

This will start a local Hardhat node on `http://localhost:8545` with FHEVM support.

### 2. Deploy Contract to Local Network

In a new terminal:

```bash
npx hardhat deploy --network localhost
```

The deployment will output the contract address. Example output:
```
EncryptedMedicationRecord contract:  0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Update the environment variable:**
1. Copy the contract address from the output
2. Open `ui/.env.local` (create it if it doesn't exist)
3. Set `VITE_CONTRACT_ADDRESS` to the deployed address:
   ```env
   VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

Alternatively, you can find the contract address in:
- `deployments/localhost/EncryptedMedicationRecord.json` (after deployment)

### 3. Run Tests (Local)

```bash
npx hardhat test test/EncryptedMedicationRecord.ts
```

### 4. Start Frontend

```bash
cd ui
npm run dev
```

The application will be available at `http://localhost:5173`.

## Deployment to Sepolia Testnet

### 1. Configure Environment

Set up your `.env` file or use Hardhat vars:

```bash
npx hardhat vars setup
```

Required variables:
- `MNEMONIC`: Your wallet mnemonic
- `INFURA_API_KEY`: Your Infura API key
- `ETHERSCAN_API_KEY`: Your Etherscan API key (for verification)

### 2. Deploy to Sepolia

```bash
npx hardhat deploy --network sepolia
```

### 3. Run Tests on Sepolia

```bash
npx hardhat test test/EncryptedMedicationRecordSepolia.ts --network sepolia
```

## Usage

### Adding a Medication Record

1. Connect your wallet using the RainbowKit button in the header
2. Click "Add Medication"
3. Fill in the medication details:
   - Medication Name
   - Dosage (e.g., "100mg")
   - Frequency
   - Time
   - Start Date
   - Notes (optional)
4. Click "Add Medication"
5. Confirm the transaction in your wallet
6. Wait for the transaction to be confirmed
7. The encrypted record will be stored on-chain

### Viewing Medication Records

- Records are automatically loaded and decrypted when you connect your wallet
- Each record shows the medication name, dosage, frequency, time, and date
- Records are displayed in cards with encrypted indicators

### Granting Access

The contract includes a `grantAccess` function that allows users to grant decryption permissions to authorized addresses (e.g., doctors or caregivers). This functionality can be added to the UI in future iterations.

## Testing

### Local Network Tests

```bash
npx hardhat test test/EncryptedMedicationRecord.ts
```

### Sepolia Testnet Tests

```bash
npx hardhat test test/EncryptedMedicationRecordSepolia.ts --network sepolia
```

## MVP Limitations

This is an MVP implementation with the following limitations:

1. **Simplified Data Model**: Only medication name hash and dosage value are encrypted. Time and notes are stored as defaults in the UI.
2. **No Deletion**: Records cannot be deleted once added (immutable for security).
3. **Basic Access Control**: Grant access functionality exists but is not integrated into the UI.
4. **Name Mapping**: Medication names are hashed, so exact names cannot be recovered. The UI uses a simplified reverse mapping for display.

## Future Enhancements

- Full encryption of all medication fields (time, notes, etc.)
- UI for granting/revoking access to healthcare professionals
- Medication history and timeline
- Reminder notifications
- Multi-chain support
- Mobile app

## License

MIT

## Acknowledgments

- Built with [FHEVM](https://docs.zama.ai/fhevm) by Zama
- Uses [RainbowKit](https://rainbowkit.com/) for wallet integration
- UI components from [shadcn/ui](https://ui.shadcn.com/)
