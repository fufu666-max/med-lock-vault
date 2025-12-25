import { Pill, Lock, Clock, Calendar, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
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
  onDelete?: (id: string) => void;
}

export const MedicationCard = ({ medication, onEdit, onDelete }: MedicationCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 }
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border-border/50 cursor-pointer overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-5">
              <div className="relative">
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Pill className="w-8 h-8 text-primary" />
                </motion.div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-secure flex items-center justify-center border-2 border-background shadow-sm">
                  <Lock className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{medication.name}</h3>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-0.5">
                  {medication.dosage}
                </Badge>
              </div>
            </div>
            <motion.div
              className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"
              initial={{ scale: 0.8 }}
              whileHover={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(medication);
                  }}
                  className="h-10 w-10 p-0 rounded-full hover:bg-primary/10 hover:text-primary"
                >
                  <Edit className="w-5 h-5" />
                </Button>
              </motion.div>
              {onDelete && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(medication.id);
                    }}
                    className="h-10 w-10 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-foreground font-semibold">{medication.frequency}</span>
            </div>

            <div className="flex flex-wrap gap-2 pl-11">
              {medication.time.map((time, index) => (
                <Badge key={index} variant="secondary" className="font-medium px-4 py-1 rounded-full bg-secondary/50 text-secondary-foreground">
                  {time}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground border-t border-border/50 pt-4 mt-6">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">
                {new Date(medication.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                {medication.endDate && ` — ${new Date(medication.endDate).toLocaleDateString(undefined, { dateStyle: 'long' })}`}
              </span>
            </div>

            {medication.notes && (
              <div className="bg-muted/30 rounded-xl p-4 mt-4">
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{medication.notes}"
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
