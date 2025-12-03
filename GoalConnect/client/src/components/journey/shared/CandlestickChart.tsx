import { cn } from "@/lib/utils";

interface CandlestickChartProps {
  weeklyValue: number;
  unit: string;
  change: number;
}

export function CandlestickChart({ weeklyValue, unit, change }: CandlestickChartProps) {
  const candles = [
    { wick1: 8, body: 20, wick2: 6, up: true },
    { wick1: 6, body: 24, wick2: 4, up: true },
    { wick1: 12, body: 14, wick2: 10, up: false },
    { wick1: 5, body: 28, wick2: 3, up: true },
    { wick1: 10, body: 18, wick2: 8, up: true },
    { wick1: 12, body: 16, wick2: 12, up: false },
    { wick1: 4, body: 30, wick2: 3, up: true },
    { wick1: 6, body: 26, wick2: 4, up: true },
  ];

  return (
    <div className="col-span-2 glass-card rounded-2xl p-4 flex flex-col bg-card/70 backdrop-blur-xl">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">PERFORMANCE</div>
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-500/10 rounded-md mb-2 text-[11px]">
        <span>This week: <span className="text-emerald-400 font-semibold">{weeklyValue} {unit}</span> • +{change}%</span>
      </div>
      <div className="flex-1 flex items-center justify-around">
        {candles.map((candle, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-0.5 bg-muted-foreground" style={{ height: `${candle.wick1}px` }} />
            <div className={cn("w-3.5 rounded-sm cursor-pointer", candle.up ? "bg-emerald-400" : "bg-red-500")} style={{ height: `${candle.body}px`, boxShadow: candle.up ? "0 0 8px rgba(16, 185, 129, 0.5)" : "0 0 8px rgba(239, 68, 68, 0.5)" }} />
            <div className="w-0.5 bg-muted-foreground" style={{ height: `${candle.wick2}px` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
