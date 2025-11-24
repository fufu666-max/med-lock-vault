import { useState } from "react";
import { Header } from "@/components/Header";
import { MedicationCard, Medication } from "@/components/MedicationCard";
import { MedicationDialog } from "@/components/MedicationDialog";
import { Button } from "@/components/ui/button";
import { Plus, Shield, Lock } from "lucide-react";
import { useAccount } from "wagmi";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const { isConnected } = useAccount();
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: "1",
      name: "Aspirin",
      dosage: "100mg",
      frequency: "Once daily",
      time: ["8:00 AM"],
      startDate: "2024-01-01",
      notes: "Take with food",
    },
    {
      id: "2",
      name: "Vitamin D",
      dosage: "2000 IU",
      frequency: "Once daily",
      time: ["9:00 AM"],
      startDate: "2024-01-01",
    },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | undefined>();

  const handleSave = (medicationData: Omit<Medication, "id"> & { id?: string }) => {
    if (medicationData.id) {
      setMedications(
        medications.map((med) =>
          med.id === medicationData.id ? (medicationData as Medication) : med
        )
      );
    } else {
      const newMedication: Medication = {
        ...medicationData,
        id: Date.now().toString(),
      } as Medication;
      setMedications([...medications, newMedication]);
    }
    setEditingMedication(undefined);
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setMedications(medications.filter((med) => med.id !== id));
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
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Medication
            </Button>
          </div>

          {medications.length === 0 ? (
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
      />
    </>
  );
};

export default Index;
