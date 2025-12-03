interface DonutChartProps {
  total: string;
  unit: string;
  segments: { label: string; value: number; color: string }[];
  primaryColor?: "cyan" | "purple" | "orange";
}

export function DonutChart({ total, unit, segments, primaryColor = "cyan" }: DonutChartProps) {
  const colors = { cyan: "#06b6d4", purple: "#a855f7", orange: "#f97316" };
  const circumference = 2 * Math.PI * 32;
  let offset = 0;

  return (
    <div className="glass-card rounded-2xl p-4 flex gap-3 bg-card/70 backdrop-blur-xl">
      <div className="w-20 h-20 relative flex-shrink-0" style={{ filter: `drop-shadow(0 0 10px ${segments[0].color}50) drop-shadow(0 0 10px ${segments[1].color}40) drop-shadow(0 0 10px ${segments[2].color}40)` }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((seg, i) => {
            const dash = (seg.value / 100) * circumference;
            const currentOffset = offset;
            offset -= dash;
            return <circle key={i} cx="50" cy="50" r="32" fill="none" stroke={seg.color} strokeWidth="14" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={currentOffset} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-sm font-semibold" style={{ color: colors[primaryColor], textShadow: `0 0 10px ${colors[primaryColor]}60`, letterSpacing: "-0.02em" }}>{total}</div>
          <div className="text-[7px] text-muted-foreground">{unit}</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: seg.color, boxShadow: `0 0 6px ${seg.color}` }} />
            {seg.label} {seg.value}%
          </div>
        ))}
      </div>
    </div>
  );
}
