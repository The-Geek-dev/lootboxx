import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { getActivationAmount, isPromoActive, PROMO } from "@/config/promo";

interface ActivationGateProps {
  reason?: "new" | "expired" | null;
  title?: string;
}

const ActivationGate = ({ reason, title = "Activation Required" }: ActivationGateProps) => {
  const isExpired = reason === "expired";
  const amount = getActivationAmount();
  const promo = isPromoActive();
  const amountStr = `₦${amount.toLocaleString()}`;
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <div className="md:pl-16 min-h-screen flex flex-col">
        <main className="container px-4 pt-32 pb-24 flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground mb-3">
              {isExpired
                ? "Your weekly access has expired. Renew to keep playing and withdrawing winnings."
                : `Activate your account with a one-time ${amountStr} deposit to unlock games and start winning real cash.`}
            </p>
            {promo && !isExpired && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                {PROMO.label}: was ₦{PROMO.originalAmount.toLocaleString()}, now {amountStr}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-primary mb-5">
              <Sparkles className="w-4 h-4" />
              <span>Browse freely — pay only when you're ready to play.</span>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/deposit">
                <Button className="button-gradient w-full">
                  {isExpired ? "Renew Access" : `Activate Now (${amountStr})`}
                </Button>
              </Link>
              <Link to="/games">
                <Button variant="outline" className="w-full">Back to Games</Button>
              </Link>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default ActivationGate;
