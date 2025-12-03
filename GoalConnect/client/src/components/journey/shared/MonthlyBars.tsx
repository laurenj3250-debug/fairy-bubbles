import { cn } from "@/lib/utils";

interface MonthlyBarsProps {
  data: number[];
  avg: number;
  color?: "cyan" | "purple" | "orange";
}

export function MonthlyBars({ data, avg, color = "cyan" }: MonthlyBarsProps) {
  const maxVal = Math.max(...data);
  const colors = {
    cyan: { above: "from-emerald-600 to-emerald-400", aboveShadow: "0 0 8px rgba(16, 185, 129, 0.4)", below: "from-cyan-600 to-cyan-400", belowShadow: "0 0 8px rgba(6, 182, 212, 0.4)" },
    purple: { above: "from-emerald-600 to-emerald-400", aboveShadow: "0 0 8px rgba(16, 185, 129, 0.4)", below: "from-purple-600 to-purple-400", belowShadow: "0 0 8px rgba(168, 85, 247, 0.4)" },
    orange: { above: "from-emerald-600 to-emerald-400", aboveShadow: "0 0 8px rgba(16, 185, 129, 0.4)", below: "from-orange-600 to-orange-400", belowShadow: "0 0 8px rgba(249, 115, 22, 0.4)" },
  };
  const c = colors[color];

  return (
    <div className="flex-1 flex items-end justify-between gap-1 pt-2">
      {data.map((val, i) => {
        const height = `${(val / maxVal) * 100}%`;
        const isAboveAvg = val > avg;
        const month = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i];
        return (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className={cn("w-full max-w-6 rounded-t transition-all hover:brightness-125 hover:scale-x-110 bg-gradient-to-t", isAboveAvg ? c.above : c.below)}
              style={{ height, minHeight: "4px", boxShadow: isAboveAvg ? c.aboveShadow : c.belowShadow, opacity: i === 11 ? 0.3 : 1 }}
            />
            <span className="text-[8px] text-muted-foreground mt-1">{month}</span>
          </div>
        );
      })}
    </div>
  );
}
