import { AlertCircle, CheckCircle2, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAccount, useChainId } from "wagmi";

interface ContractStatusProps {
  contractAddress: string | undefined;
  message: string | undefined;
  isLoading: boolean;
}

export const ContractStatus = ({ contractAddress, message, isLoading }: ContractStatusProps) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {!contractAddress ? (
        <motion.div
          key="no-address"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <Alert className="mb-8 border-destructive/50 bg-destructive/5 py-4 px-6 rounded-2xl shadow-sm">
            <WifiOff className="h-5 w-5 text-destructive mr-3" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-bold text-lg text-destructive">Configuration Required</p>
                <p className="text-muted-foreground">
                  The medication contract address is not configured. Please check your environment variables.
                </p>
                <div className="flex gap-4 pt-2 border-t border-destructive/10">
                  <p className="text-xs font-mono bg-destructive/10 px-2 py-1 rounded">Chain ID: {chainId}</p>
                  <p className="text-xs font-mono bg-destructive/10 px-2 py-1 rounded">Expected: 31337</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      ) : isLoading ? (
        <motion.div
          key="loading-status"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
        >
          <Alert className="mb-8 border-primary/20 bg-primary/5 py-6 px-8 rounded-2xl border-dashed">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <Wifi className="absolute inset-0 m-auto h-4 w-4 text-primary" />
              </div>
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-bold text-lg text-primary">Synchronizing...</p>
                  <p className="text-sm text-muted-foreground font-mono truncate max-w-md">Contract: {contractAddress}</p>
                </div>
              </AlertDescription>
            </div>
          </Alert>
        </motion.div>
      ) : (
        <motion.div
          key="connected-status"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.002 }}
          transition={{ duration: 0.2 }}
        >
          <Alert className={`mb-8 py-6 px-8 rounded-2xl shadow-sm border-2 ${
            message && (message.toLowerCase().includes("error") || message.toLowerCase().includes("failed"))
              ? "border-destructive/30 bg-destructive/5"
              : "border-secure/20 bg-secure/5"
          }`}>
            <div className="flex items-center gap-5">
              <div className={`p-3 rounded-2xl ${
                message && (message.toLowerCase().includes("error") || message.toLowerCase().includes("failed"))
                  ? "bg-destructive/10"
                  : "bg-secure/10"
              }`}>
                {message && (message.toLowerCase().includes("error") || message.toLowerCase().includes("failed")) ? (
                  <AlertCircle className="h-8 w-8 text-destructive" />
                ) : (
                  <ShieldCheck className="h-8 w-8 text-secure" />
                )}
              </div>
              <AlertDescription className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className={`text-xl font-black tracking-tight ${
                      message && (message.toLowerCase().includes("error") || message.toLowerCase().includes("failed"))
                        ? "text-destructive"
                        : "text-secure"
                    }`}>
                      {message || "System Status: Online"}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground bg-white/50 px-2 py-0.5 rounded border">
                        {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-tighter flex items-center gap-1">
                        <Wifi className="w-3 h-3" /> Network Connected
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="px-4 py-2 rounded-xl bg-white/40 border border-white shadow-inner">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Blockchain Latency</p>
                      <div className="flex items-end gap-1">
                        <div className="w-1.5 h-3 bg-secure/40 rounded-full" />
                        <div className="w-1.5 h-4 bg-secure/60 rounded-full" />
                        <div className="w-1.5 h-5 bg-secure rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

