import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
}

export default function MagicalForest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 8000);
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedY: Math.random() * 0.5 + 0.2,
          speedX: Math.random() * 0.4 - 0.2,
          opacity: Math.random() * 0.5 + 0.3,
        });
      }
    };

    // Update and draw particles
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        particle.y -= particle.speedY;
        particle.x += particle.speedX;

        if (particle.y < 0) {
          particle.y = canvas.height;
          particle.x = Math.random() * canvas.width;
        }

        if (particle.x < 0 || particle.x > canvas.width) {
          particle.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = `rgba(255, 220, 150, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Create sparkle DOM elements
    const createSparkle = (type: string, x?: number, y?: number) => {
      const sparkle = document.createElement('div');
      sparkle.className = type;
      sparkle.style.left = x !== undefined ? `${x}px` : `${Math.random() * 100}%`;
      sparkle.style.top = y !== undefined ? `${y}px` : `${Math.random() * 100}%`;

      if (type === 'floating-sparkle') {
        const driftX = (Math.random() - 0.5) * 200;
        const driftY = (Math.random() - 0.5) * 200 - 100;
        sparkle.style.setProperty('--drift-x', `${driftX}px`);
        sparkle.style.setProperty('--drift-y', `${driftY}px`);
      }

      container.appendChild(sparkle);

      const duration = type === 'floating-sparkle' ? 6000 :
                      type === 'pulse-sparkle' ? 3000 : 1500;

      setTimeout(() => sparkle.remove(), duration);
    };

    const createAmbientSparkle = () => {
      const types = ['sparkle', 'floating-sparkle', 'pulse-sparkle'];
      const type = types[Math.floor(Math.random() * types.length)];
      createSparkle(type);
    };

    const createPulsingSparkles = () => {
      const positions = [
        { x: window.innerWidth * 0.2, y: window.innerHeight * 0.3 },
        { x: window.innerWidth * 0.8, y: window.innerHeight * 0.4 },
        { x: window.innerWidth * 0.5, y: window.innerHeight * 0.6 },
      ];

      positions.forEach(pos => {
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        createSparkle('floating-sparkle', pos.x + offsetX, pos.y + offsetY);
      });
    };

    // Mouse interaction
    let lastSparkleTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSparkleTime > 500 && Math.random() > 0.7) {
        createSparkle('floating-sparkle', e.clientX, e.clientY);
        lastSparkleTime = now;
      }
    };

    // Initialize
    resizeCanvas();
    animate();

    // Initial burst of sparkles
    for (let i = 0; i < 30; i++) {
      setTimeout(createAmbientSparkle, i * 100);
    }

    // Set up intervals
    const ambientInterval = setInterval(createAmbientSparkle, 300);
    const pulsingInterval = setInterval(createPulsingSparkles, 2000);

    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(ambientInterval);
      clearInterval(pulsingInterval);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Background Layer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          background: `
            radial-gradient(ellipse at 20% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(45, 27, 78, 0.2) 0%, transparent 70%),
            linear-gradient(180deg, #0a0e1a 0%, #1a1f3a 30%, #2d1b4e 60%, #1f3d4a 80%, #0f1828 100%)
          `,
        }}
      />

      {/* Sparkle Container */}
      <div
        id="magical-forest-container"
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
      >
        <canvas
          id="magical-forest-canvas"
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </>
  );
}
