import { motion } from "framer-motion";
import mascotBg from "@/assets/mascot-bg.jpg";

interface MascotBackgroundProps {
  position?: "left" | "right" | "center";
  variant?: "large" | "watermark";
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}

const MascotBackground = ({ 
  position = "center", 
  variant = "large",
  corner = "bottom-right",
  className = "" 
}: MascotBackgroundProps) => {
  const positionClasses = {
    left: "left-0 -translate-x-1/4",
    right: "right-0 translate-x-1/4",
    center: "left-1/2 -translate-x-1/2",
  };

  const cornerClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  if (variant === "watermark") {
    return (
      <motion.div
        animate={{
          opacity: [0.03, 0.05, 0.03],
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute w-[120px] h-[120px] md:w-[180px] md:h-[180px] pointer-events-none z-0 ${cornerClasses[corner]} ${className}`}
        style={{
          backgroundImage: `url(${mascotBg})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          filter: "drop-shadow(0 0 15px rgba(94, 231, 223, 0.15))",
        }}
      />
    );
  }

  return (
    <motion.div
      animate={{
        y: ["-50%", "-53%", "-50%"],
        scale: [1, 1.02, 1],
        opacity: [0.04, 0.06, 0.04],
        filter: [
          "drop-shadow(0 0 20px rgba(94, 231, 223, 0.1))",
          "drop-shadow(0 0 60px rgba(94, 231, 223, 0.25))",
          "drop-shadow(0 0 20px rgba(94, 231, 223, 0.1))",
        ],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`absolute top-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] pointer-events-none ${positionClasses[position]} ${className}`}
      style={{
        backgroundImage: `url(${mascotBg})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    />
  );
};

export default MascotBackground;
