export function ElevationChart() {
  return (
    <div className="col-span-2 glass-card rounded-2xl p-4 flex flex-col bg-card/70 backdrop-blur-xl">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">CLIMBING</div>
      <div className="text-sm font-medium mb-2" style={{ letterSpacing: "-0.02em" }}>Monthly Elevation</div>
      <div className="flex-1 relative">
        <svg viewBox="0 0 200 50" preserveAspectRatio="none" className="w-full h-full">
          <defs><linearGradient id="mtn-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity="0.7" /><stop offset="100%" stopColor="#f97316" stopOpacity="0.1" /></linearGradient></defs>
          <path d="M0,40 L33,32 L66,24 L100,5 L133,16 L166,28 L200,34 L200,50 L0,50 Z" fill="url(#mtn-grad)" />
          <path d="M0,40 L33,32 L66,24 L100,5 L133,16 L166,28 L200,34" fill="none" stroke="#f97316" strokeWidth="2" />
          <circle cx="100" cy="5" r="4" fill="#f97316" />
        </svg>
        <div className="absolute right-2 bottom-2 text-right">
          <div className="text-sm font-semibold text-orange-500" style={{ textShadow: "0 0 12px rgba(249, 115, 22, 0.5)", letterSpacing: "-0.02em" }}>12.4k</div>
          <div className="text-[9px] text-muted-foreground">Nov</div>
        </div>
      </div>
    </div>
  );
}
