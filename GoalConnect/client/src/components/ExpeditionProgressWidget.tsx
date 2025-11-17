import { useQuery } from "@tanstack/react-query";
import { Battery, Mountain, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ExpeditionProgressWidget() {
  const { data: climbingStats } = useQuery<any>({
    queryKey: ["/api/climbing-stats"],
  });

  const { data: activeExpeditions } = useQuery<any[]>({
    queryKey: ["/api/expeditions/active"],
  });

  const activeExpedition = activeExpeditions?.[0];
  const energyPercent = climbingStats
    ? (climbingStats.currentEnergy / climbingStats.maxEnergy) * 100
    : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl">
      <h3 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <Mountain className="w-5 h-5 text-blue-400" />
        Expedition Status
      </h3>

      {/* Climbing Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {climbingStats?.climbingLevel || 1}
          </div>
          <div className="text-xs text-slate-400">Level</div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {climbingStats?.summitsReached || 0}
          </div>
          <div className="text-xs text-slate-400">Summits</div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {climbingStats?.totalElevationClimbed
              ? `${(climbingStats.totalElevationClimbed / 1000).toFixed(1)}k`
              : '0'}
          </div>
          <div className="text-xs text-slate-400">Elevation (m)</div>
        </div>
      </div>

      {/* Energy Bar */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Battery className="w-4 h-4 text-green-400" />
            <span>Energy</span>
          </div>
          <span className="text-sm font-medium text-slate-200">
            {climbingStats?.currentEnergy || 0} / {climbingStats?.maxEnergy || 100}
          </span>
        </div>
        <Progress value={energyPercent} className="h-3" />
      </div>

      {/* Active Expedition */}
      {activeExpedition ? (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h4 className="font-semibold text-blue-300">Active Climb</h4>
          </div>

          <p className="text-sm text-slate-200 mb-2">{activeExpedition.routeName}</p>

          <div className="flex items-center gap-3 mb-2">
            <Progress value={activeExpedition.currentProgress} className="flex-1 h-2" />
            <span className="text-sm text-slate-400">{activeExpedition.currentProgress}%</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-slate-400">
              Day: <span className="text-slate-200 font-medium">{activeExpedition.currentDay}</span>
            </div>
            <div className="text-slate-400">
              Altitude: <span className="text-slate-200 font-medium">{activeExpedition.currentAltitude}m</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/30 rounded-lg p-4 text-center border border-dashed border-slate-700">
          <Mountain className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No active expedition</p>
        </div>
      )}
    </div>
  );
}
