import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Clock, Trophy } from "lucide-react";
import { useDepositGate } from "@/hooks/useDepositGate";

const TICKET_PRICE = 500;
const PRIZE_POOL = 25000;
const DRAW_INTERVAL_MINUTES = 30;

const RaffleDraw = () => {
  const navigate = useNavigate();
  const { isAuthorized, isChecking } = useDepositGate();
  const { balance, updateBalance, recordGameResult } = useWallet();
  const { toast } = useToast();
  const [tickets, setTickets] = useState(0);
  const [ticketCount, setTicketCount] = useState(1);
  const [timeLeft, setTimeLeft] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<string | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const minutesPast = now.getMinutes() % DRAW_INTERVAL_MINUTES;
      const secondsPast = now.getSeconds();
      const totalSecondsLeft = (DRAW_INTERVAL_MINUTES - minutesPast - 1) * 60 + (60 - secondsPast);
      const mins = Math.floor(totalSecondsLeft / 60);
      const secs = totalSecondsLeft % 60;
      setTimeLeft(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthorized || isChecking) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    </div>
  );

  const buyTickets = async () => {
    const cost = ticketCount * TICKET_PRICE;
    if (balance < cost) {
      toast({ title: "Insufficient balance", description: `You need ₦${cost.toLocaleString()} for ${ticketCount} ticket(s).`, variant: "destructive" });
      return;
    }
    await updateBalance(-cost);
    setTickets((t) => t + ticketCount);
    toast({ title: "Tickets purchased!", description: `You bought ${ticketCount} raffle ticket(s).` });
  };

  const simulateDraw = async () => {
    if (tickets === 0) {
      toast({ title: "No tickets", description: "Buy some tickets first!", variant: "destructive" });
      return;
    }
    setIsDrawing(true);
    setDrawResult(null);

    // Simulate a draw
    await new Promise((r) => setTimeout(r, 3000));

    // 15% win chance per ticket (simplified)
    const winChance = 1 - Math.pow(0.85, tickets);
    const won = Math.random() < winChance;
    const prize = won ? Math.floor(PRIZE_POOL * (0.3 + Math.random() * 0.7)) : 0;

    if (won) {
      await updateBalance(prize);
      setDrawResult(`🎉 You won ₦${prize.toLocaleString()} from the raffle!`);
    } else {
      setDrawResult("Not this time. Try again in the next draw!");
    }

    await recordGameResult("raffle", tickets * TICKET_PRICE, prize, { tickets, won, prize });
    setTickets(0);
    setIsDrawing(false);
  };

  if (!isAuthorized || isChecking) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container px-4 pt-32 pb-16 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
            Raffle <span className="text-gradient">Draw</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8">Buy tickets & win from the prize pool!</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4 bg-card/50 text-center">
              <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
              <p className="text-2xl font-bold text-primary">₦{balance.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-card/50 text-center">
              <p className="text-sm text-muted-foreground mb-1">Prize Pool</p>
              <p className="text-2xl font-bold text-yellow-400">₦{PRIZE_POOL.toLocaleString()}</p>
            </Card>
          </div>

          {/* Timer */}
          <Card className="p-6 bg-card/50 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">Next Draw In</p>
            </div>
            <p className="text-4xl font-mono font-bold text-primary">{timeLeft}</p>
          </Card>

          {/* Ticket Purchase */}
          <Card className="p-6 bg-card/50 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Buy Tickets</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">₦{TICKET_PRICE} per ticket • You have {tickets} ticket(s)</p>
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" size="sm" onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}>-</Button>
              <span className="text-xl font-bold w-12 text-center">{ticketCount}</span>
              <Button variant="outline" size="sm" onClick={() => setTicketCount(ticketCount + 1)}>+</Button>
              <span className="text-muted-foreground ml-auto">Total: ₦{(ticketCount * TICKET_PRICE).toLocaleString()}</span>
            </div>
            <Button className="button-gradient w-full" onClick={buyTickets}>
              Buy {ticketCount} Ticket{ticketCount > 1 ? "s" : ""}
            </Button>
          </Card>

          {/* Draw Button */}
          <Button
            className="w-full py-6 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            onClick={simulateDraw}
            disabled={isDrawing || tickets === 0}
          >
            {isDrawing ? (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                Drawing...
              </motion.span>
            ) : (
              <>
                <Trophy className="w-5 h-5 mr-2" />
                Enter Draw ({tickets} ticket{tickets !== 1 ? "s" : ""})
              </>
            )}
          </Button>

          {drawResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <Card className="p-6 bg-card/50 text-center">
                <p className="text-xl font-bold">{drawResult}</p>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default RaffleDraw;
