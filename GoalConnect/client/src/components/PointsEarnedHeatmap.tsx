import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays, parseISO } from "date-fns";

interface PointDayData {
  date: string;
  earned: number;
  spent: number;
  net: number;
}

export default function PointsEarnedHeatmap() {
  const { data: transactions } = useQuery<any[]>({
    queryKey: ["/api/points/transactions"],
  });

  // Process data into daily aggregates
  const dailyData: Record<string, PointDayData> = {};
  const days = 90;

  // Initialize all days
  for (let i = days - 1; i >= 0; i--) {
    const date = format(startOfDay(subDays(new Date(), i)), "yyyy-MM-dd");
    dailyData[date] = { date, earned: 0, spent: 0, net: 0 };
  }

  // Aggregate transactions
  transactions?.forEach((tx: any) => {
    const date = format(parseISO(tx.createdAt), "yyyy-MM-dd");
    if (dailyData[date]) {
      if (tx.amount > 0) {
        dailyData[date].earned += tx.amount;
      } else {
        dailyData[date].spent += Math.abs(tx.amount);
      }
      dailyData[date].net += tx.amount;
    }
  });

  const heatmapData = Object.values(dailyData);
  const maxEarned = Math.max(...heatmapData.map(d => d.earned), 1);

  return (
    <div className="bg-gradient-to-br from-amber-950/40 to-amber-900/20 backdrop-blur-sm rounded-xl p-6 border border-amber-700/30 shadow-xl">
      <h3 className="text-xl font-semibold text-amber-100 mb-4 flex items-center gap-2">
        <span className="text-2xl">💰</span>
        Points Earned Heatmap
      </h3>

      <div className="grid grid-cols-[repeat(13,1fr)] gap-1">
        {heatmapData.map((day) => {
          const intensity = Math.min(day.earned / (maxEarned * 0.5), 1);
          const opacity = intensity === 0 ? 0.2 : Math.max(intensity, 0.2);
          const backgroundColor = intensity === 0
            ? "rgb(30, 41, 59)" // slate-800
            : `rgba(245, 158, 11, ${opacity})`; // amber-500

          return (
            <div
              key={day.date}
              className="w-3 h-3 md:w-4 md:h-4 rounded-sm hover:ring-2 hover:ring-amber-400/50 transition-all cursor-pointer relative group"
              style={{ backgroundColor }}
              title={`${day.date}: +${day.earned} earned, -${day.spent} spent, net: ${day.net}`}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-amber-200/70">
        <span>Last 90 days</span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-slate-800/50 rounded-sm" />
            <div className="w-3 h-3 bg-amber-500/30 rounded-sm" />
            <div className="w-3 h-3 bg-amber-500/60 rounded-sm" />
            <div className="w-3 h-3 bg-amber-500/100 rounded-sm" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-emerald-400">
            {heatmapData.reduce((sum, d) => sum + d.earned, 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">Total Earned</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-rose-400">
            {heatmapData.reduce((sum, d) => sum + d.spent, 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">Total Spent</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-amber-400">
            {heatmapData.reduce((sum, d) => sum + d.net, 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">Net Gain</div>
        </div>
      </div>
    </div>
  );
}
