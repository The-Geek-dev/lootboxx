import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Clock, Mail, Home, Hourglass } from "lucide-react";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WithdrawalDetails {
  recipientName?: string;
  recipientEmail?: string;
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

const WithdrawalProcessing = () => {
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
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center mx-auto mb-4"
              >
                <Hourglass className="w-10 h-10 text-primary" />
              </motion.div>

              <Badge className="mb-3 bg-amber-500/15 text-amber-500 border-amber-500/30">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Processing
              </Badge>

              <h1 className="text-3xl font-bold mb-2">Withdrawal Submitted</h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Your withdrawal request has been received and is now awaiting admin
                review and approval.
              </p>
            </div>

            <Card className="p-5 mb-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-1">Estimated processing time</p>
                  <p className="text-2xl font-bold text-primary mb-1">48 – 72 hours</p>
                  <p className="text-xs text-muted-foreground">
                    Once approved by our admin team, funds will be sent to your bank
                    and a receipt will be emailed to you. You'll also see a
                    notification in your dashboard.
                  </p>
                </div>
              </div>
            </Card>

            {d && (
              <Card className="p-6 mb-4">
                <h2 className="font-semibold mb-4">Request summary</h2>
                <div className="space-y-3 text-sm">
                  <Row label="Reference" value={d.reference} mono />
                  <Row label="Amount requested" value={formatNaira(d.amount)} />
                  <Row label="Fee (5%)" value={formatNaira(d.feeAmount)} />
                  <Row label="You'll receive" value={formatNaira(d.netAmount)} highlight />
                  <Row label="Bank" value={d.bankName} />
                  <Row label="Account" value={d.accountNumber} mono />
                  <Row label="Account name" value={d.accountName} />
                </div>
              </Card>
            )}

            <Card className="p-4 mb-6 bg-muted/30 border-border/50">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Receipt pending</p>
                  <p className="text-xs text-muted-foreground">
                    A receipt will be emailed to you only after the admin approves
                    your withdrawal. You will not receive a receipt at this stage.
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex gap-3 flex-wrap justify-center">
              <Button asChild variant="outline">
                <Link to="/transactions">View transaction history</Link>
              </Button>
              <Button asChild className="button-gradient">
                <Link to="/dashboard">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Withdrawals are reviewed manually for your security. If you have not
              heard back after 72 hours, contact support and quote the reference above.
            </p>
          </motion.div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

const Row = ({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) => (
  <div className="flex justify-between items-center pb-2 border-b border-border/50 last:border-0 last:pb-0 gap-3">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span
      className={`text-right font-medium ${mono ? "font-mono text-xs" : ""} ${
        highlight ? "text-primary font-bold" : ""
      }`}
    >
      {value}
    </span>
  </div>
);

export default WithdrawalProcessing;
