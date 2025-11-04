import { useEffect, useRef } from "react";

export function EnchantedForestBackground() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Create fireflies (glowing particles)
    for (let i = 0; i < 25; i++) {
      const firefly = document.createElement('div');
      firefly.className = 'firefly';
      firefly.style.left = Math.random() * 100 + '%';
      firefly.style.top = Math.random() * 100 + '%';
      firefly.style.animationDelay = Math.random() * 5 + 's';
      firefly.style.animationDuration = (3 + Math.random() * 4) + 's';
      canvas.appendChild(firefly);
    }

    // Create floating particles (fairy dust)
    for (let i = 0; i < 40; i++) {
      const particle = document.createElement('div');
      particle.className = 'fairy-dust';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.animationDuration = (10 + Math.random() * 10) + 's';
      canvas.appendChild(particle);
    }

    // Create falling leaves
    for (let i = 0; i < 15; i++) {
      const leaf = document.createElement('div');
      leaf.className = 'falling-leaf';
      leaf.style.left = Math.random() * 100 + '%';
      leaf.style.animationDelay = Math.random() * 10 + 's';
      leaf.style.animationDuration = (15 + Math.random() * 10) + 's';
      canvas.appendChild(leaf);
    }

    return () => {
      canvas.innerHTML = '';
    };
  }, []);

  return (
    <>
      <div className="enchanted-forest-bg">
        {/* Layer 1: Distant misty trees */}
        <div className="forest-layer layer-distant">
          <svg className="tree-silhouette" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M10,90 Q15,60 20,50 Q25,40 20,30 Q15,20 20,10 L25,10 Q30,20 25,30 Q20,40 25,50 Q30,60 35,90 Z" fill="rgba(20, 30, 48, 0.3)" />
            <path d="M40,90 Q45,55 50,45 Q55,35 50,25 Q45,15 50,5 L55,5 Q60,15 55,25 Q50,35 55,45 Q60,55 65,90 Z" fill="rgba(26, 26, 64, 0.3)" />
            <path d="M70,90 Q75,65 80,55 Q85,45 80,35 Q75,25 80,15 L85,15 Q90,25 85,35 Q80,45 85,55 Q90,65 95,90 Z" fill="rgba(30, 58, 58, 0.3)" />
          </svg>
        </div>

        {/* Layer 2: Mid-distance trees */}
        <div className="forest-layer layer-mid">
          <svg className="tree-silhouette" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M5,90 Q10,65 15,55 Q20,45 15,35 Q10,25 15,15 L20,15 Q25,25 20,35 Q15,45 20,55 Q25,65 30,90 Z" fill="rgba(45, 27, 78, 0.4)" />
            <path d="M35,90 Q40,60 45,50 Q50,40 45,30 Q40,20 45,10 L50,10 Q55,20 50,30 Q45,40 50,50 Q55,60 60,90 Z" fill="rgba(15, 32, 39, 0.4)" />
            <path d="M65,90 Q70,70 75,60 Q80,50 75,40 Q70,30 75,20 L80,20 Q85,30 80,40 Q75,50 80,60 Q85,70 90,90 Z" fill="rgba(26, 46, 64, 0.4)" />
          </svg>
        </div>

        {/* Layer 3: Foreground elements */}
        <div className="forest-layer layer-foreground">
          {/* Hanging vines */}
          <div className="vine vine-1"></div>
          <div className="vine vine-2"></div>
          <div className="vine vine-3"></div>
          <div className="vine vine-4"></div>
        </div>

        {/* Animated elements */}
        <div ref={canvasRef} className="animated-elements"></div>
      </div>

      <style>{`
        .enchanted-forest-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          background: linear-gradient(180deg,
            #0a0e27 0%,
            #1a1a40 25%,
            #2d1b4e 50%,
            #1e3a3a 75%,
            #0f2027 100%
          );
        }

        .forest-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          transition: transform 0.1s ease-out;
        }

        .layer-distant {
          transform: translateZ(-100px) scale(1.5);
          opacity: 0.3;
        }

        .layer-mid {
          transform: translateZ(-50px) scale(1.2);
          opacity: 0.5;
        }

        .layer-foreground {
          transform: translateZ(0);
          opacity: 0.7;
        }

        .tree-silhouette {
          width: 100%;
          height: 100%;
        }

        /* Hanging magical ribbons - darker, more mysterious */
        .vine {
          position: absolute;
          top: -50px;
          width: 4px;
          height: 30vh;
          background: linear-gradient(to bottom,
            rgba(75, 85, 99, 0.4),
            rgba(45, 55, 72, 0.3),
            transparent
          );
          border-radius: 2px;
          animation: vine-sway 8s ease-in-out infinite;
        }

        .vine-1 { left: 15%; animation-delay: 0s; }
        .vine-2 { left: 35%; height: 40vh; animation-delay: 1.5s; }
        .vine-3 { left: 60%; height: 25vh; animation-delay: 3s; }
        .vine-4 { left: 85%; height: 35vh; animation-delay: 4.5s; }

        @keyframes vine-sway {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(10px) rotate(2deg); }
          75% { transform: translateX(-10px) rotate(-2deg); }
        }

        /* Fireflies - eerie blue-green glow */
        .firefly {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #7dd3c0;
          box-shadow: 0 0 10px 2px #5eead4, 0 0 20px 4px rgba(94, 234, 212, 0.3);
          animation: firefly-float 8s ease-in-out infinite;
        }

        @keyframes firefly-float {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0;
          }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% {
            transform: translate(calc(var(--random-x, 50px)), calc(var(--random-y, -100px)));
          }
        }

        /* Fairy dust particles - mystical purple */
        .fairy-dust {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(167, 139, 250, 0.6);
          box-shadow: 0 0 4px 1px rgba(139, 92, 246, 0.4);
          animation: dust-rise 15s linear infinite;
        }

        @keyframes dust-rise {
          0% {
            transform: translateY(100vh) translateX(0) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: scale(1);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-20vh) translateX(calc(var(--drift, 50px))) scale(0);
            opacity: 0;
          }
        }

        /* Falling leaves - dark, gothic */
        .falling-leaf {
          position: absolute;
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          animation: leaf-fall 20s linear infinite;
          opacity: 0.5;
        }

        @keyframes leaf-fall {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(110vh) translateX(100px) rotate(720deg);
            opacity: 0;
          }
        }

        .animated-elements {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        /* Parallax effect on scroll */
        @media (prefers-reduced-motion: no-preference) {
          .forest-layer {
            will-change: transform;
          }
        }
      `}</style>
    </>
  );
}
