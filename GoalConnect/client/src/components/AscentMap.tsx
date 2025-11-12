import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { getClimbingRank } from "@/lib/climbingRanks";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Goal, Todo } from "@shared/schema";

// Milestone definitions for the climbing journey
const MILESTONES = [
  { level: 10, name: "Base Camp", emoji: "🏕️", position: 85 },
  { level: 25, name: "Camp I", emoji: "⛺", position: 65 },
  { level: 50, name: "Camp II (High Camp)", emoji: "🏔️", position: 45 },
  { level: 75, name: "Camp III (Summit Approach)", emoji: "🧗", position: 25 },
  { level: 100, name: "Summit", emoji: "🚩", position: 5 },
] as const;

interface ClimbingStats {
  climbingLevel: number;
  totalExperience: number;
  summitsReached: number;
  milestoneAchievements?: Array<{
    level: number;
    achievedAt: string;
  }>;
}

interface AbandonedGoal extends Goal {
  lastUpdateDate: string | null;
  daysSinceUpdate: number;
}

interface AbandonedGear {
  id: number;
  type: 'goal' | 'todo' | 'habit';
  title: string;
  level: number;
  abandonedDate: string;
  icon: string;
  position: { x: number; y: number };
  difficulty?: string;
}

export function AscentMap() {
  const [selectedMilestone, setSelectedMilestone] = useState<typeof MILESTONES[number] | null>(null);
  const [selectedGear, setSelectedGear] = useState<AbandonedGear | null>(null);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);

  const { data: climbingStats, isLoading } = useQuery<ClimbingStats>({
    queryKey: ["/api/climbing/stats"],
  });

  // Fetch abandoned goals
  const { data: abandonedGoals = [] } = useQuery<AbandonedGoal[]>({
    queryKey: ["/api/goals/abandoned"],
  });

  // Fetch abandoned todos
  const { data: abandonedTodos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos/abandoned"],
  });

  const reactivateMutation = useMutation({
    mutationFn: async (gear: AbandonedGear) => {
      if (gear.type === 'goal') {
        return apiRequest(`/api/goals/${gear.id}/reactivate`, "POST");
      } else if (gear.type === 'todo') {
        return apiRequest(`/api/todos/${gear.id}`, "PATCH", { completed: false });
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals/abandoned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos/abandoned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setReactivateDialogOpen(false);
      setSelectedGear(null);
    },
  });

  if (isLoading || !climbingStats) {
    return (
      <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-3xl p-8 text-center relative overflow-hidden topo-pattern shadow-lg animate-pulse">
        <div className="h-6 bg-white/10 rounded w-48 mx-auto mb-4" />
        <div className="h-[450px] bg-white/10 rounded-2xl" />
      </div>
    );
  }

  const currentLevel = climbingStats.climbingLevel;
  const climbingRank = getClimbingRank(currentLevel);

  // Calculate climber position (0-100, where 100 is bottom, 0 is top)
  const climberPosition = Math.max(5, 95 - (currentLevel * 0.9));

  // Check which milestones are reached
  const reachedMilestones = MILESTONES.filter(m => currentLevel >= m.level);
  const nextMilestone = MILESTONES.find(m => currentLevel < m.level);

  // Convert abandoned items to gear objects
  const abandonedGearItems: AbandonedGear[] = [
    ...abandonedGoals.map((goal, index) => ({
      id: goal.id,
      type: 'goal' as const,
      title: goal.title,
      level: getLevelFromDifficulty(goal.difficulty || 'medium'),
      abandonedDate: goal.lastUpdateDate || 'Unknown',
      icon: '🎒',
      difficulty: goal.difficulty,
      position: calculateGearPosition(index, abandonedGoals.length + abandonedTodos.length, getLevelFromDifficulty(goal.difficulty || 'medium')),
    })),
    ...abandonedTodos.map((todo, index) => ({
      id: todo.id,
      type: 'todo' as const,
      title: todo.title,
      level: getLevelFromDifficulty(todo.difficulty || 'medium'),
      abandonedDate: todo.createdAt?.toString() || 'Unknown',
      icon: '⛏️',
      difficulty: todo.difficulty,
      position: calculateGearPosition(index + abandonedGoals.length, abandonedGoals.length + abandonedTodos.length, getLevelFromDifficulty(todo.difficulty || 'medium')),
    })),
  ];

  const handleGearClick = (gear: AbandonedGear) => {
    setSelectedGear(gear);
    setReactivateDialogOpen(true);
  };

  const handleReactivate = () => {
    if (selectedGear) {
      reactivateMutation.mutate(selectedGear);
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-3xl p-6 relative overflow-hidden topo-pattern shadow-lg">
      {/* Header */}
      <div className="mb-4 text-center relative z-10">
        <h3
          className="text-xl font-bold bg-gradient-to-r from-slate-200 via-cyan-200 to-slate-300 bg-clip-text text-transparent mb-2"
          style={{ fontFamily: "'Comfortaa', cursive" }}
        >
          Your Ascent Progress
        </h3>
        <p className="text-sm text-white/70">
          Level {currentLevel} • {climbingRank.grade} {climbingRank.name}
        </p>
        {nextMilestone && (
          <p className="text-xs text-cyan-300 mt-1">
            Next: {nextMilestone.name} at Level {nextMilestone.level}
          </p>
        )}
      </div>

      {/* Mountain SVG Container */}
      <div className="relative h-[450px] w-full">
        <svg
          viewBox="0 0 300 500"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))' }}
        >
          {/* Background gradient sky */}
          <defs>
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#2d5a7b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#374151" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#cbd5e1" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#64748b" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.6" />
            </linearGradient>

            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Sky background */}
          <rect width="300" height="500" fill="url(#skyGradient)" />

          {/* Mountain silhouette - stylized triangular peaks */}
          <g>
            {/* Main peak */}
            <path
              d="M 150 30 L 250 450 L 50 450 Z"
              fill="url(#mountainGradient)"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
            />

            {/* Left smaller peak */}
            <path
              d="M 80 200 L 150 450 L 10 450 Z"
              fill="rgba(100, 116, 139, 0.5)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />

            {/* Right smaller peak */}
            <path
              d="M 220 180 L 290 450 L 150 450 Z"
              fill="rgba(100, 116, 139, 0.5)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />

            {/* Snow caps */}
            <path
              d="M 150 30 L 170 80 L 150 75 L 130 80 Z"
              fill="rgba(255, 255, 255, 0.9)"
              className="drop-shadow-lg"
            />
          </g>

          {/* Climbing path - winding route up the mountain */}
          <path
            d="M 150 460
               Q 180 420, 170 380
               Q 160 340, 180 300
               Q 200 260, 170 220
               Q 140 180, 155 140
               Q 170 100, 150 60"
            stroke="url(#pathGradient)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="8,4"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Milestones */}
          {MILESTONES.map((milestone, index) => {
            const isReached = currentLevel >= milestone.level;
            const yPos = (milestone.position / 100) * 500;

            // Calculate x position along the path
            let xPos = 150;
            if (milestone.position > 80) xPos = 170;
            else if (milestone.position > 60) xPos = 180;
            else if (milestone.position > 40) xPos = 170;
            else if (milestone.position > 20) xPos = 155;
            else xPos = 150;

            return (
              <g
                key={milestone.level}
                className="cursor-pointer transition-all duration-300"
                onClick={() => setSelectedMilestone(milestone)}
                onMouseEnter={() => setSelectedMilestone(milestone)}
                onMouseLeave={() => setSelectedMilestone(null)}
              >
                {/* Milestone marker */}
                <circle
                  cx={xPos}
                  cy={yPos}
                  r="12"
                  fill={isReached ? "rgba(6, 182, 212, 0.8)" : "rgba(100, 116, 139, 0.5)"}
                  stroke={isReached ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.3)"}
                  strokeWidth="2"
                  className={isReached ? "animate-pulse" : ""}
                />

                {/* Milestone icon */}
                <text
                  x={xPos}
                  y={yPos + 5}
                  textAnchor="middle"
                  fontSize="12"
                  className="select-none"
                >
                  {isReached ? milestone.emoji : "⚪"}
                </text>

                {/* Milestone label */}
                <text
                  x={xPos + 25}
                  y={yPos + 5}
                  fontSize="10"
                  fill="rgba(255, 255, 255, 0.9)"
                  className="font-semibold select-none"
                  style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)' }}
                >
                  {milestone.name}
                </text>

                {/* Glow effect for reached milestones */}
                {isReached && (
                  <circle
                    cx={xPos}
                    cy={yPos}
                    r="18"
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.4)"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )}
              </g>
            );
          })}

          {/* Climber avatar - animated position */}
          <g
            className="transition-all duration-1000 ease-out"
            style={{
              transform: `translate(0, ${(climberPosition / 100) * 500}px)`
            }}
          >
            {/* Climber base position calculation */}
            <g transform="translate(150, 0)">
              {/* Glow around climber */}
              <circle
                cx="0"
                cy="0"
                r="20"
                fill="rgba(251, 191, 36, 0.3)"
                className="animate-pulse"
              />

              {/* Climber emoji */}
              <text
                x="0"
                y="6"
                textAnchor="middle"
                fontSize="24"
                className="select-none"
                style={{ filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5))' }}
              >
                🧗
              </text>
            </g>
          </g>

          {/* Abandoned Gear Items */}
          {abandonedGearItems.map((gear) => {
            const yPos = (gear.position.y / 100) * 500;
            const xPos = gear.position.x * 3; // Scale to SVG viewBox width of 300

            return (
              <g
                key={`${gear.type}-${gear.id}`}
                className="cursor-pointer transition-all duration-300 hover:opacity-100"
                onClick={() => handleGearClick(gear)}
                style={{ opacity: 0.6 }}
              >
                {/* Pulse effect */}
                <circle
                  cx={xPos}
                  cy={yPos}
                  r="15"
                  fill="rgba(59, 130, 246, 0.2)"
                  className="animate-ping"
                />

                {/* Glow background */}
                <circle
                  cx={xPos}
                  cy={yPos}
                  r="18"
                  fill="rgba(59, 130, 246, 0.3)"
                  filter="blur(4px)"
                />

                {/* Gear icon */}
                <text
                  x={xPos}
                  y={yPos + 8}
                  textAnchor="middle"
                  fontSize="20"
                  className="select-none"
                  style={{
                    filter: 'drop-shadow(0 2px 8px rgba(59, 130, 246, 0.8))',
                    cursor: 'pointer'
                  }}
                >
                  {gear.icon}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Milestone tooltip */}
        {selectedMilestone && (
          <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-4 border-2 border-cyan-400/30 shadow-xl z-20 max-w-[200px]">
            <div className="text-center">
              <div className="text-3xl mb-2">{selectedMilestone.emoji}</div>
              <h4 className="font-bold text-white mb-1 text-sm">
                {selectedMilestone.name}
              </h4>
              <p className="text-xs text-white/70">
                Level {selectedMilestone.level}
              </p>
              {currentLevel >= selectedMilestone.level ? (
                <div className="mt-2 px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full">
                  <p className="text-xs text-green-300 font-semibold">
                    Reached!
                  </p>
                </div>
              ) : (
                <div className="mt-2 px-3 py-1 bg-slate-700/30 border border-slate-500/40 rounded-full">
                  <p className="text-xs text-slate-300">
                    {selectedMilestone.level - currentLevel} levels to go
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress stats */}
      <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-white/70 mb-1">Current</div>
            <div className="text-lg font-bold text-cyan-300">L{currentLevel}</div>
          </div>
          <div>
            <div className="text-xs text-white/70 mb-1">Reached</div>
            <div className="text-lg font-bold text-green-300">
              {reachedMilestones.length}/{MILESTONES.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-white/70 mb-1">Progress</div>
            <div className="text-lg font-bold text-white">
              {Math.min(100, currentLevel)}%
            </div>
          </div>
        </div>

        {/* Abandoned gear count */}
        {abandonedGearItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-xs text-amber-400/70 mb-1 text-center">Abandoned Gear</div>
            <div className="flex gap-4 justify-center text-xs">
              <div className="flex items-center gap-1">
                <span className="text-lg">🎒</span>
                <span className="text-white/70">{abandonedGoals.length} goals</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">⛏️</span>
                <span className="text-white/70">{abandonedTodos.length} tasks</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reactivate Dialog */}
      <Dialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <DialogContent className="bg-slate-900/95 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Pick Up This Gear?</DialogTitle>
            <DialogDescription className="text-slate-300">
              Reactivate this abandoned {selectedGear?.type} and continue your journey
            </DialogDescription>
          </DialogHeader>

          {selectedGear && (
            <div className="space-y-4 py-4">
              <div className="text-center text-6xl">{selectedGear.icon}</div>
              <div>
                <div className="font-bold text-xl mb-2">{selectedGear.title}</div>
                <div className="text-sm text-slate-400 space-y-1">
                  <div>Type: {selectedGear.type === 'goal' ? 'Goal' : 'Task'}</div>
                  {selectedGear.difficulty && (
                    <div className="capitalize">Difficulty: {selectedGear.difficulty}</div>
                  )}
                  <div>Abandoned: {formatAbandonedDate(selectedGear.abandonedDate)}</div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  Reactivating this {selectedGear.type} will move it back to your active list.
                  You can continue making progress where you left off.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReactivateDialogOpen(false)}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Leave It
            </Button>
            <Button
              onClick={handleReactivate}
              disabled={reactivateMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              {reactivateMutation.isPending ? 'Reactivating...' : 'Pick Up & Restart'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Functions

function getLevelFromDifficulty(difficulty: string): number {
  const difficultyLevels: Record<string, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
  };
  return difficultyLevels[difficulty] || 2;
}

function calculateGearPosition(index: number, total: number, level: number): { x: number; y: number } {
  // Distribute items along the mountain path based on their level (difficulty)
  // Level 1 (easy) = lower on mountain (70-85% down)
  // Level 2 (medium) = middle (40-60% down)
  // Level 3 (hard) = higher (20-35% down)

  const baseY: Record<number, number> = {
    1: 75,  // Easy - lower on mountain
    2: 50,  // Medium - middle
    3: 30,  // Hard - higher up
  };

  const yVariation = 10; // Random variation
  const y = (baseY[level] || 50) + (Math.random() * yVariation - yVariation / 2);

  // Distribute x positions along the path, avoiding edges
  // SVG viewBox is 300 wide, so we use 10-90 range (30-270 in SVG units, divided by 3 for percentage)
  const xMin = 10;
  const xMax = 90;
  const xRange = xMax - xMin;
  const x = xMin + (xRange / (total + 1)) * (index + 1);

  return { x, y };
}

function formatAbandonedDate(dateString: string): string {
  if (!dateString || dateString === 'Unknown') return 'Unknown';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  } catch (error) {
    return dateString;
  }
}
