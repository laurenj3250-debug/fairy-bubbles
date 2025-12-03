interface TrendCellProps {
  value: string;
  percent: number;
  label: string;
  color?: "green" | "purple" | "orange";
}

export function TrendCell({ value, percent, label, color = "green" }: TrendCellProps) {
  const colors = {
    green: { gradient: "linear-gradient(135deg, #10b981, #059669)", shadow: "rgba(16, 185, 129, 0.4)", fill: "#10b981" },
    purple: { gradient: "linear-gradient(135deg, #a855f7, #9333ea)", shadow: "rgba(168, 85, 247, 0.4)", fill: "#a855f7" },
    orange: { gradient: "linear-gradient(135deg, #f97316, #ea580c)", shadow: "rgba(249, 115, 22, 0.4)", fill: "#f97316" },
  };
  const c = colors[color];

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col bg-card/70 backdrop-blur-xl">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">{label}</div>
      <div className="text-2xl font-semibold" style={{ background: c.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: `drop-shadow(0 0 15px ${c.shadow}) drop-shadow(0 0 30px ${c.shadow.replace("0.4", "0.2")})`, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-[11px] mt-0.5" style={{ color: c.fill, textShadow: `0 0 8px ${c.shadow}` }}>(+{percent}%) 🔥</div>
      <div className="flex-1 mt-2">
        <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="w-full h-full">
          <defs><linearGradient id={`spd-fill-${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.fill} stopOpacity="0.4" /><stop offset="100%" stopColor={c.fill} stopOpacity="0" /></linearGradient></defs>
          <path d="M0,35 Q30,32 60,24 T120,5 L120,40 L0,40 Z" fill={`url(#spd-fill-${color})`} />
          <path d="M0,35 Q30,32 60,24 T120,5" fill="none" stroke={c.fill} strokeWidth="2" />
          <circle cx="120" cy="5" r="3" fill={c.fill} />
        </svg>
      </div>
    </div>
  );
}
