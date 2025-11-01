import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import btcLogo from "@/assets/crypto/btc-logo.png";
import solLogo from "@/assets/crypto/sol-logo.png";
import bnbLogo from "@/assets/crypto/bnb-logo.png";
import ethLogo from "@/assets/crypto/eth-logo.png";
import usdtLogo from "@/assets/crypto/usdt-logo.png";

const plans = [
  {
    name: "Basic",
    price: "0.5 SOL",
    features: ["5 SOL per day", "Basic AI strategies", "24/7 trading"],
  },
  {
    name: "Pro",
    price: "1.5 SOL",
    features: ["15 SOL per day", "Advanced AI strategies", "Priority support", "Custom trading pairs"],
  },
  {
    name: "Custom AI",
    price: "Contact us",
    features: ["30% of SOL per day", "Unlimited trading", "Dedicated account manager", "Custom AI models"],
  },
];

const cryptoWallets = {
  BTC: {
    logo: btcLogo,
    name: "Bitcoin",
    addresses: {
      Basic: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      Pro: "bc1q5s8k3dmqp7qjw3hfk2v8t9n6p4r7m8c5x2y9z1",
      "Custom AI": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    },
  },
  ETH: {
    logo: ethLogo,
    name: "Ethereum",
    addresses: {
      Basic: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      Pro: "0x8f4B8c4e9f2A3d7C6e5B1a9F7e6D4c3B2a1F8e7D",
      "Custom AI": "0x1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T",
    },
  },
  SOL: {
    logo: solLogo,
    name: "Solana",
    addresses: {
      Basic: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      Pro: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      "Custom AI": "5FHwkrdxntdK24b2ytEfKdXKGZZRbkMwLbXhHnkTxBhK",
    },
  },
  BNB: {
    logo: bnbLogo,
    name: "BNB",
    addresses: {
      Basic: "bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2",
      Pro: "bnb1k3c0p89q7dx8w5h3g2l6m9n4r8t2y7v5x1z4a3",
      "Custom AI": "bnb1m9p8q7w6e5r4t3y2u1i0o9p8l7k6j5h4g3f2d1",
    },
  },
  USDT: {
    logo: usdtLogo,
    name: "Tether (USDT)",
    addresses: {
      Basic: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      Pro: "0x8f4B8c4e9f2A3d7C6e5B1a9F7e6D4c3B2a1F8e7D",
      "Custom AI": "0x1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T",
    },
  },
};

const CryptoPayment = () => {
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container px-4 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-medium text-center mb-4">
            Crypto <span className="text-gradient">Payment</span>
          </h1>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Pay for your Astra subscription using your preferred cryptocurrency
          </p>

          <Tabs defaultValue="BTC" className="w-full max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              {Object.entries(cryptoWallets).map(([symbol, crypto]) => (
                <TabsTrigger key={symbol} value={symbol} className="flex items-center gap-2">
                  <img src={crypto.logo} alt={crypto.name} className="w-5 h-5" />
                  <span className="hidden sm:inline">{symbol}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(cryptoWallets).map(([symbol, crypto]) => (
              <TabsContent key={symbol} value={symbol}>
                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <motion.div
                      key={plan.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="p-6 bg-card/50 backdrop-blur-sm h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                          <img src={crypto.logo} alt={crypto.name} className="w-10 h-10" />
                          <div>
                            <h3 className="text-xl font-bold">{plan.name}</h3>
                            <p className="text-sm text-gray-400">{crypto.name}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-2xl font-bold mb-2">{plan.price}</p>
                          <ul className="space-y-2 text-sm text-gray-400">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-primary">✓</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-auto">
                          <p className="text-xs text-gray-400 mb-2 font-medium">
                            Send {symbol} to this address:
                          </p>
                          <div className="bg-background/80 rounded-lg p-3 mb-3">
                            <p className="text-xs break-all font-mono">
                              {crypto.addresses[plan.name as keyof typeof crypto.addresses]}
                            </p>
                          </div>
                          <Button
                            onClick={() =>
                              copyToClipboard(
                                crypto.addresses[plan.name as keyof typeof crypto.addresses]
                              )
                            }
                            variant="outline"
                            className="w-full"
                            size="sm"
                          >
                            {copiedAddress ===
                            crypto.addresses[plan.name as keyof typeof crypto.addresses] ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Address
                              </>
                            )}
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Instructions */}
          <Card className="mt-12 p-8 bg-card/30 max-w-5xl mx-auto">
            <h3 className="text-xl font-bold mb-4">Payment Instructions</h3>
            <ol className="space-y-3 text-gray-400">
              <li className="flex gap-3">
                <span className="text-primary font-bold">1.</span>
                <span>Select your preferred cryptocurrency from the tabs above</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">2.</span>
                <span>Choose the plan that suits your trading needs</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">3.</span>
                <span>Copy the wallet address for your chosen plan</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">4.</span>
                <span>Send the exact amount from your crypto wallet</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">5.</span>
                <span>
                  Your subscription will be activated within 10-15 minutes after payment confirmation
                </span>
              </li>
            </ol>
            <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary">
                ⚠️ Important: Always double-check the wallet address before sending. Transactions are
                irreversible.
              </p>
            </div>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default CryptoPayment;
