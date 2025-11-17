import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

export default function DailyQuestsWidget() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: userQuests } = useQuery<any[]>({
    queryKey: ["/api/daily-quests/today"],
  });

  if (!userQuests || userQuests.length === 0) {
    return (
      <div className="bg-gradient-to-br from-cyan-950/40 to-cyan-900/20 backdrop-blur-sm rounded-xl p-6 border border-cyan-700/30 shadow-xl">
        <h3 className="text-xl font-semibold text-cyan-100 mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Daily Quests
        </h3>
        <p className="text-slate-400 text-sm">No quests available today</p>
      </div>
    );
  }

  const completedCount = userQuests.filter((q: any) => q.completed).length;
  const claimedCount = userQuests.filter((q: any) => q.claimed).length;

  return (
    <div className="bg-gradient-to-br from-cyan-950/40 to-cyan-900/20 backdrop-blur-sm rounded-xl p-6 border border-cyan-700/30 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-cyan-100 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Daily Quests
        </h3>
        <span className="text-sm text-cyan-300 bg-cyan-900/50 px-3 py-1 rounded-full">
          {completedCount}/{userQuests.length} Complete
        </span>
      </div>

      <div className="space-y-3">
        {userQuests.map((quest: any) => {
          const progress = Math.min((quest.progress / quest.targetValue) * 100, 100);
          const isComplete = quest.completed;
          const isClaimed = quest.claimed;

          return (
            <div
              key={quest.id}
              className={`bg-slate-800/50 rounded-lg p-4 border transition-all ${
                isComplete
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : 'border-slate-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className={`font-medium mb-1 ${isComplete ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {quest.title}
                  </h4>
                  {quest.description && (
                    <p className="text-xs text-slate-400">{quest.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-amber-400 text-sm font-medium">
                    +{quest.rewardTokens}
                  </span>
                  {isClaimed && (
                    <span className="text-emerald-400">✓</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Progress value={progress} className="flex-1 h-2" />
                <span className="text-sm text-slate-400 min-w-[4rem] text-right">
                  {quest.progress}/{quest.targetValue}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {completedCount > 0 && claimedCount < completedCount && (
        <div className="mt-4 p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-center">
          <p className="text-emerald-300 text-sm">
            🎉 {completedCount - claimedCount} quest{completedCount - claimedCount !== 1 ? 's' : ''} ready to claim!
          </p>
        </div>
      )}
    </div>
  );
}
