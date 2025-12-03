import { cn } from "@/lib/utils";

interface PRItemProps {
  rank: number;
  name: string;
  meta: string;
  value: string;
  isGold?: boolean;
}

export function PRItem({ rank, name, meta, value, isGold }: PRItemProps) {
  return (
    <div
      className={cn("flex items-center gap-2 p-2 rounded-lg border transition-all hover:translate-x-0.5", isGold || rank === 1 ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-amber-500/40 border-2" : "bg-white/[0.02] border-border/30 hover:border-purple-500")}
      style={isGold || rank === 1 ? { boxShadow: "0 0 20px rgba(251, 191, 36, 0.2), inset 0 0 15px rgba(251, 191, 36, 0.05)" } : {}}
    >
      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0", isGold || rank === 1 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950" : "bg-muted")}>
        {isGold || rank === 1 ? "🥇" : rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium truncate" style={{ letterSpacing: "-0.01em" }}>{name}</div>
        <div className="text-[9px] text-muted-foreground">{meta}</div>
      </div>
      <span className="text-sm font-semibold text-purple-400 flex-shrink-0" style={{ textShadow: "0 0 12px rgba(168, 85, 247, 0.4)", letterSpacing: "-0.02em" }}>{value}</span>
    </div>
  );
}
