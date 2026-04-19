import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, RefreshCw } from "lucide-react";

type LogRow = {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

interface Props {
  fetchLogs: () => Promise<LogRow[]>;
}

const PRESETS = [
  { id: "24h", label: "Last 24h", hours: 24 },
  { id: "7d", label: "Last 7 days", hours: 24 * 7 },
  { id: "30d", label: "Last 30 days", hours: 24 * 30 },
  { id: "all", label: "All time", hours: 0 },
];

const statusColor = (status: string) => {
  if (status === "sent") return "default";
  if (status === "dlq" || status === "failed" || status === "bounced" || status === "complained") return "destructive";
  if (status === "suppressed") return "secondary";
  return "outline";
};

const statusLabel = (status: string) => {
  if (status === "dlq") return "failed";
  return status;
};

const PAGE_SIZE = 50;

const EmailLogPanel = ({ fetchLogs }: Props) => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState("7d");
  const [template, setTemplate] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await fetchLogs();
      setLogs(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cutoff = useMemo(() => {
    const p = PRESETS.find((x) => x.id === preset);
    if (!p || p.hours === 0) return 0;
    return Date.now() - p.hours * 3600 * 1000;
  }, [preset]);

  const templates = useMemo(() => {
    const s = new Set<string>();
    logs.forEach((l) => s.add(l.template_name));
    return Array.from(s).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (cutoff && new Date(l.created_at).getTime() < cutoff) return false;
      if (template !== "all" && l.template_name !== template) return false;
      if (status !== "all") {
        const effective = l.status === "dlq" ? "failed" : l.status;
        if (effective !== status) return false;
      }
      if (search && !l.recipient_email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [logs, cutoff, template, status, search]);

  const stats = useMemo(() => {
    const out = { total: filtered.length, sent: 0, failed: 0, suppressed: 0, pending: 0 };
    filtered.forEach((l) => {
      if (l.status === "sent") out.sent++;
      else if (["dlq", "failed", "bounced", "complained"].includes(l.status)) out.failed++;
      else if (l.status === "suppressed") out.suppressed++;
      else if (l.status === "pending") out.pending++;
    });
    return out;
  }, [filtered]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [preset, template, status, search]);

  const statCards = [
    { label: "Total", value: stats.total, color: "text-foreground" },
    { label: "Sent", value: stats.sent, color: "text-green-400" },
    { label: "Failed", value: stats.failed, color: "text-destructive" },
    { label: "Suppressed", value: stats.suppressed, color: "text-yellow-400" },
  ];

  return (
    <div className="space-y-4">
      <Card className="glass p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5" /> Email Send Log
          </h3>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-md border border-border/50 p-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All templates</SelectItem>
              {templates.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="suppressed">Suppressed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search recipient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-xs">{l.template_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.recipient_email}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(l.status) as any}>{statusLabel(l.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleString("en-NG", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-xs text-destructive max-w-xs truncate">
                    {l.error_message || "—"}
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {loading ? "Loading…" : "No emails match these filters"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {pages} • {filtered.length} emails
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmailLogPanel;
