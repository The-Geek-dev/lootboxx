import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  type: "circle" | "line" | "diamond";
}

const CyberpunkParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Respect user motion preference — skip animation entirely.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    // Device-tier scaling: phones / low-core machines get fewer particles.
    const cores = (navigator.hardwareConcurrency ?? 4);
    const isMobile = window.innerWidth < 768;
    const tierFactor = isMobile ? 0.35 : cores <= 4 ? 0.6 : 1;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const colors = [
      "rgba(94, 231, 223, 0.6)",
      "rgba(139, 92, 246, 0.6)",
      "rgba(99, 102, 241, 0.5)",
      "rgba(94, 231, 223, 0.3)",
    ];
    const types: Particle["type"][] = ["circle", "line", "diamond"];

    const initParticles = () => {
      const baseDensity = 28000; // higher = fewer particles
      const particleCount = Math.floor(((canvas.width * canvas.height) / baseDensity) * tierFactor);
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.3 - 0.2,
          opacity: Math.random() * 0.5 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          type: types[Math.floor(Math.random() * types.length)],
        });
      }
    };

    initParticles();

    const drawParticle = (particle: Particle) => {
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.strokeStyle = particle.color;

      switch (particle.type) {
        case "circle":
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "line":
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.size * 4, particle.y + particle.size * 2);
          ctx.stroke();
          break;
        case "diamond":
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y - particle.size);
          ctx.lineTo(particle.x + particle.size, particle.y);
          ctx.lineTo(particle.x, particle.y + particle.size);
          ctx.lineTo(particle.x - particle.size, particle.y);
          ctx.closePath();
          ctx.fill();
          break;
      }
    };

    // Throttle to ~30fps on mobile/low-tier — saves ~50% CPU vs 60fps.
    const targetFps = tierFactor < 1 ? 30 : 60;
    const frameInterval = 1000 / targetFps;
    let lastFrame = 0;
    // Connection lines are O(n²); only redraw them every few frames.
    const connectionLinkDist = 120;
    const connectionDistSq = connectionLinkDist * connectionLinkDist;
    let frameCounter = 0;
    let isPaused = false;

    const animate = (now: number) => {
      animationRef.current = requestAnimationFrame(animate);
      if (isPaused) return;
      if (now - lastFrame < frameInterval) return;
      lastFrame = now;
      frameCounter++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        particle.opacity += (Math.random() - 0.5) * 0.02;
        if (particle.opacity < 0.1) particle.opacity = 0.1;
        else if (particle.opacity > 0.7) particle.opacity = 0.7;

        drawParticle(particle);
      }

      // Connection lines: only every 2nd frame, and only when not on small screens.
      if (!isMobile && frameCounter % 2 === 0) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(94, 231, 223, 0.5)";
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < connectionDistSq) {
              ctx.globalAlpha = (1 - Math.sqrt(dSq) / connectionLinkDist) * 0.15;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }
    };

    const handleVisibility = () => {
      isPaused = document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.8 }}
      aria-hidden="true"
    />
  );
};

export default CyberpunkParticles;
