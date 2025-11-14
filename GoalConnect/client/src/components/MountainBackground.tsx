import { useEffect, useRef, useState } from "react";
import { getTodaysMountain, type MountainProfile } from "@/lib/mountainProfiles";

interface MountainBackgroundProps {
  profile?: MountainProfile;
}

export function MountainBackground({ profile }: MountainBackgroundProps = {}) {
  // Use provided profile or get today's mountain
  const mountainProfile = profile || getTodaysMountain();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Create snow particles with varied sizes and speeds
    const particleCount = window.innerWidth < 768 ? 15 : 30;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'mountain-particle';
      const size = 2 + Math.random() * 4; // 2-6px
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 10 + 's';
      particle.style.animationDuration = (8 + Math.random() * 12) + 's';
      particle.style.opacity = String(0.2 + Math.random() * 0.4);
      canvas.appendChild(particle);
    }

    // Create cloud elements
    for (let i = 0; i < 3; i++) {
      const cloud = document.createElement('div');
      cloud.className = `mountain-cloud cloud-layer-${i}`;
      cloud.style.left = (Math.random() * 100) + '%';
      cloud.style.top = (20 + Math.random() * 40) + '%';
      cloud.style.animationDelay = (i * 5) + 's';
      canvas.appendChild(cloud);
    }

    // Add occasional sparkles
    const addSparkle = () => {
      const sparkle = document.createElement('div');
      sparkle.className = 'mountain-sparkle';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 60 + '%';
      canvas.appendChild(sparkle);

      setTimeout(() => sparkle.remove(), 2000);
    };

    const sparkleInterval = setInterval(addSparkle, 3000);

    return () => {
      canvas.innerHTML = '';
      clearInterval(sparkleInterval);
    };
  }, []);

  // Parallax scroll effect (scroll only, no mouse) - throttled for smoothness
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <div className="mountain-bg">
        {/* Sky gradient with horizon glow */}
        <div className="sky-gradient" />

        {/* Horizon glow - sunrise/golden hour effect */}
        <div className="horizon-glow" />

        {/* Mountain Layers - Far to Near with parallax */}

        {/* Layer 1 - Farthest Mountains (Purple-blue, very faint) */}
        <div
          className="mountain-layer layer-far-1"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`
          }}
        >
          <svg className="mountain-silhouette" viewBox="0 0 1400 600" preserveAspectRatio="none">
            <defs>
              <linearGradient id="snowCap1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: '#e0f2ff', stopOpacity: 0.2 }} />
              </linearGradient>
            </defs>
            {/* Mountain peaks */}
            <path d={mountainProfile.layers.far1}
                  fill="#1a2942" opacity="0.3" />
          </svg>
        </div>

        {/* Layer 2 - Mid-Far Mountains (Blue-gray) */}
        <div
          className="mountain-layer layer-far-2"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`
          }}
        >
          <svg className="mountain-silhouette" viewBox="0 0 1400 600" preserveAspectRatio="none">
            <defs>
              <linearGradient id="snowCap2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.7 }} />
                <stop offset="100%" style={{ stopColor: '#e0f2ff', stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
            <path d={mountainProfile.layers.far2}
                  fill="#253a52" opacity="0.5" />
            {/* Snow caps for layer 2 */}
            {mountainProfile.snowCaps.find(sc => sc.layer === 2)?.paths.map((path, i) => (
              <path key={i} d={path} fill="url(#snowCap2)" />
            ))}
          </svg>
        </div>

        {/* Layer 3 - Middle Mountains (Gray-blue) */}
        <div
          className="mountain-layer layer-mid"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`
          }}
        >
          <svg className="mountain-silhouette" viewBox="0 0 1400 600" preserveAspectRatio="none">
            <defs>
              <linearGradient id="snowCap3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#e0f2ff', stopOpacity: 0.4 }} />
              </linearGradient>
            </defs>
            <path d={mountainProfile.layers.mid}
                  fill="#2f4a62" opacity="0.7" />
            {/* Snow caps for layer 3 */}
            {mountainProfile.snowCaps.find(sc => sc.layer === 3)?.paths.map((path, i) => (
              <path key={i} d={path} fill="url(#snowCap3)" />
            ))}
          </svg>
        </div>

        {/* Layer 4 - Near Mountains (Darker gray) */}
        <div
          className="mountain-layer layer-near"
          style={{
            transform: `translateY(${scrollY * 0.4}px)`
          }}
        >
          <svg className="mountain-silhouette" viewBox="0 0 1400 600" preserveAspectRatio="none">
            <defs>
              <linearGradient id="snowCap4" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.9 }} />
                <stop offset="100%" style={{ stopColor: '#e0f2ff', stopOpacity: 0.5 }} />
              </linearGradient>
            </defs>
            <path d={mountainProfile.layers.near}
                  fill="#3a5570" opacity="0.85" />
            {/* Snow caps for layer 4 */}
            {mountainProfile.snowCaps.find(sc => sc.layer === 4)?.paths.map((path, i) => (
              <path key={i} d={path} fill="url(#snowCap4)" />
            ))}
          </svg>
        </div>

        {/* Layer 5 - Foreground Mountains (Darkest) */}
        <div
          className="mountain-layer layer-foreground"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        >
          <svg className="mountain-silhouette" viewBox="0 0 1400 600" preserveAspectRatio="none">
            <defs>
              <linearGradient id="snowCap5" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#e0f2ff', stopOpacity: 0.6 }} />
              </linearGradient>
            </defs>
            <path d={mountainProfile.layers.foreground}
                  fill="#445d75" opacity="1.0" />
            {/* Snow caps for layer 5 */}
            {mountainProfile.snowCaps.find(sc => sc.layer === 5)?.paths.map((path, i) => (
              <path key={i} d={path} fill="url(#snowCap5)" />
            ))}
          </svg>
        </div>

        {/* Animated elements container (snow, clouds, sparkles) */}
        <div ref={canvasRef} className="animated-elements"></div>

        {/* Mist/fog in valleys */}
        <div className="mountain-mist mist-1" />
        <div className="mountain-mist mist-2" />
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
        }

        /* Sky gradient - deep blue to lighter blue at horizon */
        .sky-gradient {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, ${mountainProfile.skyGradient.join(', ')});
        }

        /* Horizon glow - sunrise/golden hour effect */
        .horizon-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 40%;
          background: radial-gradient(ellipse at bottom,
            ${mountainProfile.horizonGlow.colors[0]} 0%,
            ${mountainProfile.horizonGlow.colors[1]} 30%,
            ${mountainProfile.horizonGlow.colors.length > 2 ? mountainProfile.horizonGlow.colors[2] : 'transparent'} 50%,
            transparent 70%
          );
          opacity: ${mountainProfile.horizonGlow.opacity};
        }

        .mountain-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          bottom: 0;
          transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          will-change: transform;
        }

        .mountain-silhouette {
          width: 100%;
          height: 100%;
          position: absolute;
          bottom: 0;
        }

        /* Snow particles - realistic falling animation */
        .mountain-particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.3) 100%);
          animation: particle-fall linear infinite;
          pointer-events: none;
        }

        @keyframes particle-fall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) translateX(50px) rotate(360deg);
            opacity: 0;
          }
        }

        /* Sparkle particles - occasional ice crystal glints */
        .mountain-sparkle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(200, 230, 255, 0.5) 50%, transparent 100%);
          border-radius: 50%;
          animation: sparkle-twinkle 2s ease-in-out forwards;
          pointer-events: none;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(200, 230, 255, 0.4);
        }

        @keyframes sparkle-twinkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0.5) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.5) rotate(180deg);
          }
        }

        /* Cloud layers - drifting at different speeds */
        .mountain-cloud {
          position: absolute;
          width: 200px;
          height: 60px;
          background: radial-gradient(ellipse at center,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.08) 40%,
            transparent 70%
          );
          border-radius: 50%;
          filter: blur(20px);
          animation: cloud-drift linear infinite;
          pointer-events: none;
        }

        .cloud-layer-0 {
          animation-duration: 80s;
          opacity: 0.3;
        }

        .cloud-layer-1 {
          animation-duration: 100s;
          opacity: 0.25;
          animation-direction: reverse;
        }

        .cloud-layer-2 {
          animation-duration: 120s;
          opacity: 0.2;
        }

        @keyframes cloud-drift {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(calc(100vw + 200px));
          }
        }

        /* Mist in valleys */
        .mountain-mist {
          position: absolute;
          bottom: 15%;
          left: 0;
          width: 100%;
          height: 25%;
          background: linear-gradient(to top,
            rgba(200, 220, 240, 0.1) 0%,
            rgba(200, 220, 240, 0.05) 50%,
            transparent 100%
          );
          filter: blur(30px);
          pointer-events: none;
        }

        .mist-1 {
          animation: mist-drift 40s ease-in-out infinite;
        }

        .mist-2 {
          bottom: 20%;
          height: 20%;
          animation: mist-drift 60s ease-in-out infinite reverse;
          opacity: 0.6;
        }

        @keyframes mist-drift {
          0%, 100% {
            transform: translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateX(50px);
            opacity: 0.5;
          }
        }

        .animated-elements {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .mountain-layer {
            transition: none;
          }
          .mountain-particle,
          .mountain-cloud,
          .mountain-sparkle,
          .mountain-mist {
            animation: none;
          }
        }

        /* Simplify on mobile for performance */
        @media (max-width: 768px) {
          .mountain-cloud,
          .mountain-mist,
          .mountain-sparkle {
            display: none;
          }

          .mountain-layer {
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}
