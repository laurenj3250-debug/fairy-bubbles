import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes, parseISO } from "date-fns";

export default function StreakComboWidget() {
  const { data: comboStats } = useQuery<any>({
    queryKey: ["/api/combo-stats"],
  });

  const { data: habitLogs } = useQuery<any[]>({
    queryKey: ["/api/habit-logs"],
  });

  // Calculate current streak from habit logs
  const calculateStreak = () => {
    if (!habitLogs || habitLogs.length === 0) return 0;

    const sortedLogs = habitLogs
      .filter((log: any) => log.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();

    for (const log of sortedLogs) {
      const logDate = new Date(log.date);
      const daysDiff = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= streak + 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();
  const currentCombo = comboStats?.currentCombo || 0;
  const dailyHighScore = comboStats?.dailyHighScore || 0;

  // Check if combo is active (within 4 hours)
  const comboActive = comboStats?.comboExpiresAt &&
    differenceInMinutes(parseISO(comboStats.comboExpiresAt), new Date()) > 0;

  return (
    <div className="bg-gradient-to-br from-purple-950/40 to-purple-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30 shadow-xl">
      <h3 className="text-xl font-semibold text-purple-100 mb-4 flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        Streaks & Combos
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Current Combo */}
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className={`text-4xl font-bold mb-1 ${comboActive ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`}>
            {currentCombo}x
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Current Combo</div>
          {comboActive && comboStats?.comboExpiresAt && (
            <div className="mt-2 text-xs text-orange-400">
              ⏱ {Math.floor(differenceInMinutes(parseISO(comboStats.comboExpiresAt), new Date()) / 60)}h {differenceInMinutes(parseISO(comboStats.comboExpiresAt), new Date()) % 60}m left
            </div>
          )}
        </div>

        {/* Daily High Score */}
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-1">
            {dailyHighScore}x
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Today's Best</div>
        </div>
      </div>

      {/* Current Streak */}
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-300 mb-1">Current Streak</div>
            <div className="text-3xl font-bold text-orange-400">
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </div>
          </div>
          <div className="text-5xl">🔥</div>
        </div>

        {/* Streak visualization */}
        <div className="mt-4 flex gap-1">
          {[...Array(Math.min(currentStreak, 30))].map((_, i) => (
            <div
              key={i}
              className="h-2 flex-1 bg-gradient-to-t from-orange-600 to-orange-400 rounded-full"
              style={{ maxWidth: '8px' }}
            />
          ))}
          {currentStreak > 30 && (
            <div className="text-xs text-slate-400 ml-2">+{currentStreak - 30} more</div>
          )}
        </div>
      </div>
    </div>
  );
}
