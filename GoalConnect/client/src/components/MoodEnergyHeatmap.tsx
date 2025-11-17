import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import { Smile, Zap } from "lucide-react";

interface MoodEnergyData {
  date: string;
  avgMood: number;
  avgEnergy: number;
  count: number;
}

export default function MoodEnergyHeatmap() {
  const { data: habitLogs } = useQuery<any[]>({
    queryKey: ["/api/habit-logs"],
  });

  // Process data into daily averages
  const dailyData: Record<string, { moods: number[]; energies: number[] }> = {};
  const days = 90;

  for (let i = days - 1; i >= 0; i--) {
    const date = format(startOfDay(subDays(new Date(), i)), "yyyy-MM-dd");
    dailyData[date] = { moods: [], energies: [] };
  }

  habitLogs?.forEach((log: any) => {
    if (dailyData[log.date]) {
      if (log.mood) dailyData[log.date].moods.push(log.mood);
      if (log.energyLevel) dailyData[log.date].energies.push(log.energyLevel);
    }
  });

  const heatmapData: MoodEnergyData[] = Object.entries(dailyData).map(([date, data]) => ({
    date,
    avgMood: data.moods.length > 0
      ? data.moods.reduce((sum, m) => sum + m, 0) / data.moods.length
      : 0,
    avgEnergy: data.energies.length > 0
      ? data.energies.reduce((sum, e) => sum + e, 0) / data.energies.length
      : 0,
    count: data.moods.length,
  }));

  return (
    <div className="bg-gradient-to-br from-pink-950/40 to-purple-900/20 backdrop-blur-sm rounded-xl p-6 border border-pink-700/30 shadow-xl">
      <h3 className="text-xl font-semibold text-pink-100 mb-4 flex items-center gap-2">
        <Smile className="w-5 h-5 text-pink-400" />
        Mood & Energy Tracking
      </h3>

      {/* Mood Heatmap */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Smile className="w-4 h-4 text-pink-400" />
          <h4 className="text-sm font-medium text-pink-200">Mood</h4>
        </div>
        <div className="grid grid-cols-[repeat(13,1fr)] gap-1">
          {heatmapData.map((day) => {
            const intensity = day.avgMood / 5; // 1-5 scale
            const opacity = intensity === 0 ? 0.2 : Math.max(intensity, 0.2);
            let backgroundColor;
            if (intensity === 0) {
              backgroundColor = "rgb(30, 41, 59)"; // slate-800
            } else if (intensity <= 0.4) {
              backgroundColor = `rgba(239, 68, 68, ${opacity})`; // red-500
            } else if (intensity <= 0.6) {
              backgroundColor = `rgba(234, 179, 8, ${opacity})`; // yellow-500
            } else {
              backgroundColor = `rgba(16, 185, 129, ${opacity})`; // emerald-500
            }

            return (
              <div
                key={`mood-${day.date}`}
                className="w-3 h-3 md:w-4 md:h-4 rounded-sm hover:ring-2 hover:ring-pink-400/50 transition-all cursor-pointer"
                style={{ backgroundColor }}
                title={`${day.date}: Mood ${day.avgMood.toFixed(1)}/5 (${day.count} logs)`}
              />
            );
          })}
        </div>
      </div>

      {/* Energy Heatmap */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-medium text-amber-200">Energy</h4>
        </div>
        <div className="grid grid-cols-[repeat(13,1fr)] gap-1">
          {heatmapData.map((day) => {
            const intensity = day.avgEnergy / 5; // 1-5 scale
            const opacity = intensity === 0 ? 0.2 : Math.max(intensity, 0.2);
            let backgroundColor;
            if (intensity === 0) {
              backgroundColor = "rgb(30, 41, 59)"; // slate-800
            } else if (intensity <= 0.4) {
              backgroundColor = `rgba(249, 115, 22, ${opacity})`; // orange-500
            } else if (intensity <= 0.6) {
              backgroundColor = `rgba(234, 179, 8, ${opacity})`; // yellow-500
            } else {
              backgroundColor = `rgba(6, 182, 212, ${opacity})`; // cyan-500
            }

            return (
              <div
                key={`energy-${day.date}`}
                className="w-3 h-3 md:w-4 md:h-4 rounded-sm hover:ring-2 hover:ring-amber-400/50 transition-all cursor-pointer"
                style={{ backgroundColor }}
                title={`${day.date}: Energy ${day.avgEnergy.toFixed(1)}/5 (${day.count} logs)`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-400 text-center">
        Last 90 days
      </div>
    </div>
  );
}
