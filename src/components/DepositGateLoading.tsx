import { useDepositGate } from "@/hooks/useDepositGate";

const DepositGateLoading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Checking access...</p>
    </div>
  </div>
);

export { DepositGateLoading };
