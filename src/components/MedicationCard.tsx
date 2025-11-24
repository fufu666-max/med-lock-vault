import { Pill, Lock, Clock, Calendar, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
}

interface MedicationCardProps {
  medication: Medication;
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => void;
}

export const MedicationCard = ({ medication, onEdit, onDelete }: MedicationCardProps) => {
  return (
    <Card className="group hover:shadow-medical transition-all duration-300 border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-medical-secondary flex items-center justify-center">
                <Pill className="w-6 h-6 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secure flex items-center justify-center">
                <Lock className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{medication.name}</h3>
              <p className="text-sm text-muted-foreground">{medication.dosage}</p>
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(medication)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(medication.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{medication.frequency}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {medication.time.map((time, index) => (
              <Badge key={index} variant="secondary" className="font-normal">
                {time}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(medication.startDate).toLocaleDateString()}
              {medication.endDate && ` - ${new Date(medication.endDate).toLocaleDateString()}`}
            </span>
          </div>

          {medication.notes && (
            <p className="text-sm text-muted-foreground pt-2 border-t">{medication.notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
