import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";

interface EnergyBarProps {
  currentEnergy: number;
  maxEnergy: number;
  className?: string;
  showLabel?: boolean;
}

export default function EnergyBar({
  currentEnergy,
  maxEnergy,
  className = "",
  showLabel = true
}: EnergyBarProps) {
  const percentage = (currentEnergy / maxEnergy) * 100;

  // Color based on energy level
  const getEnergyColor = () => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Zap className="w-4 h-4 text-yellow-500" fill="currentColor" />
      {showLabel && (
        <span className="text-sm font-medium min-w-[80px]">
          {currentEnergy} / {maxEnergy}
        </span>
      )}
      <div className="flex-1 min-w-[100px]">
        <Progress
          value={percentage}
          className="h-2"
          indicatorClassName={getEnergyColor()}
        />
      </div>
    </div>
  );
}
