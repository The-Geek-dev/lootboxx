import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";

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
        const [statsRes, usersRes, depositsRes, gamesRes] = await Promise.all([
          adminCall("get_stats"),
          adminCall("get_users"),
          adminCall("get_deposits"),
          adminCall("get_game_activity"),
        ]);

        setStats(statsRes?.stats);
        setUsers(usersRes?.users || []);
        setDeposits(depositsRes?.deposits || []);
        setGameActivity(gamesRes);
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
      <main className="container px-4 pt-32 pb-16">
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
            <TabsList className="grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
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
          </Tabs>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
