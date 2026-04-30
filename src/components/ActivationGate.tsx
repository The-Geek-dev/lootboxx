import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";

interface ActivationGateProps {
  reason?: "new" | "expired" | null;
  title?: string;
}

const ActivationGate = ({ reason, title = "Activation Required" }: ActivationGateProps) => {
  const isExpired = reason === "expired";
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
            <p className="text-muted-foreground mb-5">
              {isExpired
                ? "Your weekly access has expired. Renew to keep playing and withdrawing winnings."
                : "Activate your account with a one-time ₦7,000 deposit to unlock games and start winning real cash."}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-primary mb-5">
              <Sparkles className="w-4 h-4" />
              <span>Browse freely — pay only when you're ready to play.</span>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/deposit">
                <Button className="button-gradient w-full">
                  {isExpired ? "Renew Access" : "Activate Now (₦7,000)"}
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
