import { cn } from "@/lib/utils";

interface StatCellProps {
  value: string;
  label: string;
  sub: string;
  color: "orange" | "purple" | "yellow" | "cyan";
}

export function StatCell({ value, label, sub, color }: StatCellProps) {
  const colors = {
    orange: { text: "text-orange-500", shadow: "0 0 20px rgba(249, 115, 22, 0.4)" },
    purple: { text: "text-purple-400", shadow: "0 0 20px rgba(168, 85, 247, 0.4)" },
    yellow: { text: "text-yellow-400", shadow: "0 0 20px rgba(234, 179, 8, 0.4)" },
    cyan: { text: "text-cyan-400", shadow: "0 0 20px rgba(6, 182, 212, 0.4)" },
  };

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center bg-card/70 backdrop-blur-xl">
      <div className={cn("text-2xl font-semibold", colors[color].text)} style={{ textShadow: colors[color].shadow, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
      <div className={cn("text-[9px] mt-0.5 opacity-65", colors[color].text)}>{sub}</div>
    </div>
  );
}
