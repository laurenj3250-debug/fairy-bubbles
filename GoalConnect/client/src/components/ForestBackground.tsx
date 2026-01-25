import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * ForestBackground - Icy winter night theme
 */

export function ForestBackground() {
  const isMobile = useIsMobile();

  // Track if component has mounted (for hydration safety)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Reduce particle count on mobile for better performance
  // Start with mobile-friendly defaults to prevent flash during hydration
  const starCount = !mounted || isMobile ? 10 : 35;
  const snowflakeCount = !mounted || isMobile ? 6 : 20;

  return (
    <>
      {/* Base icy dark teal */}
      <div
        className="fixed inset-0 z-0"
        style={{ background: '#0c1e2b' }}
      />


      {/* Full panorama background */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <img
          src="/final-panorama.png"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
          }}
        />
      </div>

      {/* Hero - ice climber - STAR OF THE SHOW */}
      <div
        className="fixed z-[2] pointer-events-none"
        style={{
          right: '0',
          bottom: '5%',
          width: '55%',
          maxWidth: '850px',
          height: '95%',
          maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
        }}
      >
        <img
          src="/final-hero.png"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'bottom right',
          }}
        />
      </div>

      {/* Twinkling stars - brighter for winter night */}
      <div className="fixed inset-0 z-[3] pointer-events-none overflow-hidden">
        {[...Array(starCount)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${5 + (i * 31) % 90}%`,
              top: `${3 + (i * 19) % 45}%`,
              width: i % 4 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1px',
              height: i % 4 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1px',
              background: i % 4 === 0 ? 'rgba(200, 230, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
              boxShadow: i % 4 === 0 ? '0 0 4px 1px rgba(200, 230, 255, 0.5)' : 'none',
              animation: `twinkle ${2 + (i % 5)}s ease-in-out infinite ${i * 0.2}s`,
            }}
          />
        ))}
      </div>


      {/* Drifting snow mist */}
      <div
        className="fixed inset-0 z-[4] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(180, 210, 230, 0.05) 25%, rgba(180, 210, 230, 0.08) 50%, rgba(180, 210, 230, 0.05) 75%, transparent 100%)',
          animation: 'mistDrift 25s ease-in-out infinite',
        }}
      />

      {/* Falling snowflakes */}
      <div className="fixed inset-0 z-[3] pointer-events-none overflow-hidden">
        {[...Array(snowflakeCount)].map((_, i) => (
          <div
            key={`snow-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${5 + (i * 47) % 90}%`,
              width: i % 3 === 0 ? '4px' : '2px',
              height: i % 3 === 0 ? '4px' : '2px',
              background: 'rgba(255, 255, 255, 0.8)',
              boxShadow: '0 0 6px 2px rgba(200, 230, 255, 0.4)',
              animation: `snowfall${i % 3} ${12 + (i % 8)}s linear infinite ${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* CSS for all animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes icyGlow {
          0%, 100% { filter: saturate(0.7) brightness(0.95) drop-shadow(0 0 20px rgba(150, 200, 255, 0.15)); }
          50% { filter: saturate(0.7) brightness(1) drop-shadow(0 0 40px rgba(150, 200, 255, 0.3)); }
        }
        @keyframes mistDrift {
          0%, 100% { transform: translateX(-8%) scaleX(1.2); opacity: 0.5; }
          50% { transform: translateX(8%) scaleX(1); opacity: 0.7; }
        }
        @keyframes snowfall0 {
          0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.6; }
          100% { transform: translateY(110vh) translateX(30px) rotate(360deg); opacity: 0; }
        }
        @keyframes snowfall1 {
          0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.5; }
          100% { transform: translateY(110vh) translateX(-20px) rotate(-360deg); opacity: 0; }
        }
        @keyframes snowfall2 {
          0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.4; }
          100% { transform: translateY(110vh) translateX(15px) rotate(180deg); opacity: 0; }
        }
      `}</style>
    </>
  );
}
