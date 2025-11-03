import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Flame, Target, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  icon: "trophy" | "flame" | "target" | "star";
  title: string;
  description: string;
  color: string;
}

interface AchievementSpotlightProps {
  achievements: Achievement[];
  autoRotate?: boolean;
  intervalMs?: number;
}

const ICONS = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  star: Star,
};

export function AchievementSpotlight({
  achievements,
  autoRotate = true,
  intervalMs = 5000,
}: AchievementSpotlightProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoRotate || achievements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % achievements.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoRotate, intervalMs, achievements.length]);

  if (achievements.length === 0) return null;

  const current = achievements[currentIndex];
  const Icon = ICONS[current.icon];

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div
          className={cn(
            "flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0 animate-pulse",
            current.color
          )}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base mb-1">{current.title}</h3>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </div>
        {achievements.length > 1 && (
          <div className="flex gap-1.5">
            {achievements.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`View achievement ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
