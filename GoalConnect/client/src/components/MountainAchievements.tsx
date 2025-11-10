import { Trophy, Mountain, Flame, Target, Tent, Flag, Award, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface MountainAchievementsProps {
  habits: any[];
  goals: any[];
  totalHabits: number;
  completedHabits: number;
  longestStreak: number;
  activeGoals: any[];
}

export function MountainAchievements({
  habits,
  goals,
  totalHabits,
  completedHabits,
  longestStreak,
  activeGoals,
}: MountainAchievementsProps) {
  // Define achievements based on user progress
  const achievements: Achievement[] = [
    {
      id: "first-pitch",
      name: "First Pitch",
      description: "Complete your first habit",
      icon: <Mountain className="w-6 h-6" />,
      unlocked: habits.length > 0,
      rarity: "common",
    },
    {
      id: "week-warrior",
      name: "Week Warrior",
      description: "7-day climbing streak",
      icon: <Flame className="w-6 h-6" />,
      unlocked: longestStreak >= 7,
      progress: Math.min(longestStreak, 7),
      maxProgress: 7,
      rarity: "rare",
    },
    {
      id: "month-master",
      name: "Month Master",
      description: "30-day climbing streak",
      icon: <Flame className="w-6 h-6" />,
      unlocked: longestStreak >= 30,
      progress: Math.min(longestStreak, 30),
      maxProgress: 30,
      rarity: "epic",
    },
    {
      id: "base-camp",
      name: "Base Camp Established",
      description: "Create 3 or more habits",
      icon: <Tent className="w-6 h-6" />,
      unlocked: habits.length >= 3,
      progress: Math.min(habits.length, 3),
      maxProgress: 3,
      rarity: "common",
    },
    {
      id: "summit-seeker",
      name: "Summit Seeker",
      description: "Set 5 goals",
      icon: <Target className="w-6 h-6" />,
      unlocked: goals.length >= 5,
      progress: Math.min(goals.length, 5),
      maxProgress: 5,
      rarity: "rare",
    },
    {
      id: "perfect-day",
      name: "Perfect Day",
      description: "Complete all habits in one day",
      icon: <Flag className="w-6 h-6" />,
      unlocked: totalHabits > 0 && completedHabits === totalHabits,
      rarity: "epic",
    },
    {
      id: "expedition-leader",
      name: "Expedition Leader",
      description: "Complete 10 goals",
      icon: <Trophy className="w-6 h-6" />,
      unlocked: goals.filter(g => (g.currentValue / g.targetValue) >= 1).length >= 10,
      rarity: "legendary",
    },
  ];

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const nextAchievement = achievements.find(a => !a.unlocked && a.progress !== undefined);

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common":
        return "from-gray-500/20 to-gray-500/5 border-gray-500/30";
      case "rare":
        return "from-blue-500/20 to-blue-500/5 border-blue-500/30";
      case "epic":
        return "from-purple-500/20 to-purple-500/5 border-purple-500/30";
      case "legendary":
        return "from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 border-[hsl(var(--accent))]/30";
    }
  };

  const getRarityTextColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common":
        return "text-gray-400";
      case "rare":
        return "text-blue-400";
      case "epic":
        return "text-purple-400";
      case "legendary":
        return "text-[hsl(var(--accent))]";
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--accent))]/20 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-[hsl(var(--accent))]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Summit Badges</h3>
          <p className="text-xs text-muted-foreground">
            {unlockedAchievements.length}/{achievements.length} unlocked
          </p>
        </div>
      </div>

      {/* Next Achievement Progress */}
      {nextAchievement && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("text-primary", getRarityTextColor(nextAchievement.rarity))}>
              {nextAchievement.icon}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">{nextAchievement.name}</div>
              <div className="text-xs text-muted-foreground">{nextAchievement.description}</div>
            </div>
          </div>
          {nextAchievement.progress !== undefined && nextAchievement.maxProgress && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span className="font-bold">{nextAchievement.progress}/{nextAchievement.maxProgress}</span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-[hsl(var(--accent))] transition-all duration-500"
                  style={{ width: `${(nextAchievement.progress / nextAchievement.maxProgress) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievement Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {achievements.slice(0, 8).map((achievement) => (
          <div
            key={achievement.id}
            className={cn(
              "p-3 rounded-xl border transition-all",
              achievement.unlocked
                ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)} hover:scale-105`
                : "bg-muted/10 border-border/30 opacity-40"
            )}
          >
            <div
              className={cn(
                "mb-2 flex items-center justify-center",
                achievement.unlocked ? getRarityTextColor(achievement.rarity) : "text-muted-foreground"
              )}
            >
              {achievement.icon}
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-foreground truncate">
                {achievement.name}
              </div>
              {achievement.unlocked && (
                <div className="text-xs text-[hsl(var(--accent))] mt-1">
                  <Star className="w-3 h-3 inline fill-current" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
