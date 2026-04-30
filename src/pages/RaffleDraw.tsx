import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Clock, Trophy } from "lucide-react";
import { useDepositGate } from "@/hooks/useDepositGate";
import ActivationGate from "@/components/ActivationGate";
import GamePageLayout from "@/components/GamePageLayout";

const TICKET_COST = 50;
const PRIZE_POOL = 25000;
const DRAW_INTERVAL_MINUTES = 30;

const RaffleDraw = () => {
  const { isAuthorized, isChecking } = useDepositGate();
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
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
    if (xpLives <= 0) { toast({ title: "No XP lives left! ⚡", description: "Wait for refill or buy with points.", variant: "destructive" }); return; }
    const cost = ticketCount * TICKET_COST;
    if (points < cost) { toast({ title: "Insufficient points", description: `You need ${cost.toLocaleString()} points.`, variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(cost);
    setTickets((t) => t + ticketCount);
    toast({ title: "Tickets purchased!", description: `You bought ${ticketCount} raffle ticket(s) for ${cost} points.` });
  };

  const simulateDraw = async () => {
    if (tickets === 0) { toast({ title: "No tickets", description: "Buy some tickets first!", variant: "destructive" }); return; }
    setIsDrawing(true);
    setDrawResult(null);
    await new Promise((r) => setTimeout(r, 3000));
    const winChance = 1 - Math.pow(0.85, tickets);
    const won = Math.random() < winChance;
    let prize = won ? Math.floor(PRIZE_POOL * (0.3 + Math.random() * 0.7)) : 0;
    if (prize > 0) { prize = adjustWinAmount(prize); if (canFullyWin() && won) recordFullWin(); }
    if (prize > 0) { await updateBalance(prize); setDrawResult(`🎉 You won ₦${prize.toLocaleString()} from the raffle!`); }
    else { setDrawResult("Not this time. Try again in the next draw!"); }
    await recordGameResult("raffle", tickets * TICKET_COST, prize, { tickets, won, prize });
    setTickets(0);
    setIsDrawing(false);
  };

  return (
    <GamePageLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
          Raffle <span className="text-gradient">Draw</span>
        </h1>
        <p className="text-muted-foreground text-center mb-6">Buy tickets & win from the prize pool!</p>

        <Card className="p-4 bg-card/50 text-center mb-4">
          <p className="text-sm text-muted-foreground mb-1">Prize Pool</p>
          <p className="text-2xl font-bold text-yellow-500">₦{PRIZE_POOL.toLocaleString()}</p>
        </Card>

        <Card className="p-6 bg-card/50 mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">Next Draw In</p>
          </div>
          <p className="text-4xl font-mono font-bold text-primary">{timeLeft}</p>
        </Card>

        <Card className="p-6 bg-card/50 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Buy Tickets</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{TICKET_COST} pts per ticket • You have {tickets} ticket(s)</p>
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}>-</Button>
            <span className="text-xl font-bold w-12 text-center">{ticketCount}</span>
            <Button variant="outline" size="sm" onClick={() => setTicketCount(ticketCount + 1)}>+</Button>
            <span className="text-muted-foreground ml-auto text-sm">{(ticketCount * TICKET_COST).toLocaleString()} pts</span>
          </div>
          <Button className="button-gradient w-full" onClick={buyTickets} disabled={xpLives <= 0}>
            {xpLives <= 0 ? "No XP Lives" : `Buy ${ticketCount} Ticket${ticketCount > 1 ? "s" : ""}`}
          </Button>
        </Card>

        <Button className="w-full py-6 text-lg button-gradient" onClick={simulateDraw} disabled={isDrawing || tickets === 0}>
          {isDrawing ? (
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>Drawing...</motion.span>
          ) : (
            <><Trophy className="w-5 h-5 mr-2" />Enter Draw ({tickets} ticket{tickets !== 1 ? "s" : ""})</>
          )}
        </Button>

        {drawResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <Card className="p-6 bg-card/50 text-center">
              <p className="text-xl font-bold">{drawResult}</p>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </GamePageLayout>
  );
};

export default RaffleDraw;
