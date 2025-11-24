import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { MedicationCard, Medication } from "@/components/MedicationCard";
import { MedicationDialog } from "@/components/MedicationDialog";
import { ContractStatus } from "@/components/ContractStatus";
import { Button } from "@/components/ui/button";
import { Plus, Shield, Lock, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMedicationRecord } from "@/hooks/useMedicationRecord";
import { AlertCircle } from "lucide-react";

// Simple hash function to convert medication name to a number
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

// Map from encrypted record to Medication format
function recordToMedication(record: { nameHash: number; dosageValue: number; timestamp: number; index: number }): Medication {
  // For MVP, we'll use a simple reverse mapping
  // In production, you'd store a mapping or use a more sophisticated approach
  const name = `Medication-${record.nameHash % 1000}`;
  const dosage = `${record.dosageValue}mg`;
  
  return {
    id: record.index.toString(),
    name,
    dosage,
    frequency: "Once daily", // Default for MVP
    time: ["8:00 AM"], // Default for MVP
    startDate: new Date(record.timestamp * 1000).toISOString().split('T')[0],
    notes: `Encrypted record #${record.index}`,
  };
}

const Index = () => {
  const { isConnected } = useAccount();
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const { records, isLoading, message, addMedicationRecord, loadRecords } = useMedicationRecord(contractAddress);
  
  const [medications, setMedications] = useState<Medication[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | undefined>();

  // Convert records to medications when records change
  useEffect(() => {
    if (records && records.length > 0) {
      const meds = records.map(recordToMedication);
      setMedications(meds);
    } else {
      setMedications([]);
    }
  }, [records]);

  const handleSave = async (medicationData: Omit<Medication, "id"> & { id?: string }) => {
    try {
      const nameHash = hashString(medicationData.name);
      const dosageValue = extractDosageValue(medicationData.dosage);
      
      await addMedicationRecord(nameHash, dosageValue);
      await loadRecords();
      setDialogOpen(false);
      setEditingMedication(undefined);
    } catch (error) {
      console.error("Error saving medication:", error);
    }
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // For MVP, deletion is not implemented in contract
    // This would require contract modification
    console.log("Delete not implemented in MVP");
  };

  const handleAddNew = () => {
    setEditingMedication(undefined);
    setDialogOpen(true);
  };

  if (!isConnected) {
    return (
      <>
        <Header />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-b from-background to-medical-secondary/20">
          <div className="text-center max-w-md px-4">
            <div className="mb-6 inline-block">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto relative">
                <Shield className="w-10 h-10 text-primary" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secure flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Connect Your Wallet
            </h2>
            <p className="text-muted-foreground mb-8">
              Securely access your encrypted medication logs by connecting your wallet.
              Your data is protected with blockchain-level security.
            </p>
            <Alert className="mb-6 border-primary/20 bg-primary/5">
              <Shield className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Your medication data is encrypted and can only be accessed with your connected wallet.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </>
    );
  }


  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-background to-medical-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Your Medications
              </h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Lock className="w-4 h-4" />
                All entries are encrypted and secure
              </p>
            </div>
            <Button onClick={handleAddNew} className="gap-2" disabled={isLoading}>
              <Plus className="w-4 h-4" />
              Add Medication
            </Button>
          </div>

          <ContractStatus 
            contractAddress={contractAddress}
            message={message}
            isLoading={isLoading}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : medications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-medical-secondary flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                No medications logged yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start tracking your medications securely
              </p>
              <Button onClick={handleAddNew} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Medication
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medications.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <MedicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        medication={editingMedication}
        isLoading={isLoading}
      />
    </>
  );
};

export default Index;
