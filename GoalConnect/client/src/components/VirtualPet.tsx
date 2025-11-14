import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Gem } from "lucide-react";
import type { VirtualPet as VirtualPetType, UserCostume, Costume, UserPoints } from "@shared/schema";
import { useState, useEffect } from "react";
import catImage from "@assets/3d ish crumpet.png";
import { getClimbingRank } from "@/lib/climbingRanks";

// Evolution configurations
const EVOLUTION_CONFIG = {
  seed: {
    size: 180,
    primaryColor: '#a855f7',
    secondaryColor: '#ec4899',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    name: 'Tiny Seed',
    description: 'Just starting out! 🌱',
  },
  sprout: {
    size: 210,
    primaryColor: '#ec4899',
    secondaryColor: '#f59e0b',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    name: 'Young Sprout',
    description: 'Growing strong! 🌿',
  },
  sapling: {
    size: 240,
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    name: 'Healthy Sapling',
    description: 'Thriving beautifully! 🌳',
  },
  tree: {
    size: 270,
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    name: 'Majestic Tree',
    description: 'So impressive! 🌲',
  },
  ancient: {
    size: 300,
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
    glowColor: 'rgba(245, 158, 11, 0.8)',
    name: 'Ancient Guardian',
    description: 'Legendary! ✨',
  },
};

function PetAvatar({ 
  evolution, 
  size, 
  equippedCostumes = []
}: { 
  evolution: keyof typeof EVOLUTION_CONFIG; 
  size: number;
  equippedCostumes?: Array<UserCostume & { costume: Costume }>;
}) {
  const config = EVOLUTION_CONFIG[evolution];

  return (
    <div
      className="relative mx-auto float-animation"
      style={{ width: size, height: size }}
    >
      <img 
        src={catImage} 
        alt="Your virtual pet cat" 
        className="w-full h-full object-contain drop-shadow-2xl relative z-10"
        style={{ filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.3))' }}
      />

      {equippedCostumes?.map((uc) => (
        <img
          key={uc.id}
          src={uc.costume.imageUrl}
          alt={uc.costume.name}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
          style={{
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
          }}
        />
      ))}

      {/* Glow effect around pet */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-30 -z-10"
        style={{ background: config.glowColor }}
      />
    </div>
  );
}

export function VirtualPet() {
  const [isBouncing, setIsBouncing] = useState(false);

  const { data: pet, isLoading } = useQuery<VirtualPetType>({
    queryKey: ["/api/virtual-pet"],
  });

  const { data: stats } = useQuery<{ currentStreak: number; weeklyCompletion: number }>({
    queryKey: ["/api/stats"],
  });

  const { data: climbingStats } = useQuery<{ climbingLevel: number }>({
    queryKey: ["/api/climbing/stats"],
  });

  const { data: equippedCostumes = [] } = useQuery<Array<UserCostume & { costume: Costume }>>({
    queryKey: ["/api/costumes/equipped"],
  });

  const { data: userPoints } = useQuery<UserPoints>({
    queryKey: ["/api/user-points"],
  });

  // Trigger bounce animation when points change
  useEffect(() => {
    if (userPoints) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [userPoints?.totalEarned]);

  if (isLoading || !pet) {
    return (
      <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-3xl p-8 text-center relative overflow-hidden topo-pattern shadow-lg animate-pulse">
        <div className="w-48 h-48 bg-white/10 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-white/10 rounded w-32 mx-auto mb-2" />
        <div className="h-4 bg-white/10 rounded w-24 mx-auto" />
      </div>
    );
  }

  const config = EVOLUTION_CONFIG[pet.evolution];
  const currentStreak = stats?.currentStreak || 0;
  const availablePoints = userPoints?.available || 0;
  const weeklyCompletion = stats?.weeklyCompletion || 0;
  const climbingLevel = climbingStats?.climbingLevel || 0;
  const climbingRank = getClimbingRank(climbingLevel);

  return (
    <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-3xl p-8 text-center relative overflow-hidden topo-pattern shadow-lg">
      {/* Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-5 left-5 text-xl float-sparkle">✨</span>
        <span className="absolute top-8 right-8 text-xl float-sparkle" style={{animationDelay: '1s'}}>🌟</span>
        <span className="absolute top-5 right-4 text-xl float-sparkle" style={{animationDelay: '0.5s'}}>💫</span>
        <span className="absolute bottom-8 left-6 text-xl float-sparkle" style={{animationDelay: '1.5s'}}>⭐</span>
        <span className="absolute bottom-10 right-9 text-xl float-sparkle" style={{animationDelay: '0.8s'}}>✨</span>
      </div>

      <div className="relative z-10">
        {/* Pet Avatar with evolution and bounce animation */}
        <div className={`mb-6 ${isBouncing ? 'bounce' : ''}`}>
          <PetAvatar evolution={pet.evolution} size={config.size} equippedCostumes={equippedCostumes} />
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

        {/* Climbing Rank Badge */}
        {climbingLevel > 0 && (
          <div className="mb-6">
            <Badge className="rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-slate-600/30 to-slate-700/30 border-2 border-slate-500/40 text-slate-200 backdrop-blur-xl shadow-lg">
              Level {climbingLevel} • {climbingRank.grade} {climbingRank.name}
            </Badge>
          </div>
        )}

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
              <Gem className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{availablePoints}</div>
            <div className="text-xs text-white/80">Tokens</div>
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
