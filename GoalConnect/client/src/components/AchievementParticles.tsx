import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: "ice" | "snow" | "sparkle" | "summit";
  size: number;
  rotation: number;
  rotationSpeed: number;
}

interface AchievementParticlesProps {
  trigger: boolean;
  type?: "habit-complete" | "summit-reached" | "streak-milestone" | "level-up";
  x?: number; // Origin x position (0-100%)
  y?: number; // Origin y position (0-100%)
}

const PARTICLE_CONFIGS = {
  "habit-complete": {
    count: 15,
    types: ["ice", "sparkle"] as const,
    spread: 60,
    velocity: 3,
    color: "#7dd3fc",
  },
  "summit-reached": {
    count: 30,
    types: ["summit", "sparkle", "snow"] as const,
    spread: 90,
    velocity: 5,
    color: "#fbbf24",
  },
  "streak-milestone": {
    count: 20,
    types: ["ice", "snow"] as const,
    spread: 75,
    velocity: 4,
    color: "#46B3A9",
  },
  "level-up": {
    count: 25,
    types: ["sparkle", "summit"] as const,
    spread: 80,
    velocity: 4.5,
    color: "#f97316",
  },
};

export function AchievementParticles({
  trigger,
  type = "habit-complete",
  x = 50,
  y = 50,
}: AchievementParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const config = PARTICLE_CONFIGS[type];
    const newParticles: Particle[] = [];

    for (let i = 0; i < config.count; i++) {
      const angle = (Math.random() * config.spread - config.spread / 2) * (Math.PI / 180);
      const velocity = config.velocity * (0.5 + Math.random() * 0.5);
      const particleType = config.types[Math.floor(Math.random() * config.types.length)];

      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2, // Upward bias
        life: 100,
        maxLife: 100,
        type: particleType,
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    setParticles(newParticles);

    // Animation loop
    const interval = setInterval(() => {
      setParticles((prev) => {
        const updated = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2, // Gravity
            vx: p.vx * 0.98, // Air resistance
            life: p.life - 2,
            rotation: p.rotation + p.rotationSpeed,
          }))
          .filter((p) => p.life > 0);

        if (updated.length === 0) {
          clearInterval(interval);
        }

        return updated;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [trigger, type, x, y]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => {
        const opacity = particle.life / particle.maxLife;

        return (
          <div
            key={particle.id}
            className="absolute transition-opacity"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity,
              transform: `rotate(${particle.rotation}deg)`,
              fontSize: `${particle.size}px`,
            }}
          >
            {particle.type === "ice" && (
              <div
                className="w-2 h-2 bg-gradient-to-br from-mountain-glacier-ice to-mountain-sky-light rounded-sm"
                style={{
                  boxShadow: "0 0 4px rgba(125, 211, 252, 0.6)",
                }}
              />
            )}
            {particle.type === "snow" && (
              <div className="text-white drop-shadow-lg">❄</div>
            )}
            {particle.type === "sparkle" && (
              <div className="text-mountain-golden-hour drop-shadow-lg">✨</div>
            )}
            {particle.type === "summit" && (
              <div className="text-mountain-alpenglow drop-shadow-lg">⛰️</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
