import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Mail, Download, Home, Receipt } from "lucide-react";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WithdrawalDetails {
  recipientName: string;
  recipientEmail: string;
  amount: number;
  feeAmount: number;
  netAmount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
  processedAt: string;
}

const formatNaira = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const WithdrawalSuccess = () => {
  const location = useLocation();
  const [details, setDetails] = useState<WithdrawalDetails | null>(null);

  useEffect(() => {
    const fromState = (location.state as { details?: WithdrawalDetails })?.details;
    if (fromState) {
      setDetails(fromState);
      return;
    }
    const stored = sessionStorage.getItem("lootboxx_last_withdrawal");
    if (stored) {
      try {
        setDetails(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, [location.state]);

  const d = details;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <div className="md:pl-16 min-h-screen flex flex-col">
        <main className="container px-4 pt-32 pb-16 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 14 }}
                className="w-20 h-20 bg-primary/15 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Withdrawal Approved! 🎉</h1>
              <p className="text-muted-foreground text-sm">
                Your funds are on the way to your bank account.
              </p>
            </div>

            <Card className="p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Receipt</h2>
                </div>
                <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
                  Approved & Paid
                </Badge>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 text-center mb-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Net amount paid out
                </p>
                <p className="text-3xl font-bold text-primary">
                  {d ? formatNaira(d.netAmount) : "—"}
                </p>
                {d && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Gross {formatNaira(d.amount)} − {formatNaira(d.feeAmount)} fee
                  </p>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <Row label="Reference" value={d?.reference ?? "—"} mono />
                <Row label="Account name" value={d?.accountName ?? "—"} />
                <Row label="Bank" value={d?.bankName ?? "—"} />
                <Row label="Account number" value={d?.accountNumber ?? "—"} mono />
                <Row label="Gross amount" value={d ? formatNaira(d.amount) : "—"} />
                <Row label="Processing fee (5%)" value={d ? formatNaira(d.feeAmount) : "—"} />
                <Row
                  label="Processed at"
                  value={
                    d
                      ? new Date(d.processedAt).toLocaleString("en-NG", {
                          timeZone: "Africa/Lagos",
                          dateStyle: "full",
                          timeStyle: "short",
                        })
                      : "—"
                  }
                />
              </div>
            </Card>

            <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Email receipt sent</p>
                  <p className="text-xs text-muted-foreground">
                    A copy has been emailed to{" "}
                    <span className="font-medium text-foreground">
                      {d?.recipientEmail ?? "your inbox"}
                    </span>
                    . Check your spam folder if you don't see it.
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex gap-3 flex-wrap justify-center">
              <Button onClick={() => window.print()} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Print / Save PDF
              </Button>
              <Button asChild className="button-gradient">
                <Link to="/dashboard">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Funds typically reflect in your bank within 5–30 minutes. If you don't
              see them within 24 hours, contact support and quote the reference above.
            </p>
          </motion.div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

const Row = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex justify-between items-center pb-2 border-b border-border/50 last:border-0 last:pb-0 gap-3">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className={`text-right font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
  </div>
);

export default WithdrawalSuccess;
