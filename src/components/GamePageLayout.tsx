import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AppSidebar from "@/components/AppSidebar";
import XpLifeBar from "@/components/XpLifeBar";
import { Card } from "@/components/ui/card";
import { Coins, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";

interface GamePageLayoutProps {
  children: React.ReactNode;
}

const GamePageLayout = ({ children }: GamePageLayoutProps) => {
  const { balance } = useWallet();
  const { points } = usePoints();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <div className="pl-16 min-h-screen flex flex-col">
        <main className="container px-4 pt-32 pb-16 flex-1">
          <div className="max-w-2xl mx-auto">
            {/* Balance & Points Bar */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Card className="p-3 bg-card/50 backdrop-blur-sm">
                <p className="text-center text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <Wallet className="w-3 h-3" /> Balance
                </p>
                <p className="text-center text-lg font-bold text-foreground">₦{balance.toLocaleString()}</p>
              </Card>
              <Card className="p-3 bg-card/50 backdrop-blur-sm">
                <p className="text-center text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <Coins className="w-3 h-3" /> Points
                </p>
                <p className="text-center text-lg font-bold text-primary">{points.toLocaleString()} pts</p>
              </Card>
            </div>
            <div className="mb-4"><XpLifeBar /></div>
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default GamePageLayout;
