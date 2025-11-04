import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { HabitLog } from "@shared/schema";

export interface Milestone {
  id: string;
  type: "streak" | "completion" | "perfect_week" | "perfect_month";
  value: number;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const STREAK_MILESTONES = [
  { value: 7, title: "Week Warrior", description: "7 day streak achieved!", icon: "🔥" },
  { value: 14, title: "Two Week Titan", description: "14 day streak achieved!", icon: "💪" },
  { value: 30, title: "Month Master", description: "30 day streak achieved!", icon: "🏆" },
  { value: 60, title: "Two Month Legend", description: "60 day streak achieved!", icon: "⭐" },
  { value: 90, title: "Quarter Champion", description: "90 day streak achieved!", icon: "👑" },
  { value: 180, title: "Half Year Hero", description: "180 day streak achieved!", icon: "💎" },
  { value: 365, title: "Year of Excellence", description: "365 day streak achieved!", icon: "🌟" },
];

const COMPLETION_MILESTONES = [
  { value: 50, title: "Getting Started", description: "50 total completions!", icon: "🎯" },
  { value: 100, title: "Century Club", description: "100 total completions!", icon: "💯" },
  { value: 250, title: "Quarter Thousand", description: "250 total completions!", icon: "✨" },
  { value: 500, title: "Half Grand", description: "500 total completions!", icon: "💎" },
  { value: 1000, title: "Millennium Master", description: "1000 total completions!", icon: "🏆" },
];

export function useMilestones(currentStreak: number, totalCompletions: number) {
  const [newlyUnlocked, setNewlyUnlocked] = useState<Milestone | null>(null);
  const [previousStreak, setPreviousStreak] = useState(0);
  const [previousCompletions, setPreviousCompletions] = useState(0);

  useEffect(() => {
    // Check for newly unlocked streak milestones
    if (currentStreak > previousStreak) {
      const milestone = STREAK_MILESTONES.find(m => m.value === currentStreak);
      if (milestone) {
        setNewlyUnlocked({
          id: `streak-${milestone.value}`,
          type: "streak",
          value: milestone.value,
          title: milestone.title,
          description: milestone.description,
          icon: milestone.icon,
          unlocked: true,
        });
      }
      setPreviousStreak(currentStreak);
    }
  }, [currentStreak, previousStreak]);

  useEffect(() => {
    // Check for newly unlocked completion milestones
    if (totalCompletions > previousCompletions) {
      const milestone = COMPLETION_MILESTONES.find(m => m.value === totalCompletions);
      if (milestone) {
        setNewlyUnlocked({
          id: `completion-${milestone.value}`,
          type: "completion",
          value: milestone.value,
          title: milestone.title,
          description: milestone.description,
          icon: milestone.icon,
          unlocked: true,
        });
      }
      setPreviousCompletions(totalCompletions);
    }
  }, [totalCompletions, previousCompletions]);

  const allMilestones: Milestone[] = [
    ...STREAK_MILESTONES.map(m => ({
      id: `streak-${m.value}`,
      type: "streak" as const,
      value: m.value,
      title: m.title,
      description: m.description,
      icon: m.icon,
      unlocked: currentStreak >= m.value,
    })),
    ...COMPLETION_MILESTONES.map(m => ({
      id: `completion-${m.value}`,
      type: "completion" as const,
      value: m.value,
      title: m.title,
      description: m.description,
      icon: m.icon,
      unlocked: totalCompletions >= m.value,
    })),
  ];

  const unlockedMilestones = allMilestones.filter(m => m.unlocked);
  const nextMilestone = allMilestones.find(m => !m.unlocked);

  return {
    newlyUnlocked,
    setNewlyUnlocked,
    allMilestones,
    unlockedMilestones,
    nextMilestone,
  };
}
