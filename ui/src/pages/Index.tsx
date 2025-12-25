import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
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
        <motion.div
          className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-b from-background to-medical-secondary/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="text-center max-w-md px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
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
          </motion.div>
        </motion.div>
      </>
    );
  }


  return (
    <>
      <Header />
      <motion.main
        className="min-h-[calc(100vh-80px)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-medical-secondary/30 via-background to-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container max-w-7xl mx-auto px-4 py-12">
          <motion.div
          className="mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Your Medications
              </h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Lock className="w-4 h-4" />
                All entries are encrypted and secure
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button onClick={handleAddNew} className="gap-2" disabled={isLoading}>
                <Plus className="w-4 h-4" />
                Add Medication
              </Button>
            </motion.div>
          </motion.div>

          <ContractStatus 
            contractAddress={contractAddress}
            message={message}
            isLoading={isLoading}
          />

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                className="flex flex-col items-center justify-center py-32 rounded-3xl border-2 border-dashed border-primary/10 bg-primary/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>
                <motion.p 
                  className="mt-8 text-xl font-medium text-primary/80 tracking-wide"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Securing your health data...
                </motion.p>
              </motion.div>
            ) : medications.length === 0 ? (
              <motion.div
                key="empty"
                className="text-center py-24 px-6 rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-card/30 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 relative"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                >
                  <Plus className="w-12 h-12 text-primary" />
                  <motion.div 
                    className="absolute -inset-2 rounded-3xl bg-primary/5 -z-10"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
                <motion.h3
                  className="text-3xl font-bold mb-4 text-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  No medications logged yet
                </motion.h3>
                <motion.p
                  className="text-xl text-muted-foreground mb-10 max-w-lg mx-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  Start tracking your medications securely with end-to-end encryption. 
                  Your health data is your own.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button onClick={handleAddNew} className="gap-2 h-12 px-8 text-lg shadow-lg shadow-primary/20">
                    <Plus className="w-5 h-5" />
                    Add Your First Medication
                  </Button>
                </motion.div>
              </motion.div>
          ) : (
            <motion.div
              key="medications"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AnimatePresence>
                {medications.map((medication, index) => (
                  <motion.div
                    key={medication.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.1,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                  >
                    <MedicationCard
                      medication={medication}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </motion.main>

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
