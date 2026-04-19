import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  DollarSign,
  Gamepad2,
  Gift,
  Shield,
  TrendingUp,
  UserCheck,
  Activity,
  Banknote,
  Wallet,
  Coins,
  RefreshCw,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import EmailLogPanel from "@/components/admin/EmailLogPanel";
import { Mail } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [gameActivity, setGameActivity] = useState<any>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusUserId, setBonusUserId] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalNote, setWithdrawalNote] = useState("");
  const [walletUserId, setWalletUserId] = useState("");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletOperation, setWalletOperation] = useState<"add" | "subtract" | "set">("add");
  const [pointsUserId, setPointsUserId] = useState("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsOperation, setPointsOperation] = useState<"add" | "subtract">("add");
  const [generatingCodes, setGeneratingCodes] = useState(false);
  // Game control state
  const [gameSettings, setGameSettings] = useState<any[]>([]);
  const [gsUserId, setGsUserId] = useState("");
  const [gsDifficulty, setGsDifficulty] = useState("5");
  const [gsWinRate, setGsWinRate] = useState("1.0");
  const [gsPayout, setGsPayout] = useState("1.0");
  const [gsActive, setGsActive] = useState(true);
  const [gsNote, setGsNote] = useState("");

  const adminCall = useCallback(async (action: string, params: any = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, ...params }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Admin API error");
    }
    return res.json();
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        navigate("/dashboard");
        toast({ title: "Access denied", description: "Admin access required.", variant: "destructive" });
        return;
      }

      setIsAdmin(true);

      try {
        const [statsRes, usersRes, depositsRes, gamesRes, withdrawRes, gsRes] = await Promise.all([
          adminCall("get_stats"),
          adminCall("get_users"),
          adminCall("get_deposits"),
          adminCall("get_game_activity"),
          adminCall("get_withdrawals"),
          adminCall("get_game_settings"),
        ]);

        setStats(statsRes?.stats);
        setUsers(usersRes?.users || []);
        setDeposits(depositsRes?.deposits || []);
        setGameActivity(gamesRes);
        setWithdrawals(withdrawRes?.withdrawals || []);
        setGameSettings(gsRes?.settings || []);
      } catch (err: any) {
        toast({ title: "Error loading admin data", description: err.message, variant: "destructive" });
      }

      setLoading(false);
    };

    init();
  }, [navigate, toast, adminCall]);

  const handleReleaseBonus = async (allActivated: boolean) => {
    const amount = Number(bonusAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (!allActivated && !bonusUserId) {
      toast({ title: "Enter a user ID or select all activated", variant: "destructive" });
      return;
    }

    setReleasing(true);
    try {
      const res = await adminCall("release_bonus", {
        amount,
        user_id: allActivated ? undefined : bonusUserId,
        all_activated: allActivated,
      });
      toast({ title: "Bonus released!", description: res.message });
      // Refresh users
      const usersRes = await adminCall("get_users");
      setUsers(usersRes?.users || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setReleasing(false);
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await adminCall("activate_user", { user_id: userId });
      toast({ title: "User activated!" });
      const usersRes = await adminCall("get_users");
      setUsers(usersRes?.users || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, status: string) => {
    try {
      const res = await adminCall("update_withdrawal", {
        withdrawal_id: withdrawalId,
        status,
        admin_note: withdrawalNote || undefined,
      });
      toast({ title: res.message });
      setWithdrawalNote("");
      const wRes = await adminCall("get_withdrawals");
      setWithdrawals(wRes?.withdrawals || []);
      const uRes = await adminCall("get_users");
      setUsers(uRes?.users || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleWalletAction = async () => {
    const amt = Number(walletAmount);
    if (!walletUserId || !amt || amt <= 0) {
      toast({ title: "Select a user and enter amount", variant: "destructive" });
      return;
    }
    try {
      let res;
      if (walletOperation === "set") {
        res = await adminCall("set_wallet_balance", { user_id: walletUserId, balance: amt });
      } else {
        res = await adminCall("adjust_wallet", {
          user_id: walletUserId,
          amount: amt,
          operation: walletOperation,
        });
      }
      toast({ title: res.message });
      setWalletAmount("");
      const uRes = await adminCall("get_users");
      setUsers(uRes?.users || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handlePointsAction = async () => {
    const pts = Number(pointsAmount);
    if (!pointsUserId || !pts || pts <= 0) {
      toast({ title: "Select a user and enter points amount", variant: "destructive" });
      return;
    }
    try {
      const res = await adminCall("adjust_points", {
        user_id: pointsUserId,
        points: pts,
        operation: pointsOperation,
      });
      toast({ title: res.message });
      setPointsAmount("");
      const uRes = await adminCall("get_users");
      setUsers(uRes?.users || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleGenerateRenewalCodes = async () => {
    setGeneratingCodes(true);
    try {
      const res = await adminCall("generate_renewal_codes");
      toast({ title: res.message });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setGeneratingCodes(false);
  };

  const handleSaveGameSettings = async () => {
    if (!gsUserId) {
      toast({ title: "Select a user first", variant: "destructive" });
      return;
    }
    try {
      const res = await adminCall("upsert_game_settings", {
        user_id: gsUserId,
        difficulty_level: Number(gsDifficulty),
        win_rate_modifier: Number(gsWinRate),
        payout_modifier: Number(gsPayout),
        is_active: gsActive,
        admin_note: gsNote || undefined,
      });
      toast({ title: res.message });
      const gsRes = await adminCall("get_game_settings");
      setGameSettings(gsRes?.settings || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteGameSettings = async (userId: string) => {
    try {
      const res = await adminCall("delete_game_settings", { user_id: userId });
      toast({ title: res.message });
      const gsRes = await adminCall("get_game_settings");
      setGameSettings(gsRes?.settings || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: "Total Users", value: stats?.totalUsers || 0, color: "text-blue-400" },
    { icon: UserCheck, label: "Activated", value: stats?.activatedUsers || 0, color: "text-green-400" },
    { icon: DollarSign, label: "Total Deposits", value: `₦${(stats?.totalDeposits || 0).toLocaleString()}`, color: "text-primary" },
    { icon: Activity, label: "Games Played", value: stats?.totalGamesPlayed || 0, color: "text-purple-400" },
  ];

  const gameTypeLabels: Record<string, string> = {
    spin_wheel: "🎰 Spin Wheel",
    slots: "🎰 Slots",
    trivia: "🧠 Trivia",
    raffle: "🎟️ Raffle",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <main className="md:pl-16 container px-4 pt-32 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold">Admin <span className="text-gradient">Dashboard</span></h1>
              <p className="text-muted-foreground text-sm">Manage users, monitor activity, and release bonuses</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            {statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="glass p-4 sm:p-6">
                  <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
                  <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{s.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid grid-cols-3 sm:grid-cols-9 w-full max-w-5xl">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
              <TabsTrigger value="points">Points</TabsTrigger>
              <TabsTrigger value="game-ctrl">Game Ctrl</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
            </TabsList>

            {/* USERS TAB */}
            <TabsContent value="users">
              <Card className="glass p-4 sm:p-6 overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" /> All Users ({users.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Deposited</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                        <TableCell>₦{Number(u.balance).toLocaleString()}</TableCell>
                        <TableCell>₦{Number(u.total_deposited).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={u.is_activated ? "default" : "secondary"}>
                            {u.is_activated ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.roles.length > 0
                            ? u.roles.map((r: string) => (
                                <Badge key={r} variant="outline" className="mr-1 text-xs">
                                  {r}
                                </Badge>
                              ))
                            : <span className="text-muted-foreground text-xs">user</span>}
                        </TableCell>
                        <TableCell>
                          {!u.is_activated && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivateUser(u.id)}
                            >
                              Activate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* DEPOSITS TAB */}
            <TabsContent value="deposits">
              <Card className="glass p-4 sm:p-6 overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Recent Deposits ({deposits.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.user_name}</TableCell>
                        <TableCell className="text-primary font-bold">₦{Number(d.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={d.status === "completed" ? "default" : "secondary"}>
                            {d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{d.payment_reference || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(d.created_at).toLocaleDateString("en-NG", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {deposits.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No deposits yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* GAMES TAB */}
            <TabsContent value="games">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {gameActivity?.stats &&
                  Object.entries(gameActivity.stats.gameTypeCounts as Record<string, number>).map(
                    ([type, count]) => (
                      <Card key={type} className="glass p-4 text-center">
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{gameTypeLabels[type] || type}</p>
                      </Card>
                    )
                  )}
                <Card className="glass p-4 text-center">
                  <p className="text-lg font-bold text-primary">
                    ₦{(gameActivity?.stats?.totalBets || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Bets</p>
                </Card>
                <Card className="glass p-4 text-center">
                  <p className="text-lg font-bold text-green-400">
                    ₦{(gameActivity?.stats?.totalWins || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Payouts</p>
                </Card>
              </div>

              <Card className="glass p-4 sm:p-6 overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" /> Recent Game Activity
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Bet</TableHead>
                      <TableHead>Won</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(gameActivity?.games || []).slice(0, 50).map((g: any) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.user_name}</TableCell>
                        <TableCell>{gameTypeLabels[g.game_type] || g.game_type}</TableCell>
                        <TableCell>₦{Number(g.bet_amount).toLocaleString()}</TableCell>
                        <TableCell className={Number(g.win_amount) > 0 ? "text-green-400 font-bold" : "text-muted-foreground"}>
                          {Number(g.win_amount) > 0 ? `₦${Number(g.win_amount).toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(g.created_at).toLocaleDateString("en-NG", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!gameActivity?.games || gameActivity.games.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No game activity yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* BONUSES TAB */}
            <TabsContent value="bonuses">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5" /> Release Bonus to All Activated Users
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will credit the bonus amount to all users who have made their initial ₦7,000 deposit.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bonus Amount (₦)</label>
                      <Input
                        type="number"
                        placeholder="e.g. 2000"
                        value={bonusAmount}
                        onChange={(e) => setBonusAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      className="button-gradient w-full"
                      disabled={releasing}
                      onClick={() => handleReleaseBonus(true)}
                    >
                      {releasing ? "Releasing..." : "Release to All Activated Users"}
                    </Button>
                  </div>
                </Card>

                <Card className="glass p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Release Bonus to Specific User
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Credit a bonus to a single user by their user ID.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">User ID</label>
                      <Input
                        placeholder="Paste user ID..."
                        value={bonusUserId}
                        onChange={(e) => setBonusUserId(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bonus Amount (₦)</label>
                      <Input
                        type="number"
                        placeholder="e.g. 5000"
                        value={bonusAmount}
                        onChange={(e) => setBonusAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={releasing}
                      onClick={() => handleReleaseBonus(false)}
                    >
                      {releasing ? "Releasing..." : "Release to User"}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Quick bonus buttons for users */}
              <Card className="glass p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Quick Bonus — Select User</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.filter(u => u.is_activated).map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email} — ₦{Number(u.balance).toLocaleString()}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBonusUserId(u.id)}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* WITHDRAWALS TAB */}
            <TabsContent value="withdrawals">
              <Card className="glass p-4 sm:p-6 overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Banknote className="w-5 h-5" /> Withdrawal Requests ({withdrawals.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.user_name}</TableCell>
                        <TableCell className="text-primary font-bold">₦{Number(w.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{w.bank_name}</TableCell>
                        <TableCell className="text-xs">
                          {w.account_number}<br />
                          <span className="text-muted-foreground">{w.account_name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={w.status === "approved" ? "default" : w.status === "rejected" ? "destructive" : "secondary"}>
                            {w.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(w.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell>
                          {w.status === "pending" && (
                            <div className="flex gap-1 flex-col">
                              <div className="flex gap-1">
                                <Button size="sm" onClick={() => handleWithdrawalAction(w.id, "approved")}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleWithdrawalAction(w.id, "rejected")}>
                                  Reject
                                </Button>
                              </div>
                              <Input
                                placeholder="Admin note..."
                                className="text-xs h-7"
                                value={withdrawalNote}
                                onChange={(e) => setWithdrawalNote(e.target.value)}
                              />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {withdrawals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No withdrawal requests
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* WALLET MANIPULATION TAB */}
            <TabsContent value="wallet">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5" /> Manipulate User Wallet
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Operation</label>
                      <div className="flex gap-2">
                        {(["add", "subtract", "set"] as const).map((op) => (
                          <Button
                            key={op}
                            size="sm"
                            variant={walletOperation === op ? "default" : "outline"}
                            className={walletOperation === op ? "button-gradient" : ""}
                            onClick={() => setWalletOperation(op)}
                          >
                            {op === "add" ? "Add ₦" : op === "subtract" ? "Subtract ₦" : "Set to ₦"}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Amount (₦)</label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={walletAmount}
                        onChange={(e) => setWalletAmount(e.target.value)}
                      />
                    </div>
                    <Button className="button-gradient w-full" onClick={handleWalletAction} disabled={!walletUserId}>
                      {walletUserId ? "Apply to Selected User" : "Select a user first →"}
                    </Button>
                    {walletUserId && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {users.find(u => u.id === walletUserId)?.full_name} ({users.find(u => u.id === walletUserId)?.email})
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="glass p-6">
                  <h3 className="text-lg font-semibold mb-4">Select User</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className={`flex items-center justify-between py-2 px-2 rounded cursor-pointer transition-colors ${
                          walletUserId === u.id ? "bg-primary/10 border border-primary/30" : "border-b border-border/50"
                        }`}
                        onClick={() => setWalletUserId(u.id)}
                      >
                        <div>
                          <p className="font-medium text-sm">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-primary">₦{Number(u.balance).toLocaleString()}</p>
                          <Badge variant={u.is_activated ? "default" : "secondary"} className="text-xs">
                            {u.is_activated ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
            {/* POINTS & RENEWAL TAB */}
            <TabsContent value="points">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Adjust Points */}
                <Card className="glass p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Coins className="w-5 h-5" /> Adjust User Points
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Operation</label>
                      <div className="flex gap-2">
                        {(["add", "subtract"] as const).map((op) => (
                          <Button
                            key={op}
                            size="sm"
                            variant={pointsOperation === op ? "default" : "outline"}
                            className={pointsOperation === op ? "button-gradient" : ""}
                            onClick={() => setPointsOperation(op)}
                          >
                            {op === "add" ? "Add Points" : "Remove Points"}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Points Amount</label>
                      <Input
                        type="number"
                        placeholder="e.g. 5000"
                        value={pointsAmount}
                        onChange={(e) => setPointsAmount(e.target.value)}
                      />
                    </div>
                    <Button className="button-gradient w-full" onClick={handlePointsAction} disabled={!pointsUserId}>
                      {pointsUserId ? "Apply to Selected User" : "Select a user first →"}
                    </Button>
                    {pointsUserId && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {users.find(u => u.id === pointsUserId)?.full_name} ({users.find(u => u.id === pointsUserId)?.email})
                      </p>
                    )}
                  </div>
                </Card>

                {/* Generate Renewal Codes */}
                <Card className="glass p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" /> Weekly Renewal Codes
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate unique renewal codes for all activated users. Each code is valid for 7 days and costs ₦2,000 to redeem.
                  </p>
                  <Button
                    className="button-gradient w-full"
                    disabled={generatingCodes}
                    onClick={handleGenerateRenewalCodes}
                  >
                    {generatingCodes ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generate Codes for All Activated Users
                      </>
                    )}
                  </Button>
                </Card>
              </div>

              {/* User selector for points */}
              <Card className="glass p-6">
                <h3 className="text-lg font-semibold mb-4">Select User for Points Adjustment</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between py-2 px-2 rounded cursor-pointer transition-colors ${
                        pointsUserId === u.id ? "bg-primary/10 border border-primary/30" : "border-b border-border/50"
                      }`}
                      onClick={() => setPointsUserId(u.id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-primary">₦{Number(u.balance).toLocaleString()}</p>
                        <Badge variant={u.is_activated ? "default" : "secondary"} className="text-xs">
                          {u.is_activated ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* GAME CONTROL TAB */}
            <TabsContent value="game-ctrl">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card className="glass p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5" /> User Game Modifiers
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Control difficulty, win rate, and payout for a specific user. Lower win rate = harder to win. Lower payout = smaller winnings.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Quick Presets</label>
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          type="button" size="sm" variant="destructive"
                          onClick={() => { setGsDifficulty("9"); setGsWinRate("0.3"); setGsPayout("0.5"); setGsActive(true); }}
                        >
                          Nerf
                        </Button>
                        <Button
                          type="button" size="sm" variant="outline"
                          onClick={() => { setGsDifficulty("5"); setGsWinRate("1.0"); setGsPayout("1.0"); setGsActive(true); }}
                        >
                          Normal
                        </Button>
                        <Button
                          type="button" size="sm" variant="default"
                          onClick={() => { setGsDifficulty("3"); setGsWinRate("2.0"); setGsPayout("2.0"); setGsActive(true); }}
                        >
                          Boost
                        </Button>
                        <Button
                          type="button" size="sm" variant="secondary"
                          onClick={() => { setGsDifficulty("10"); setGsWinRate("0"); setGsPayout("0"); setGsActive(true); }}
                        >
                          Block
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Nerf: 0.3x win, 0.5x payout · Boost: 2x both · Block: never wins</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Difficulty (1=Easy, 10=Hard): {gsDifficulty}</label>
                      <Slider
                        min={1} max={10} step={1}
                        value={[Number(gsDifficulty)]}
                        onValueChange={([v]) => setGsDifficulty(String(v))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Win Rate Multiplier: {gsWinRate}x</label>
                      <Slider
                        min={0} max={3} step={0.1}
                        value={[Number(gsWinRate)]}
                        onValueChange={([v]) => setGsWinRate(v.toFixed(1))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">0 = never wins, 1 = normal, 3 = 3x more likely to win</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Payout Multiplier: {gsPayout}x</label>
                      <Slider
                        min={0} max={3} step={0.1}
                        value={[Number(gsPayout)]}
                        onValueChange={([v]) => setGsPayout(v.toFixed(1))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">0.3 = 30% of normal payout, 2 = double payout</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Active</label>
                      <Switch checked={gsActive} onCheckedChange={setGsActive} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Admin Note</label>
                      <Input
                        placeholder="Reason for adjustment..."
                        value={gsNote}
                        onChange={(e) => setGsNote(e.target.value)}
                      />
                    </div>
                    <Button className="button-gradient w-full" onClick={handleSaveGameSettings} disabled={!gsUserId}>
                      {gsUserId ? "Save Settings" : "Select a user first →"}
                    </Button>
                    {gsUserId && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {users.find(u => u.id === gsUserId)?.full_name} ({users.find(u => u.id === gsUserId)?.email})
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="glass p-6">
                  <h3 className="text-lg font-semibold mb-4">Select User</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {users.map((u) => {
                      const hasSettings = gameSettings.find((gs: any) => gs.user_id === u.id);
                      return (
                        <div
                          key={u.id}
                          className={`flex items-center justify-between py-2 px-2 rounded cursor-pointer transition-colors ${
                            gsUserId === u.id ? "bg-primary/10 border border-primary/30" : "border-b border-border/50"
                          }`}
                          onClick={() => {
                            setGsUserId(u.id);
                            if (hasSettings) {
                              setGsDifficulty(String(hasSettings.difficulty_level));
                              setGsWinRate(String(Number(hasSettings.win_rate_modifier)));
                              setGsPayout(String(Number(hasSettings.payout_modifier)));
                              setGsActive(hasSettings.is_active);
                              setGsNote(hasSettings.admin_note || "");
                            } else {
                              setGsDifficulty("5");
                              setGsWinRate("1.0");
                              setGsPayout("1.0");
                              setGsActive(true);
                              setGsNote("");
                            }
                          }}
                        >
                          <div>
                            <p className="font-medium text-sm">{u.full_name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          <div className="text-right">
                            {hasSettings?.is_active && (
                              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">
                                Modified
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Active Modifiers */}
              {gameSettings.filter((gs: any) => gs.is_active).length > 0 && (
                <Card className="glass p-4 sm:p-6 overflow-x-auto">
                  <h3 className="text-lg font-semibold mb-4">Active Game Modifiers</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Win Rate</TableHead>
                        <TableHead>Payout</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameSettings.filter((gs: any) => gs.is_active).map((gs: any) => (
                        <TableRow key={gs.id}>
                          <TableCell className="font-medium">{gs.user_name}</TableCell>
                          <TableCell>{gs.difficulty_level}/10</TableCell>
                          <TableCell className={Number(gs.win_rate_modifier) < 1 ? "text-red-400" : Number(gs.win_rate_modifier) > 1 ? "text-green-400" : ""}>
                            {Number(gs.win_rate_modifier).toFixed(1)}x
                          </TableCell>
                          <TableCell className={Number(gs.payout_modifier) < 1 ? "text-red-400" : Number(gs.payout_modifier) > 1 ? "text-green-400" : ""}>
                            {Number(gs.payout_modifier).toFixed(1)}x
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{gs.admin_note || "—"}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteGameSettings(gs.user_id)}>
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            {/* EMAILS TAB */}
            <TabsContent value="emails">
              <EmailLogPanel
                fetchLogs={async () => {
                  const res = await adminCall("get_email_log");
                  return res?.logs || [];
                }}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
