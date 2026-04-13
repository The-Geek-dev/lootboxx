import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const AgeVerification = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const verified = localStorage.getItem("lootboxx_age_verified");
      if (!verified) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const confirm = () => {
    try { localStorage.setItem("lootboxx_age_verified", "true"); } catch {}
    setShow(false);
  };

  const deny = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Age Verification</h2>
            <p className="text-muted-foreground mb-2 text-sm">
              This platform contains games with real money prizes.
            </p>
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-6">
              <p className="text-destructive font-bold text-lg">🔞 Rated 18+</p>
              <p className="text-muted-foreground text-xs mt-1">
                You must be at least 18 years old to access this platform. By continuing, you confirm that you meet the age requirement.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={deny}>
                I'm Under 18
              </Button>
              <Button className="flex-1 button-gradient" onClick={confirm}>
                I'm 18 or Older
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-4">
              Gambling can be addictive. Please play responsibly.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgeVerification;
