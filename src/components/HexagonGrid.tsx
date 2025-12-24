import { useEffect, useRef } from "react";

const HexagonGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const hexSize = 40;
    const hexWidth = hexSize * 2;
    const hexHeight = Math.sqrt(3) * hexSize;

    const drawHexagon = (
      centerX: number,
      centerY: number,
      size: number,
      opacity: number,
      pulse: number
    ) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = centerX + size * Math.cos(angle);
        const y = centerY + size * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Gradient stroke based on position
      const gradient = ctx.createLinearGradient(
        centerX - size,
        centerY - size,
        centerX + size,
        centerY + size
      );
      gradient.addColorStop(0, `rgba(94, 231, 223, ${opacity * pulse})`);
      gradient.addColorStop(1, `rgba(139, 92, 246, ${opacity * pulse})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Slow floating movement
      offsetRef.current.x += 0.15;
      offsetRef.current.y += 0.08;

      const time = Date.now() * 0.001;

      // Calculate grid dimensions
      const cols = Math.ceil(canvas.width / (hexWidth * 0.75)) + 2;
      const rows = Math.ceil(canvas.height / hexHeight) + 2;

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const isOffset = row % 2 === 1;
          const x =
            col * hexWidth * 0.75 +
            (isOffset ? hexWidth * 0.375 : 0) -
            (offsetRef.current.x % (hexWidth * 0.75));
          const y = row * hexHeight - (offsetRef.current.y % hexHeight);

          // Distance from center for opacity fade
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const distFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          const maxDist = Math.sqrt(
            Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2)
          );

          // Base opacity with distance fade
          const distanceFade = 1 - distFromCenter / maxDist;
          const baseOpacity = 0.15 * distanceFade;

          // Pulsing effect based on position and time
          const pulsePhase = (x + y) * 0.01 + time;
          const pulse = 0.5 + 0.5 * Math.sin(pulsePhase);

          if (baseOpacity > 0.02) {
            drawHexagon(x, y, hexSize * 0.9, baseOpacity, 0.6 + pulse * 0.4);
          }
        }
      }

      // Add some brighter accent hexagons
      const accentCount = 5;
      for (let i = 0; i < accentCount; i++) {
        const phase = time * 0.3 + (i * Math.PI * 2) / accentCount;
        const radius = 150 + Math.sin(time * 0.5 + i) * 50;
        const x = canvas.width / 2 + Math.cos(phase) * radius;
        const y = canvas.height / 2 + Math.sin(phase) * radius * 0.6;
        const pulse = 0.6 + 0.4 * Math.sin(time * 2 + i);

        drawHexagon(x, y, hexSize * 1.2, 0.3, pulse);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6, zIndex: -1 }}
    />
  );
};

export default HexagonGrid;
