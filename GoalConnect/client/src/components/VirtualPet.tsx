import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";
import type { VirtualPet as VirtualPetType } from "@shared/schema";

// Evolution configurations
const EVOLUTION_CONFIG = {
  seed: {
    size: 120,
    primaryColor: '#a855f7',
    secondaryColor: '#ec4899',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    name: 'Tiny Seed',
    description: 'Just starting out! 🌱',
  },
  sprout: {
    size: 140,
    primaryColor: '#ec4899',
    secondaryColor: '#f59e0b',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    name: 'Young Sprout',
    description: 'Growing strong! 🌿',
  },
  sapling: {
    size: 160,
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    name: 'Healthy Sapling',
    description: 'Thriving beautifully! 🌳',
  },
  tree: {
    size: 180,
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    name: 'Majestic Tree',
    description: 'So impressive! 🌲',
  },
  ancient: {
    size: 200,
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
    glowColor: 'rgba(245, 158, 11, 0.8)',
    name: 'Ancient Guardian',
    description: 'Legendary! ✨',
  },
};

function PetAvatar({ evolution, size }: { evolution: keyof typeof EVOLUTION_CONFIG; size: number }) {
  const config = EVOLUTION_CONFIG[evolution];

  return (
    <div
      className="relative mx-auto float-animation"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={`bodyGradient-${evolution}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: config.primaryColor, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: config.secondaryColor, stopOpacity: 1 }} />
          </linearGradient>
          <filter id={`glow-${evolution}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Main Body - size scales with evolution */}
        <circle
          cx="100"
          cy="100"
          r={evolution === 'seed' ? 40 : evolution === 'sprout' ? 50 : evolution === 'sapling' ? 55 : evolution === 'tree' ? 58 : 60}
          fill={`url(#bodyGradient-${evolution})`}
          filter={`url(#glow-${evolution})`}
        />

        {/* Fairy Wings - appear after seed stage */}
        {evolution !== 'seed' && (
          <>
            <ellipse cx="60" cy="80" rx="30" ry="45" fill="#a7f3d0" opacity="0.7" transform="rotate(-20 60 80)">
              <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="140" cy="80" rx="30" ry="45" fill="#a7f3d0" opacity="0.7" transform="rotate(20 140 80)">
              <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" begin="0.5s"/>
            </ellipse>
          </>
        )}

        {/* Eyes */}
        <circle cx="85" cy="90" r="10" fill="white"/>
        <circle cx="115" cy="90" r="10" fill="white"/>
        <circle cx="87" cy="92" r="6" fill="#2d3748"/>
        <circle cx="117" cy="92" r="6" fill="#2d3748"/>
        <circle cx="89" cy="90" r="3" fill="white"/>
        <circle cx="119" cy="90" r="3" fill="white"/>

        {/* Nose */}
        <circle cx="100" cy="105" r="5" fill="#fbbf24"/>

        {/* Smile */}
        <path
          d="M 85 115 Q 100 130 115 115"
          stroke="#2d3748"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Ears - grow with evolution */}
        <circle cx="70" cy="60" r={evolution === 'seed' ? 10 : 15} fill={`url(#bodyGradient-${evolution})`}/>
        <circle cx="130" cy="60" r={evolution === 'seed' ? 10 : 15} fill={`url(#bodyGradient-${evolution})`}/>
        <circle cx="70" cy="62" r={evolution === 'seed' ? 5 : 8} fill="#fbbf24"/>
        <circle cx="130" cy="62" r={evolution === 'seed' ? 5 : 8} fill="#fbbf24"/>

        {/* Magical antenna - gets more prominent */}
        {evolution !== 'seed' && (
          <>
            <line x1="100" y1="40" x2="100" y2="20" stroke="#a7f3d0" strokeWidth="2"/>
            <circle cx="100" cy="20" r={evolution === 'ancient' ? 7 : 5} fill="#fbbf24">
              <animate attributeName="r" values={`${evolution === 'ancient' ? '7;9;7' : '5;7;5'}`} dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </>
        )}

        {/* Rosy cheeks */}
        <circle cx="70" cy="110" r="10" fill="#fca5a5" opacity="0.5"/>
        <circle cx="130" cy="110" r="10" fill="#fca5a5" opacity="0.5"/>
      </svg>

      {/* Glow effect around pet */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-30 -z-10"
        style={{ background: config.glowColor }}
      />
    </div>
  );
}

export function VirtualPet() {
  const { data: pet, isLoading } = useQuery<VirtualPetType>({
    queryKey: ["/api/pet"],
  });

  const { data: stats } = useQuery<{ currentStreak: number; weeklyCompletion: number }>({
    queryKey: ["/api/stats"],
  });

  if (isLoading || !pet) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center relative overflow-hidden magical-glow animate-pulse">
        <div className="w-48 h-48 bg-white/10 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-white/10 rounded w-32 mx-auto mb-2" />
        <div className="h-4 bg-white/10 rounded w-24 mx-auto" />
      </div>
    );
  }

  const config = EVOLUTION_CONFIG[pet.evolution];
  const currentStreak = stats?.currentStreak || 0;
  const weeklyCompletion = stats?.weeklyCompletion || Math.round(pet.happiness);

  return (
    <div className="glass-card rounded-3xl p-8 text-center relative overflow-hidden magical-glow">
      {/* Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-5 left-5 text-xl float-sparkle">✨</span>
        <span className="absolute top-8 right-8 text-xl float-sparkle" style={{animationDelay: '1s'}}>🌟</span>
        <span className="absolute top-5 right-4 text-xl float-sparkle" style={{animationDelay: '0.5s'}}>💫</span>
        <span className="absolute bottom-8 left-6 text-xl float-sparkle" style={{animationDelay: '1.5s'}}>⭐</span>
        <span className="absolute bottom-10 right-9 text-xl float-sparkle" style={{animationDelay: '0.8s'}}>✨</span>
      </div>

      <div className="relative z-10">
        {/* Pet Avatar with evolution */}
        <div className="mb-6">
          <PetAvatar evolution={pet.evolution} size={config.size} />
        </div>

        {/* Pet Name & Evolution Stage */}
        <h3
          className="text-xl font-bold bg-gradient-to-r from-green-300 via-emerald-400 to-purple-400 bg-clip-text text-transparent mb-2"
          style={{ fontFamily: "'Comfortaa', cursive" }}
        >
          {pet.name}
        </h3>

        <p className="text-sm text-white/70 mb-3">{config.name} - {config.description}</p>

        {/* Level Badge */}
        <Badge className="rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 text-green-200 backdrop-blur-xl mb-6 shadow-lg">
          Level {pet.level} 🌱
        </Badge>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/20 shadow-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{currentStreak}</div>
            <div className="text-xs text-white/80">Day Streak</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/20 shadow-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl">😊</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{weeklyCompletion}%</div>
            <div className="text-xs text-white/80">Happiness</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/70 mb-2">
            <span>XP</span>
            <span>{pet.experience} / {pet.level * 100}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min((pet.experience / (pet.level * 100)) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
