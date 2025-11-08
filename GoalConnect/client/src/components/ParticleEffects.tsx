import { useEffect, useState } from 'react';

type ParticleType = 'hearts' | 'sparkles' | 'dust';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  rotation: number;
}

export function ParticleEffects({
  type,
  active = false,
  x = 0,
  y = 0,
  count = 5,
}: {
  type: ParticleType;
  active?: boolean;
  x?: number;
  y?: number;
  count?: number;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Generate particles
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: type === 'dust' ? -1 - Math.random() : -2 - Math.random() * 2,
      life: 1,
      size: type === 'hearts' ? 12 + Math.random() * 8 : 8 + Math.random() * 4,
      rotation: Math.random() * 360,
    }));

    setParticles(newParticles);

    // Animate particles
    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // gravity
            life: p.life - 0.02,
            rotation: p.rotation + 2,
          }))
          .filter(p => p.life > 0);

        if (updated.length === 0) {
          return [];
        }
        return updated;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [active, x, y, count, type]);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      overflow: 'visible',
    }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            top: `${p.y}px`,
            opacity: p.life,
            transform: `rotate(${p.rotation}deg)`,
            transition: 'none',
          }}
        >
          {type === 'hearts' && (
            <div style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              fontSize: `${p.size}px`,
              lineHeight: 1,
            }}>
              💖
            </div>
          )}
          {type === 'sparkles' && (
            <div style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: 'radial-gradient(circle, #FFD700, #FFA500, transparent)',
              borderRadius: '50%',
              boxShadow: '0 0 4px #FFD700',
            }} />
          )}
          {type === 'dust' && (
            <div style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: 'radial-gradient(circle, rgba(139, 69, 19, 0.5), transparent)',
              borderRadius: '50%',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}
