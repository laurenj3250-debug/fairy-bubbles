/**
 * Lightweight particle system for climbing-themed celebrations
 * Supports chalk puffs, dust clouds, and snow flurries
 */

import React from 'react';

export type ParticleType = 'chalk' | 'dust' | 'snow';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: string;
}

interface ParticleSystemOptions {
  type: ParticleType;
  x: number;
  y: number;
  count?: number;
  color?: string;
}

const PARTICLE_CONFIGS = {
  chalk: {
    count: 20,
    color: 'rgba(255, 255, 255',
    speedRange: { min: -3, max: 3 },
    sizeRange: { min: 2, max: 6 },
    life: 60, // frames
    gravity: 0.15,
    spread: 1.5,
  },
  dust: {
    count: 15,
    color: 'rgba(210, 180, 140',
    speedRange: { min: -2, max: 2 },
    sizeRange: { min: 3, max: 8 },
    life: 80,
    gravity: 0.08,
    spread: 1.2,
  },
  snow: {
    count: 25,
    color: 'rgba(240, 248, 255',
    speedRange: { min: -1.5, max: 1.5 },
    sizeRange: { min: 2, max: 5 },
    life: 100,
    gravity: 0.05,
    spread: 1.0,
  },
};

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrame: number | null = null;
  private reducedMotion: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Set canvas size to match element size
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  /**
   * Emit particles from a specific point
   */
  emit(options: ParticleSystemOptions) {
    if (this.reducedMotion) return; // Respect accessibility

    const config = PARTICLE_CONFIGS[options.type];
    const count = options.count || config.count;
    const color = options.color || config.color;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * config.spread;
      const speed = Math.random() * 2 + 1;

      this.particles.push({
        x: options.x,
        y: options.y,
        vx: Math.cos(angle) * speed * (config.speedRange.max - config.speedRange.min) / 2,
        vy: Math.sin(angle) * speed * (config.speedRange.max - config.speedRange.min) / 2 - 2,
        life: config.life,
        maxLife: config.life,
        size: Math.random() * (config.sizeRange.max - config.sizeRange.min) + config.sizeRange.min,
        opacity: 1,
        color: color,
      });
    }

    // Start animation if not already running
    if (!this.animationFrame) {
      this.animate();
    }
  }

  private animate = () => {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    this.particles = this.particles.filter((particle) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Apply gravity
      const config = this.getParticleConfig(particle);
      particle.vy += config.gravity;

      // Air resistance
      particle.vx *= 0.98;
      particle.vy *= 0.98;

      // Update life
      particle.life--;
      particle.opacity = particle.life / particle.maxLife;

      // Draw particle
      if (particle.life > 0 && particle.opacity > 0) {
        this.ctx.fillStyle = `${particle.color}, ${particle.opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        return true;
      }

      return false;
    });

    // Continue animation if there are particles left
    if (this.particles.length > 0) {
      this.animationFrame = requestAnimationFrame(this.animate);
    } else {
      this.animationFrame = null;
    }
  };

  private getParticleConfig(particle: Particle) {
    // Determine particle type based on color
    if (particle.color.includes('255, 255, 255')) return PARTICLE_CONFIGS.chalk;
    if (particle.color.includes('210, 180, 140')) return PARTICLE_CONFIGS.dust;
    return PARTICLE_CONFIGS.snow;
  }

  /**
   * Emit a burst celebration (for completing all habits or achieving streaks)
   */
  burst(options: Omit<ParticleSystemOptions, 'count'>) {
    const config = PARTICLE_CONFIGS[options.type];
    this.emit({ ...options, count: config.count * 2 });
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    window.removeEventListener('resize', () => this.resize());
    this.particles = [];
  }

  /**
   * Clear all particles immediately
   */
  clear() {
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

/**
 * React hook for using particle system
 */
export function useParticleSystem(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const systemRef = React.useRef<ParticleSystem | null>(null);

  React.useEffect(() => {
    if (canvasRef.current && !systemRef.current) {
      systemRef.current = new ParticleSystem(canvasRef.current);
    }

    return () => {
      if (systemRef.current) {
        systemRef.current.destroy();
        systemRef.current = null;
      }
    };
  }, [canvasRef]);

  return systemRef.current;
}
