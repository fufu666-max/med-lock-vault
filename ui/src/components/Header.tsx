import { Shield, Pill, Activity, Users } from "lucide-react";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const Header = () => {
  return (
    <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <img 
                  src="/logo.svg" 
                  alt="Med Lock Vault Logo" 
                  className="w-12 h-12 rounded-2xl shadow-lg group-hover:shadow-primary/20 transition-all duration-300"
                />
              </motion.div>
              <motion.div 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secure flex items-center justify-center border-2 border-background"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <Shield className="w-3 h-3 text-white" />
              </motion.div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Med Lock Vault
              </h1>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-secure animate-pulse" />
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest opacity-70">
                  Secure Medical Ledger
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ConnectButton />
          </motion.div>
        </div>
      </div>
    </header>
  );
};
