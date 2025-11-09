// Climbing grade system with levels
export const CLIMBING_RANKS = [
  { grade: "5.5", name: "Belay Potato", description: "Just showed up. Still figuring out which end of the rope is up.", minLevel: 0, maxLevel: 4 },
  { grade: "5.6", name: "Gym Day-Pass Holder", description: "Has chalk. Zero business being this pumped.", minLevel: 5, maxLevel: 9 },
  { grade: "5.7", name: "Top-Rope Goblin", description: "The \"oh she's at a 5.7 wah wah\" tier.", minLevel: 10, maxLevel: 14 },
  { grade: "5.8", name: "Clip Slightly Too High", description: "Loves sketchy clips and overgripping jugs.", minLevel: 15, maxLevel: 19 },
  { grade: "5.9", name: "Crux Panicker", description: "Hangs at every bolt but logs the send anyway.", minLevel: 20, maxLevel: 29 },
  { grade: "5.10", name: "Project Goblin", description: "Lives in the 5.10+ graveyard of eternally projecting.", minLevel: 30, maxLevel: 39 },
  { grade: "5.11", name: "Try-Hard Royalty", description: "Screaming on every move but low-key strong.", minLevel: 40, maxLevel: 54 },
  { grade: "5.12", name: "Crimp Gremlin", description: "Finger tendons are one argument away from resigning.", minLevel: 55, maxLevel: 69 },
  { grade: "5.13", name: "Local Crusher", description: "Other people watch your attempts now.", minLevel: 70, maxLevel: 84 },
  { grade: "5.14", name: "Alex-ish Honnold", description: "Alarmingly comfortable in stupid positions.", minLevel: 85, maxLevel: 99 },
  { grade: "5.15", name: "Who Let You Up Here", description: "Peak goblin. Stats purely for vibes now.", minLevel: 100, maxLevel: 999 },
] as const;

export function getClimbingRank(level: number) {
  const rank = CLIMBING_RANKS.find(r => level >= r.minLevel && level <= r.maxLevel);
  return rank || CLIMBING_RANKS[0];
}

export function getNextRank(level: number) {
  const currentRank = getClimbingRank(level);
  const currentIndex = CLIMBING_RANKS.findIndex(r => r.grade === currentRank.grade);
  return CLIMBING_RANKS[currentIndex + 1] || null;
}

// Difficulty grades for tasks/todos
export const TASK_GRADES = [
  { value: "easy", label: "5.6", points: 5, color: "bg-green-500/20 text-green-300" },
  { value: "medium", label: "5.9", points: 10, color: "bg-blue-500/20 text-blue-300" },
  { value: "hard", label: "5.12", points: 15, color: "bg-red-500/20 text-red-300" },
] as const;

export function getTaskGrade(difficulty: string) {
  return TASK_GRADES.find(g => g.value === difficulty) || TASK_GRADES[1];
}
