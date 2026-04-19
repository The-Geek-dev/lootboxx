import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  adminCall: (action: string, params?: any) => Promise<any>;
}

const SendManualReceiptPanel = ({ adminCall }: Props) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const amt = Number(amount);
  const fee = amt > 0 ? Math.round(amt * 0.05 * 100) / 100 : 0;
  const net = amt > 0 ? Math.round((amt - fee) * 100) / 100 : 0;

  const handleSend = async () => {
    if (!recipientEmail || !amt || amt <= 0 || !bankName || !accountNumber || !accountName) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await adminCall("send_manual_receipt", {
        recipient_email: recipientEmail,
        recipient_name: recipientName || accountName,
        amount: amt,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
      });
      if (res?.success) {
        toast({
          title: "Receipt sent ✅",
          description: `${res.reference} • Net ₦${Number(res.netAmount).toLocaleString()} → ${recipientEmail}`,
        });
        setAmount("");
      } else {
        toast({ title: "Failed", description: res?.error || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Send Manual Withdrawal Receipt</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Sends a branded withdrawal receipt to any email address — no withdrawal record required.
        Useful for off-platform payouts or reissuing receipts.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Recipient email *</Label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </div>
        <div>
          <Label>Recipient name (optional)</Label>
          <Input
            placeholder="Defaults to account name"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>
        <div>
          <Label>Amount (₦) *</Label>
          <Input
            type="number"
            placeholder="e.g. 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {amt > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Fee ₦{fee.toLocaleString()} • Net ₦{net.toLocaleString()}
            </p>
          )}
        </div>
        <div>
          <Label>Bank name *</Label>
          <Input
            placeholder="e.g. Opay, GTBank"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
        </div>
        <div>
          <Label>Account number *</Label>
          <Input
            placeholder="10-digit account number"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>
        <div>
          <Label>Account name *</Label>
          <Input
            placeholder="Name on bank account"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
        </div>
      </div>

      <Button className="button-gradient w-full" onClick={handleSend} disabled={sending}>
        <Send className="w-4 h-4 mr-2" />
        {sending ? "Sending..." : "Send Receipt Email"}
      </Button>
    </Card>
  );
};

export default SendManualReceiptPanel;
