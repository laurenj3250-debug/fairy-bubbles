import React from 'react';
import { cn } from '@/lib/utils';

interface HabitScoreIndicatorProps {
  score: number;  // 0-1 range
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface ScoreCategory {
  color: string;
  bgColor: string;
  label: string;
}

function getScoreCategory(score: number): ScoreCategory {
  if (score >= 0.75) {
    return {
      color: 'text-green-300',
      bgColor: 'bg-green-500/20 border-green-400/40',
      label: 'Strong'
    };
  } else if (score >= 0.50) {
    return {
      color: 'text-blue-300',
      bgColor: 'bg-blue-500/20 border-blue-400/40',
      label: 'Building'
    };
  } else if (score >= 0.25) {
    return {
      color: 'text-yellow-300',
      bgColor: 'bg-yellow-500/20 border-yellow-400/40',
      label: 'Growing'
    };
  } else {
    return {
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20 border-gray-400/40',
      label: 'Weak'
    };
  }
}

export function HabitScoreIndicator({ score, size = 'md', className }: HabitScoreIndicatorProps) {
  const percentage = Math.round(score * 100);
  const category = getScoreCategory(score);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border transition-all",
        category.bgColor,
        sizeClasses[size],
        className
      )}
      title={`Habit strength: ${percentage}% (${category.label})`}
      data-testid="habit-score-indicator"
    >
      <span className={cn("font-bold tabular-nums", category.color)}>
        {percentage}%
      </span>
      <span className={cn("font-medium opacity-75", category.color)}>
        {category.label}
      </span>
    </div>
  );
}
