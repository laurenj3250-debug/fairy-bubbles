import { cn } from "@/lib/utils";

interface ProgressRingProps {
  percent: number;
  goal: number;
  current: number;
  ahead: number;
  unit?: string;
  color?: "cyan" | "purple" | "orange";
}

export function ProgressRing({ percent, goal, current, ahead, unit = "mi", color = "cyan" }: ProgressRingProps) {
  const colors = {
    cyan: { stroke: "#06b6d4", text: "text-cyan-400", shadow: "rgba(6, 182, 212, 0.4)" },
    purple: { stroke: "#a855f7", text: "text-purple-400", shadow: "rgba(168, 85, 247, 0.4)" },
    orange: { stroke: "#f97316", text: "text-orange-400", shadow: "rgba(249, 115, 22, 0.4)" },
  };
  const c = colors[color];

  return (
    <div className="col-span-2 glass-card rounded-2xl p-4 flex gap-4 bg-card/70 backdrop-blur-xl">
      <div className="w-[90px] h-[90px] relative flex-shrink-0" style={{ filter: `drop-shadow(0 0 12px ${c.shadow})` }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={c.stroke} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${percent * 2.51} 251`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn("text-xl font-semibold", c.text)} style={{ textShadow: `0 0 15px ${c.shadow}` }}>{percent}%</div>
          <div className="text-[8px] text-muted-foreground">of {goal >= 1000 ? `${(goal / 1000).toFixed(0)}k` : goal} {unit}</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Current</span><span className="font-medium">{current.toLocaleString()}</span></div>
        <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Goal</span><span className="font-medium">{goal.toLocaleString()}</span></div>
        {ahead > 0 && <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Ahead</span><span className="font-medium text-emerald-400">+{ahead}</span></div>}
      </div>
    </div>
  );
}
