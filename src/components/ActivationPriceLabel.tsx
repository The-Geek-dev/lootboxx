import { Sparkles } from "lucide-react";
import { PROMO, isPromoActive, getActivationAmount } from "@/config/promo";

interface Props {
  className?: string;
  showOriginal?: boolean;
  badge?: boolean;
}

/**
 * Displays the activation price.
 * When the launch promo is active: shows ₦4,500 with a "Promo" badge
 * and the original ₦7,000 struck through.
 */
const ActivationPriceLabel = ({ className = "", showOriginal = true, badge = true }: Props) => {
  const promo = isPromoActive();
  const amount = getActivationAmount();
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-semibold">₦{amount.toLocaleString()}</span>
      {promo && showOriginal && (
        <span className="line-through text-muted-foreground/70 text-[0.85em]">
          ₦{PROMO.originalAmount.toLocaleString()}
        </span>
      )}
      {promo && badge && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[0.7em] font-bold uppercase tracking-wide">
          <Sparkles className="w-2.5 h-2.5" />
          Promo
        </span>
      )}
    </span>
  );
};

export default ActivationPriceLabel;
