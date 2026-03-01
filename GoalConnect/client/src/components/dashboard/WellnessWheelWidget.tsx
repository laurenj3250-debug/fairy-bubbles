import { Link } from "wouter";
import { Sun, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const CUP_NAMES = ["Body", "Adventure", "Novelty", "Soul", "People", "Mastery"];
const CUP_COLORS = ["#C2546A", "#3A9DAF", "#C45990", "#8E50AF", "#CFA050", "#4FA070"];

export function WellnessWheelWidget() {
  const { data: state, isLoading } = useQuery<{
    cupLevels: number[];
    checkedToday: string;
  }>({
    queryKey: ["/api/wellness-wheel/state"],
  });

  if (isLoading || !state) return null;

  const levels = state.cupLevels || [3, 3, 3, 3, 3, 3];
  const today = new Date().toISOString().slice(0, 10);
  const checkedIn = state.checkedToday === today;
  const avg = (levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(1);

  return (
    <Link href="/wheel">
      <div className="glass-card rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-foreground/80">Wellness Wheel</span>
          </div>
          <div className="flex items-center gap-1">
            {checkedIn ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">checked in</span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">check in</span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Cup level bars */}
        <div className="flex gap-1.5">
          {levels.map((level, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-10 rounded-md overflow-hidden relative" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-md transition-all duration-500"
                  style={{
                    height: `${(level / 5) * 100}%`,
                    background: `linear-gradient(180deg, ${CUP_COLORS[i]}80 0%, ${CUP_COLORS[i]}40 100%)`,
                    boxShadow: level >= 4 ? `0 0 8px ${CUP_COLORS[i]}40` : "none",
                  }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                {CUP_NAMES[i].slice(0, 3)}
              </span>
            </div>
          ))}
        </div>

        {/* Average */}
        <div className="text-center mt-2">
          <span className="text-xs text-muted-foreground">avg {avg}/5</span>
        </div>
      </div>
    </Link>
  );
}
