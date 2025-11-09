import { useEffect, useRef } from "react";

export function MountainBackground() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Create subtle floating particles (like snow dust)
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'mountain-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.animationDuration = (12 + Math.random() * 8) + 's';
      canvas.appendChild(particle);
    }

    return () => {
      canvas.innerHTML = '';
    };
  }, []);

  return (
    <>
      <div className="mountain-bg">
        {/* Mountain Silhouette Layer 1 - Distant */}
        <div className="mountain-layer layer-distant">
          <svg className="mountain-silhouette" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <path d="M0,400 L0,280 Q200,180 400,220 Q600,180 800,240 Q1000,200 1200,260 L1200,400 Z"
                  fill="rgba(30, 58, 95, 0.15)" />
          </svg>
        </div>

        {/* Mountain Silhouette Layer 2 - Mid */}
        <div className="mountain-layer layer-mid">
          <svg className="mountain-silhouette" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <path d="M0,400 L0,320 Q150,240 300,280 Q500,220 700,300 Q900,240 1050,290 Q1150,260 1200,310 L1200,400 Z"
                  fill="rgba(30, 58, 95, 0.20)" />
          </svg>
        </div>

        {/* Mountain Silhouette Layer 3 - Close */}
        <div className="mountain-layer layer-close">
          <svg className="mountain-silhouette" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <path d="M0,400 L0,360 Q100,300 250,340 Q400,280 600,350 Q800,310 950,360 Q1100,330 1200,370 L1200,400 Z"
                  fill="rgba(30, 58, 95, 0.25)" />
          </svg>
        </div>

        {/* Animated elements container */}
        <div ref={canvasRef} className="animated-elements"></div>
      </div>

      <style>{`
        .mountain-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          background: linear-gradient(180deg,
            #1e3a5f 0%,
            #2a4a6f 35%,
            #374b5e 65%,
            #4a5d6f 100%
          );
        }

        .mountain-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          bottom: 0;
          transition: transform 0.1s ease-out;
        }

        .layer-distant {
          bottom: 0;
          opacity: 1;
        }

        .layer-mid {
          bottom: 0;
          opacity: 1;
        }

        .layer-close {
          bottom: 0;
          opacity: 1;
        }

        .mountain-silhouette {
          width: 100%;
          height: 100%;
          position: absolute;
          bottom: 0;
        }

        /* Subtle floating particles - like snow dust or mist */
        .mountain-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          animation: particle-drift linear infinite;
        }

        @keyframes particle-drift {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(100vh) translateX(30px);
            opacity: 0;
          }
        }

        .animated-elements {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        /* Parallax effect on scroll - optional */
        @media (prefers-reduced-motion: no-preference) {
          .mountain-layer {
            will-change: transform;
          }
        }
      `}</style>
    </>
  );
}
