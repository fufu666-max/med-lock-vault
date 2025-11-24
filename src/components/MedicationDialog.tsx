import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Medication } from "./MedicationCard";

interface MedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (medication: Omit<Medication, "id"> & { id?: string }) => void;
  medication?: Medication;
}

export const MedicationDialog = ({
  open,
  onOpenChange,
  onSave,
  medication,
}: MedicationDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    time: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        time: medication.time.join(", "),
        startDate: medication.startDate,
        endDate: medication.endDate || "",
        notes: medication.notes || "",
      });
    } else {
      setFormData({
        name: "",
        dosage: "",
        frequency: "",
        time: "",
        startDate: "",
        endDate: "",
        notes: "",
      });
    }
  }, [medication, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const medicationData = {
      ...(medication?.id && { id: medication.id }),
      name: formData.name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      time: formData.time.split(",").map((t) => t.trim()),
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      notes: formData.notes || undefined,
    };
    onSave(medicationData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{medication ? "Edit Medication" : "Add Medication"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Medication Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Aspirin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="e.g., 100mg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Input
              id="frequency"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              placeholder="e.g., Twice daily"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time (comma-separated)</Label>
            <Input
              id="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              placeholder="e.g., 8:00 AM, 8:00 PM"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or instructions..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {medication ? "Update" : "Add"} Medication
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
