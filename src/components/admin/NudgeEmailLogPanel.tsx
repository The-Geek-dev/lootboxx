import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Mail, RefreshCw, Send, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Attempt = {
  id: string;
  message_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

type UserRow = {
  recipient_email: string;
  total_attempts: number;
  sent: number;
  failed: number;
  suppressed: number;
  pending: number;
  last_status: string | null;
  last_attempt_at: string | null;
  last_error: string | null;
  attempts: Attempt[];
};

interface Props {
  adminCall: (action: string, params?: Record<string, any>) => Promise<any>;
}

const statusBadge = (status: string | null) => {
  if (!status) return <Badge variant="outline">—</Badge>;
  const s = status.toLowerCase();
  if (s === "sent") return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Sent</Badge>;
  if (s === "pending") return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Pending</Badge>;
  if (s === "suppressed") return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30">Suppressed</Badge>;
  return <Badge variant="destructive">{status}</Badge>;
};

const NudgeEmailLogPanel = ({ adminCall }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [resendingFor, setResendingFor] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminCall("get_nudge_email_log");
      setRows(res?.users || []);
    } catch (e: any) {
      toast({ title: "Failed to load nudge log", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resend = async (email: string) => {
    setResendingFor(email);
    try {
      await adminCall("resend_nudge_email", { recipient_email: email });
      toast({ title: "Nudge resent", description: `Sent to ${email}` });
      await load();
    } catch (e: any) {
      toast({ title: "Resend failed", description: e?.message, variant: "destructive" });
    } finally {
      setResendingFor(null);
    }
  };

  const filtered = rows.filter((r) =>
    !filter || r.recipient_email.toLowerCase().includes(filter.toLowerCase())
  );

  const totals = rows.reduce(
    (acc, r) => {
      acc.attempts += r.total_attempts;
      acc.sent += r.sent;
      acc.failed += r.failed;
      acc.suppressed += r.suppressed;
      return acc;
    },
    { attempts: 0, sent: 0, failed: 0, suppressed: 0 }
  );

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Daily Nudge Email Log</h3>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="text-xs text-muted-foreground">Attempts</div><div className="text-xl font-bold">{totals.attempts}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Sent</div><div className="text-xl font-bold text-emerald-600">{totals.sent}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Failed</div><div className="text-xl font-bold text-destructive">{totals.failed}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Suppressed</div><div className="text-xl font-bold text-yellow-600">{totals.suppressed}</div></Card>
      </div>

      <Input
        placeholder="Filter by email…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead className="text-center">Sent</TableHead>
              <TableHead className="text-center">Failed</TableHead>
              <TableHead className="text-center">Suppressed</TableHead>
              <TableHead>Last Status</TableHead>
              <TableHead>Last Attempt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                  {loading ? "Loading…" : "No nudge emails recorded yet."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <Collapsible
                key={r.recipient_email}
                open={!!expanded[r.recipient_email]}
                onOpenChange={(o) => setExpanded((p) => ({ ...p, [r.recipient_email]: o }))}
                asChild
              >
                <>
                  <TableRow>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          {expanded[r.recipient_email]
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="font-medium">{r.recipient_email}</TableCell>
                    <TableCell className="text-center text-emerald-600">{r.sent}</TableCell>
                    <TableCell className="text-center text-destructive">{r.failed}</TableCell>
                    <TableCell className="text-center text-yellow-600">{r.suppressed}</TableCell>
                    <TableCell>{statusBadge(r.last_status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.last_attempt_at ? new Date(r.last_attempt_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resend(r.recipient_email)}
                        disabled={resendingFor === r.recipient_email}
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        {resendingFor === r.recipient_email ? "Resending…" : "Resend"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow>
                      <TableCell colSpan={8} className="bg-muted/30">
                        <div className="space-y-1 py-2">
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Resend & attempt history ({r.attempts.length})
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {r.attempts.map((a) => (
                              <div key={a.id} className="flex items-start gap-3 text-xs border-l-2 border-muted pl-3 py-1">
                                <span className="text-muted-foreground w-44 shrink-0">
                                  {new Date(a.created_at).toLocaleString()}
                                </span>
                                <span className="shrink-0">{statusBadge(a.status)}</span>
                                {a.error_message && (
                                  <span className="text-destructive break-all">{a.error_message}</span>
                                )}
                                {a.message_id?.includes("resend") && (
                                  <Badge variant="outline" className="text-[10px]">manual resend</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default NudgeEmailLogPanel;
