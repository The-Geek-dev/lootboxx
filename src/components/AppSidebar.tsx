import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Gamepad2,
  Coins,
  Users,
  Settings,
  History,
  Trophy,
  HelpCircle,
  LogOut,
  Shield,
  ArrowDownToLine,
  ArrowUpFromLine,
  Menu,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Games", icon: Gamepad2, path: "/games" },
  { label: "Points", icon: Coins, path: "/points" },
  { label: "Leaderboard", icon: Trophy, path: "/leaderboard" },
  { label: "Deposit", icon: ArrowDownToLine, path: "/deposit" },
  { label: "Withdraw", icon: ArrowUpFromLine, path: "/withdraw" },
  { label: "Referrals", icon: Users, path: "/referrals" },
  { label: "Transactions", icon: History, path: "/transactions" },
  { label: "Settings", icon: Settings, path: "/settings" },
  { label: "FAQ", icon: HelpCircle, path: "/faq" },
];

const AppSidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    });
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile toggle button - fixed */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-20 left-2 z-50 md:hidden h-9 w-9 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full shadow-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless open, always icon-strip on desktop */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-40 bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col transition-all duration-300",
          // Desktop: always show as icon strip (w-16)
          "hidden md:flex w-16",
          // Mobile: full width drawer when open
          open && "!flex w-56"
        )}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center justify-center px-3 border-b border-border/50">
          {open ? (
            <Link to="/" className="font-bold text-gradient text-sm">LOOTBOX</Link>
          ) : (
            <Link to="/" className="font-bold text-gradient text-xs">LB</Link>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !open && "justify-center px-0"
                  )}
                  title={!open ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {open && <span>{item.label}</span>}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  location.pathname === "/admin"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !open && "justify-center px-0"
                )}
                title={!open ? "Admin" : undefined}
              >
                <Shield className="w-4 h-4 shrink-0" />
                {open && <span>Admin</span>}
              </Link>
            )}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-border/50">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full transition-all",
              !open && "justify-center px-0"
            )}
            title={!open ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {open && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
