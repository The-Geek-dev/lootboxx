import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "./CardSpotlight";
import { useSolanaPrice } from "@/hooks/useSolanaPrice";

const PricingTier = ({
  name,
  price,
  description,
  features,
  isPopular,
  solAmount,
  solPrice,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  solAmount?: number;
  solPrice?: number | null;
}) => {
  const usdValue = solAmount && solPrice ? (solAmount * solPrice).toFixed(2) : null;
  
  return (
  <CardSpotlight className={`h-full ${isPopular ? "border-primary" : "border-white/10"} border-2`}>
    <div className="relative h-full p-6 flex flex-col">
      {isPopular && (
        <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-3 py-1 w-fit mb-4">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-medium mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold">{price}</span>
        {usdValue && (
          <span className="text-lg text-gray-400 ml-2">
            ${usdValue}
          </span>
        )}
      </div>
      <p className="text-gray-400 mb-6">{description}</p>
      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <Button className="button-gradient w-full">
        Start Trading
      </Button>
    </div>
  </CardSpotlight>
  );
};

export const PricingSection = () => {
  const { price: solPrice } = useSolanaPrice();
  
  return (
    <section className="container px-4 py-24">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-6xl font-normal mb-6"
        >
          Choose Your{" "}
          <span className="text-gradient font-medium">Trading Plan</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-lg text-gray-400"
        >
          Select the perfect trading plan with advanced features and competitive fees
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingTier
          name="Basic AI"
          price="3 SOLANA"
          description="Perfect for beginners starting their crypto journey"
          features={[
            "Basic spot trading",
            "Market & limit orders",
            "Basic market analysis",
            "Email support"
          ]}
          solAmount={3}
          solPrice={solPrice}
        />
        <PricingTier
          name="Pro AI"
          price="5 SOLANA"
          description="Advanced features for serious traders"
          features={[
            "Advanced trading tools",
            "Margin trading up to 10x",
            "Advanced technical analysis",
            "Priority support",
            "API access"
          ]}
          isPopular
          solAmount={5}
          solPrice={solPrice}
        />
        <PricingTier
          name="Custom AI"
          price="15 SOLANA"
          description="Enterprise-grade solutions for institutions"
          features={[
            "30% of SOL per day",
            "Custom trading solutions",
            "Unlimited trading volume",
            "OTC desk access",
            "Dedicated account manager",
            "Custom API integration",
            "24/7 priority support"
          ]}
          solAmount={15}
          solPrice={solPrice}
        />
      </div>
    </section>
  );
};