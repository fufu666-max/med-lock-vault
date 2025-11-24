# Med Lock Vault

A secure, encrypted medication record storage system built on FHEVM (Fully Homomorphic Encryption Virtual Machine). Users can store their medication records (name, dosage, time, notes) encrypted on-chain, with only the user or authorized healthcare professionals able to decrypt and view the data.

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

```env
VITE_CONTRACT_ADDRESS=0x...  # Contract address after deployment
VITE_WALLETCONNECT_PROJECT_ID=your_project_id  # Optional, for WalletConnect
```

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

Note the contract address from the output. Update `VITE_CONTRACT_ADDRESS` in `ui/.env.local`.

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

## Contract Functions

### `addMedicationRecord`
Adds a new encrypted medication record to the blockchain.

**Parameters:**
- `encryptedNameHash`: Encrypted hash of medication name (euint32)
- `encryptedDosageValue`: Encrypted dosage value (euint32)
- `nameProof`: FHE input proof for name hash
- `dosageProof`: FHE input proof for dosage value

### `getMedicationRecord`
Retrieves an encrypted medication record for a user.

**Parameters:**
- `user`: User address
- `index`: Record index

**Returns:**
- `nameHash`: Encrypted name hash
- `dosageValue`: Encrypted dosage value
- `timestamp`: Plain timestamp

### `getRecordCount`
Returns the total number of records for a user.

### `grantAccess`
Grants decryption permission to an authorized address.

**Parameters:**
- `authorizedAddress`: Address to grant access to
- `recordIndex`: Index of the record to grant access to

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
