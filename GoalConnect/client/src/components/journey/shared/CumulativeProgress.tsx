interface CumulativeProgressProps {
  percent: number;
  finishDate: string;
  weeksEarly: number;
}

export function CumulativeProgress({ percent, finishDate, weeksEarly }: CumulativeProgressProps) {
  return (
    <div className="col-span-2 glass-card rounded-2xl p-4 flex flex-col bg-card/70 backdrop-blur-xl">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">YEAR TO DATE</div>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 rounded-md border border-emerald-500 w-fit mb-2" style={{ boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)" }}>
        <span className="text-lg font-semibold text-emerald-400" style={{ textShadow: "0 0 10px rgba(16, 185, 129, 0.5)", letterSpacing: "-0.02em" }}>+{percent}%</span>
        <span className="text-[10px] text-emerald-400">ahead</span>
      </div>
      <div className="flex-1 relative">
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="w-full h-full">
          <defs><linearGradient id="cum-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" /><stop offset="100%" stopColor="#06b6d4" stopOpacity="0" /></linearGradient></defs>
          <line x1="0" y1="55" x2="200" y2="5" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="4,2" />
          <path d="M0,55 Q50,48 100,30 T200,10 L200,60 L0,60 Z" fill="url(#cum-fill)" />
          <path d="M0,55 Q50,48 100,30 T200,10" fill="none" stroke="#06b6d4" strokeWidth="2" />
          <circle cx="200" cy="10" r="4" fill="#06b6d4" />
        </svg>
      </div>
      <div className="text-[10px] text-amber-400 text-center mt-1" style={{ textShadow: "0 0 10px rgba(251, 191, 36, 0.4)" }}>✨ {finishDate} finish ({weeksEarly} weeks early!)</div>
    </div>
  );
}
