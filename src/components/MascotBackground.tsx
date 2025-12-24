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
    <div
      className={`absolute top-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] pointer-events-none opacity-[0.04] ${positionClasses[position]} ${className}`}
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
