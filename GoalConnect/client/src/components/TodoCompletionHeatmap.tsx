import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";

interface TodoHeatmapData {
  date: string;
  completed: number;
  total: number;
}

export default function TodoCompletionHeatmap() {
  const { data: todos } = useQuery({
    queryKey: ["/api/todos"],
  });

  // Process data into heatmap format
  const heatmapData: TodoHeatmapData[] = [];
  const days = 90; // Last 90 days

  for (let i = days - 1; i >= 0; i--) {
    const date = format(startOfDay(subDays(new Date(), i)), "yyyy-MM-dd");
    const completedOnDate = todos?.filter(
      (t: any) => t.completedAt && t.completedAt.startsWith(date)
    ).length || 0;

    heatmapData.push({
      date,
      completed: completedOnDate,
      total: completedOnDate, // Can expand to show created vs completed
    });
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl">
      <h3 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <span className="text-2xl">✓</span>
        Todo Completion Heatmap
      </h3>

      <div className="grid grid-cols-[repeat(13,1fr)] gap-1">
        {heatmapData.map((day) => {
          const intensity = Math.min(day.completed / 5, 1); // Max 5 todos = full intensity
          const opacity = intensity === 0 ? 0.5 : intensity;
          const backgroundColor = intensity === 0
            ? "rgb(30, 41, 59)" // slate-800
            : `rgba(16, 185, 129, ${opacity})`; // emerald-500

          return (
            <div
              key={day.date}
              className="w-3 h-3 md:w-4 md:h-4 rounded-sm hover:ring-2 hover:ring-emerald-400/50 transition-all cursor-pointer"
              style={{ backgroundColor }}
              title={`${day.date}: ${day.completed} todos completed`}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>Last 90 days</span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-slate-800/50 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-500/30 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-500/60 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-500/100 rounded-sm" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
