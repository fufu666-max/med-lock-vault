// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedMedicationRecord - Private Medication Record Storage
/// @notice Allows users to store encrypted medication records (name, dosage, time, notes) privately
/// @dev Uses FHE to store encrypted medication data on-chain
contract EncryptedMedicationRecord is SepoliaConfig {
    // Struct to store encrypted medication data
    // We use two euint32 fields: one for medication name hash, one for dosage value
    // Time and notes are stored as encrypted strings (using euint32 for simplicity in MVP)
    struct EncryptedMedication {
        euint32 nameHash;        // Hash of medication name (encrypted)
        euint32 dosageValue;     // Dosage value (encrypted)
        uint256 timestamp;       // Plain timestamp for sorting
        address owner;           // Owner of the record
    }

    // Mapping from user address to their medication records
    mapping(address => EncryptedMedication[]) private _userMedications;
    
    // Mapping to track record count per user
    mapping(address => uint256) private _recordCount;

    event MedicationRecordAdded(
        address indexed user, 
        uint256 indexed recordIndex,
        uint256 timestamp
    );
    
    event MedicationRecordDecrypted(
        address indexed user,
        uint256 indexed recordIndex
    );

    /// @notice Add a medication record with encrypted data
    /// @param encryptedNameHash The encrypted hash of medication name
    /// @param encryptedDosageValue The encrypted dosage value
    /// @param nameProof The FHE input proof for name hash
    /// @param dosageProof The FHE input proof for dosage value
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
        uint256 recordIndex = _recordCount[msg.sender];
        _recordCount[msg.sender]++;

        // Grant decryption permissions to the user
        FHE.allowThis(nameHash);
        FHE.allow(nameHash, msg.sender);
        FHE.allowThis(dosageValue);
        FHE.allow(dosageValue, msg.sender);

        emit MedicationRecordAdded(msg.sender, recordIndex, block.timestamp);
    }

    /// @notice Get the encrypted medication record for a user at a specific index
    /// @param user The user address
    /// @param index The record index
    /// @return nameHash The encrypted name hash
    /// @return dosageValue The encrypted dosage value
    /// @return timestamp The plain timestamp
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

    /// @notice Get the total number of medication records for a user
    /// @param user The user address
    /// @return count The number of records
    function getRecordCount(address user) external view returns (uint256) {
        return _recordCount[user];
    }

    /// @notice Grant decryption permission to an authorized doctor/caregiver
    /// @param authorizedAddress The address to grant permission to
    /// @param recordIndex The index of the record to grant access to
    function grantAccess(address authorizedAddress, uint256 recordIndex) external {
        require(recordIndex < _recordCount[msg.sender], "Record index out of bounds");
        EncryptedMedication storage record = _userMedications[msg.sender][recordIndex];
        require(record.owner == msg.sender, "Only owner can grant access");
        
        FHE.allow(record.nameHash, authorizedAddress);
        FHE.allow(record.dosageValue, authorizedAddress);
    }
}

