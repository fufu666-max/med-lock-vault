import { Shield, Pill } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const Header = () => {
  return (
    <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secure flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Secure Medication Log</h1>
              <p className="text-xs text-muted-foreground">Track Medications, Stay Secure.</p>
            </div>
          </div>
          
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};
