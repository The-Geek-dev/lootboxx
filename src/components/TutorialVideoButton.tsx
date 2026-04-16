import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const TutorialVideoButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.2, type: "spring", damping: 14 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.7)] transition-shadow"
        aria-label="Watch tutorial video"
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-black/20">
          <Play className="h-4 w-4 fill-current" />
          <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
        </span>
        <span className="hidden sm:inline">Watch tutorial</span>
        <span className="sm:hidden">Tutorial</span>
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl border-primary/30 bg-background/95 p-0 backdrop-blur-xl">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            aria-label="Close tutorial"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="aspect-video overflow-hidden rounded-lg">
            {open && (
              <video
                src="/videos/tutorial.mp4"
                autoPlay
                controls
                playsInline
                className="h-full w-full"
              />
            )}
          </div>
          <div className="px-6 pb-5 pt-3">
            <h3 className="text-lg font-bold text-foreground">How LootBoxx works in 25 seconds</h3>
            <p className="text-sm text-muted-foreground">
              Browse games · Spin to win · Top up · Cash out — that's it.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TutorialVideoButton;
