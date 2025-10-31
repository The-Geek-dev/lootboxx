import { useState, useEffect } from 'react';

export const useSolanaPrice = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
        );
        const data = await response.json();
        setPrice(data.solana.usd);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching SOL price:', error);
        setLoading(false);
      }
    };

    fetchPrice();
    
    // Update price every 60 seconds
    const interval = setInterval(fetchPrice, 60000);

    return () => clearInterval(interval);
  }, []);

  return { price, loading };
};
