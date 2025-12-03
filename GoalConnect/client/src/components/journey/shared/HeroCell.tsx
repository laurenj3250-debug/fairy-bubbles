import { cn } from "@/lib/utils";

interface HeroCellProps {
  value: string;
  label: string;
  sub: string;
  color: "cyan" | "purple" | "orange";
}

export function HeroCell({ value, label, sub, color }: HeroCellProps) {
  const colors = {
    cyan: { gradient: "linear-gradient(135deg, #06b6d4, #22d3ee)", glow: "rgba(6, 182, 212, 0.5)", shadow: "rgba(6, 182, 212, 0.4)" },
    purple: { gradient: "linear-gradient(135deg, #a855f7, #c084fc)", glow: "rgba(168, 85, 247, 0.5)", shadow: "rgba(168, 85, 247, 0.4)" },
    orange: { gradient: "linear-gradient(135deg, #f97316, #fb923c)", glow: "rgba(249, 115, 22, 0.5)", shadow: "rgba(249, 115, 22, 0.4)" },
  };
  const c = colors[color];

  return (
    <div className="col-span-2 row-span-2 glass-card rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden bg-card/70 backdrop-blur-xl">
      <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 50% 30%, ${c.glow}, transparent 60%)` }} />
      <div className="absolute -inset-1/2" style={{ background: `radial-gradient(circle at 50% 50%, ${c.shadow.replace("0.4", "0.15")}, transparent 50%)`, animation: "pulse-glow 3s ease-in-out infinite" }} />
      <div className="text-5xl font-semibold relative z-10" style={{ background: c.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: `drop-shadow(0 0 20px ${c.shadow}) drop-shadow(0 0 40px ${c.shadow.replace("0.4", "0.3")})`, letterSpacing: "-0.03em" }}>
        {value}
      </div>
      <div className="text-sm text-foreground mt-2 relative z-10" style={{ letterSpacing: "-0.01em" }}>{label}</div>
      <div className="text-xs text-emerald-400 font-medium mt-1 relative z-10" style={{ textShadow: "0 0 12px rgba(16, 185, 129, 0.5)" }}>{sub}</div>
    </div>
  );
}
