import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useXpLives } from "@/hooks/useXpLives";
import { useToast } from "@/hooks/use-toast";

interface XpLifeBarProps {
  onRefresh?: () => void;
}

const XpLifeBar = ({ onRefresh }: XpLifeBarProps) => {
  const { xpLives, maxLives, nextRefillAt, points, buyRefill, refillCostPoints } = useXpLives();
  const { toast } = useToast();

  const percentage = (xpLives / maxLives) * 100;

  const getTimeUntilRefill = () => {
    if (!nextRefillAt) return "";
    const now = new Date();
    const diff = nextRefillAt.getTime() - now.getTime();
    if (diff <= 0) return "Refilling...";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const handleBuyRefill = async () => {
    const success = await buyRefill();
    if (success) {
      toast({ title: "XP Refilled! ⚡", description: `Used ${refillCostPoints} points to refill your XP lives.` });
      onRefresh?.();
    } else {
      toast({ title: "Not enough points", description: `You need ${refillCostPoints} points to refill.`, variant: "destructive" });
    }
  };

  const barColor = xpLives <= 2 ? "bg-destructive" : xpLives <= 4 ? "bg-yellow-500" : "bg-primary";

  return (
    <div className="bg-card/50 rounded-xl p-3 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${xpLives <= 2 ? "text-destructive" : "text-primary"}`} />
          <span className="text-sm font-semibold">XP Lives</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {xpLives}/{maxLives} {xpLives < maxLives && `• Refills in ${getTimeUntilRefill()}`}
        </span>
      </div>
      <div className="relative h-3 bg-background rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: maxLives }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i < xpLives ? barColor : "bg-muted"}`}
            />
          ))}
        </div>
        {xpLives < maxLives && (
          <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={handleBuyRefill}>
            Refill ({refillCostPoints} pts)
          </Button>
        )}
      </div>
    </div>
  );
};

export default XpLifeBar;
