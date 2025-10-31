import { motion } from "framer-motion";
import btcLogo from "@/assets/crypto/btc-logo.png";
import solLogo from "@/assets/crypto/sol-logo.png";
import bnbLogo from "@/assets/crypto/bnb-logo.png";
import ethLogo from "@/assets/crypto/eth-logo.png";
import usdtLogo from "@/assets/crypto/usdt-logo.png";

const cryptos = [
  { name: "Bitcoin", symbol: "BTC", logo: btcLogo },
  { name: "Solana", symbol: "SOL", logo: solLogo },
  { name: "BNB", symbol: "BNB", logo: bnbLogo },
  { name: "Ethereum", symbol: "ETH", logo: ethLogo },
  { name: "Tether", symbol: "USDT", logo: usdtLogo },
];

export const CryptoCarousel = () => {
  // Duplicate the array for seamless loop
  const duplicatedCryptos = [...cryptos, ...cryptos, ...cryptos];

  return (
    <section className="py-16 overflow-hidden">
      <div className="container px-4 mb-8">
        <h2 className="text-3xl md:text-4xl font-medium text-center mb-2">
          Supported <span className="text-gradient">Cryptocurrencies</span>
        </h2>
        <p className="text-gray-400 text-center">
          Trade with confidence across major cryptocurrencies
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
        
        <motion.div
          className="flex gap-16 py-8"
          animate={{
            x: [0, -1920],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
        >
          {duplicatedCryptos.map((crypto, index) => (
            <div
              key={`${crypto.symbol}-${index}`}
              className="flex flex-col items-center gap-4 min-w-[120px]"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center p-4 backdrop-blur-sm border border-white/10 hover:border-primary/50 transition-colors">
                <img
                  src={crypto.logo}
                  alt={crypto.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">{crypto.name}</p>
                <p className="text-xs text-gray-400">{crypto.symbol}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
