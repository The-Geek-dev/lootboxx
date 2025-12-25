import { motion } from "framer-motion";
import mascotBg from "@/assets/mascot-bg.jpg";

interface MascotBackgroundProps {
  position?: "left" | "right" | "center";
  className?: string;
}

const MascotBackground = ({ position = "center", className = "" }: MascotBackgroundProps) => {
  const positionClasses = {
    left: "left-0 -translate-x-1/4",
    right: "right-0 translate-x-1/4",
    center: "left-1/2 -translate-x-1/2",
  };

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
