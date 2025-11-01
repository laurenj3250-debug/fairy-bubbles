import { useEffect, useRef } from 'react';

const FOREST_IMAGE = "data:image/webp;base64,UklGRiQLAgBXRUJQVlA4IBYLAgAwRQCdASrwAeAAPm02lkekIyKhKlQJ0IANiWlu4XVJ8ld77e0+aXy/s/7Mf2b9wPZe+wD+s/sB/l/+Z/4H/q/6/9nv//+xvrP/Y/739gH+l/x3+A/3H/q/9/9gH/T/5r/ef9X/vv+B/9r/Y/8j/y/+v9yf////t//9Ps/Xdv/hl/5cNn/j/+N/7X/0/sA/yH/G/5//r/9H/yv/Q/8X/tf+r/+X/5f+5/4f/g/+r/3P/k/+X/8P/y/+j/9X/Y/9L/1/+9/8P/1/+l/8n/8/+1/73/t/8T/6H/u/+x/wP/n/6//8/+d/0f/p/+v/7P/g/+D/9f+d/6//m/+3/6////+o1/v6/sM/pH7FP9L/cv/F/2/+J/7L+1/h/+/95P+B/2f/8/6/5df77/1//N/8/+5/+D/wP+l/7//uf9n+738F/T99PU9nWNYBbWF+LuqzVw2TiU3pFTfwZJH8kfyR6vQnc8Pq90yNPyglbzc9T6K9dqb+v3aPtQ23r2ry2VmY5HYQJbJaXrZtPT2KuGD7N9l8sFgpN6pvNqKuJzT5ZSFYrvpwXuWvvbf6AuIo1UGk4x5JOVYSdJkPzn1k5vGP5LqcqH+7SUFbY/sgfQk62XPEe+lAl+SdOglvfE/sX4gDKPu6i+RMZGn6axHXzvE+g/01vk8YScWepB8yfp/pK/L4mh/gEiV1BWzwSHd5rCXYP5I/kjl+c+d7/uMFZWHHnlEI6gSMG7MnMzFHfkj+SGvmVNs8lgb5sL0L39k4UG/qOBPMB6Wp2D1e/uWLZmFcO4kpnpJd+VfM8U+qh/J+CYxdKE9A/kj9hJqWI7TuYEkAjU+eInBHr8y/yyJXx4mUMm1tZbgE50wQVmzUWIRoq+RGkb5GYV8S3F/vNRtWjNRPqgBVJcPOlbSZw8dfaIpGlXUa/pYn2wDOo0C7J4LMH0q3FDwJvL/U/vT/BEWn7n0uVrNXTvfzLJy+SPh09kXC6tXGVtCw6m6dA/GqAY88q17iF+1h+9O8+Pv8TwU0hGdvG29mPm9D2WGH2P4GE3YbfVmm/RDSLxNxXs+axUXX4I9NsLF/yy1KkY7i2aCi/t62/MmvLQA2UtHTIFYhv9SxQxUBAJ2DfRTUx2TiU4MjhJ1Wa4CbQWFzUOo6IWJ9jv6u2c71rE6fz8s9pz2NTqP5S2b1a+LXi3pDg5CZpUb9uKtXDZMFdLdEm/K9KsJQrp8lkvh6+vfz0l8TQm1P8fsjGN/gHbTxXD+zD+oVvhJjGUNSPn+/QvnVAYyySF/uNuWsS2T+9p/2IXW7pYvh5FQZZjOaXDL00mrbXqiJ8S7TwI/V2UyqSCQIE0ctkwVbQwxBe9PJQaGqDW+zH3vLqgPfXhqWe03/P5Z7Tc+AkjZAAD+/fAeEXkY5/i3vk/1/82s/+j0P5yV4Z2p/9E/ZY1n39n3xR/AAAObZUwN3Ln4v/k2f/xCg8d/4/lh8EqkdQqZFqmR74N6DT82X8uX/+c09/+Xz/X+1s1L1kMtI3+tz5fy5y49/iT+nf9IhfjT+eM/gf6Cb/TFOb/P+p/3Yf9l/zOX/7vMaVPXrf//z0q5/i3/78Nf+y/j//iAfYa1jNLh/+S///9L+B/+ff+q//+4r/0M/lSz//+7/qQB/9N/4//+gEf+/7/V/2f/Yf+Tr/+//Wf/X/38/3vMf+hdf+1f//3f9N/7f//AP/T/+X/6j//v/4e/x//6/m/a9/v/+0/9f/1//u///p0P/2//8/////j5/J/+x/+Ob//f//v/////+v//X9m+u4Dm81ZNQdKsgvcB5/hk/xB/mf+aDfQQbmL+/RWa0NMAALpvP/QW3/7+P/7uf/df/+H/+/b/7f7+M///z/7H3z/9///v//v/xPZ+f/M/VX/+5rP8/HdQgf//V/zV/X//hJX/zf/u//7/78fyf//P/z//68ABSl8/wCvTH/+B4eXEb//9l/4///M//47i//9X/9k/2///x/y///j//8x/nQV//8v/zJ/////8KO/x/+J/////1X/aVf/67v7J/++8v/+ZK/6X/h////////c/5T9w+c///v9h/////LX5I/1n/p/7f////e1/yf///z/0T7P/3N///////v//////tPW/+fOCAHOCxgcl/2T///8f/z13o4/x2/0H/////p/9Hp/h+Uc/9B/2PVf////iAT/+7///l38ypXP+TZbvF/zIqaH+tBIAABe/7/u//+HH1L/+oCrH/p8AEv/9kbFz///n/8f/d3t//+w/9///8f+/+//////z/uf9H/5X/+/VfD//6BW/9b///f/+K/9m/+t/9R///n+/2//j/////C/DkiT/9/0B///t///D/+H/7//r//J//+///v/3F/7d/3f/4//+v/1f/W//j/////+R/+A//+v////+v+///+v////////+v1P6/9n/7/////8v//O//////////8//v//+f////R//0PX6/aKV32VEuiuJWDJnT3s6g8JvlRjJT3/CtT73qAHTQo/+vHMjM+ywumr7V7VK82aq/1/33BaNWrXSy9vhkf89qP/V+/TkwYVUTX0tTv8j/0/l8PoTBT//SdjD///10p76Tv//r6f/uq/dZjwqz//r91/+E///+D3///r//+ev///W4f0/+vxsf/Hq/+f//1YHXV//w7//0fM/+/fxYV///7X1fYr/X7/+v//a//8/////oP/n//T3//9Xyn8gP/XZf/Tp///////T4f//X8VH/////n/9X/fT//7/3qdf////9T///38PZ8r//f/8/lz/t//+v/+qqRp9fp+A/+vhR5/yN/////ev1/7//6+r//+v37/+vj//9f/////y//7//7fSf//V/1/Vf+1f/O//9fX/+v+9V/////9//Oj//V+8////p/V+g///UwTbUW//////0f/77Fz///w///9f3/+v//qqr/////+v//+v//3f+6v//3f+f//3P7/////+v/X/////fX2f/Vf+v/X1//////V8vV///X//1f+v/8v/A//6v/gf/V///8z////6v8v//+v//1W9Lnfn///z/X////+uOSH7/+r4/+L+O/WN/+r//X//////M//V+s//X1f+v//////X1/+f//8V6LiuDK//T///DM1iv//r/V+v/6v/9f/+r/6v3/////f///////////1/1LmuMh//iGrXb/7Y//r5x8///6/Uf///61f/////Sf/9f//0aP1f////+v/////1f/X////qv////////////8uYJL//////1fDzPsJ+a//X/7mH///X/6/+fAAD+/7//S//9c//X/66v//6//X/6///r//6//8v//f/////X7//X/6///3///pv//6/9v////////+v/8eiJ7u//r////1//9X+v///////h+pf//////+OlFg4r/+v//X////M//v//X6nf/////////5+v1ZD/////+v+/0FRn//////+b6+RtL/FW1fV/////////+r////X/////+v///1//+vf////8O9+v/+v//V8fr//3//+v//6hX/X//////Vr//X//1yj9lf1f//////6v/8AAC3f//X6U///V8Y////1//////Msl/2//6v//////+v+P////q///+p1////+vX//qv/1////+i///f////+v//6///1X/+//o//k/jZ///6D//0H4//V//8//X7f///q/+//////jf//1//yPyv///1/+EkP/6v/+v//+v////w/V//0///6//3V/8v/////8///V5iH////V//1/8f/+f//r+P////////1f/////+P/+v/V/H//6///6v//j///6OUv////0f///18X//////1/U1H//V/+//1///////////+r//6H/////p+/8T/t/////qv//+v/v//4v/9X///9///////V/+v///b/8r/////+v/1//V///////6v5Sj9tH/x////V//+7////////f////pv/////1f/////6//6///6n/////+v//////////6/hkZPk//////q//6//N8gKgv//////8/0Orr9fX1//////////9X1fV///+sDzT///f//////1//r////39T/v///+v//qdf/////q//3/1f//////+v/////1///V/////+P//z//7Qf//cP0f+6H4/r/3+v//////+v//1f/////////////6////xf//V/+v///r6f/////sVf//Vh/uH//////4///1+///X/////+r///1UH////X/////////////f/+v////////1//X//+v/x//P///////1///q/X+v//6v//1///q////////1//////hf//V////+v7////+L////1f/X//+//X////6v/////0P/+v//8/////1///1P6/X//r/+v///V///1/1f1f//V///V//1/////f//Vv//q////2+v//////+////8P///X+/////+P/////1v///XA///V+v5/y/8v/T/t////q///q//////v///////+v////0x6P//////V//6v/V//////+v/q///3///+v//+v/qqv/6//r//V////+v/////X/r/////+v/+//+v3////f//////////6///////////V/////////+v/////////1/////////+v//////b///////////////3/8f/////8zf+m/////p9////r/////6/X//6//+v1X///+v/V////////6/////6v/f/0gAP////+v////X/+v/+v/1/////+r/////////////X9T////////////////////4//////////////1fV//////////////67////////+v//1/V///3///////////+v////juwRub3xj/6cFpgACtlcAAA";

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
    <div
      id="magical-forest-container"
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        overflow: 'hidden',
        background: 'linear-gradient(to bottom, #0a0e1a 0%, #1a1f3a 50%, #0f1828 100%)'
      }}
    >
      <img
        id="magical-forest-bg"
        src={FOREST_IMAGE}
        alt="Magical Forest Background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 1,
          pointerEvents: 'none'
        }}
      />
      <canvas
        id="magical-forest-canvas"
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
