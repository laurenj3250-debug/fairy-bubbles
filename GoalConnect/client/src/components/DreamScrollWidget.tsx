import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import type { DreamScrollItem } from "@shared/schema";
import { WELLNESS_CUPS, parseCups, cupScore } from "@shared/wellness-cups";
import { Link } from "wouter";

export function DreamScrollWidget() {
  const { data: items = [] } = useQuery<DreamScrollItem[]>({
    queryKey: ["/api/dream-scroll"],
  });

  const { data: wheelState } = useQuery<{
    cupLevels: number[];
    checkedToday: string;
  }>({
    queryKey: ["/api/wellness-wheel/state"],
  });

  const cupLevels = wheelState?.cupLevels || [3, 3, 3, 3, 3, 3];
  const activeItems = items.filter((i) => !i.completed);

  // Find lowest cup(s) — break ties by rotating daily
  const minLevel = Math.min(...cupLevels);
  const tiedIndices = cupLevels
    .map((level, i) => (level === minLevel ? i : -1))
    .filter((i) => i >= 0);
  const dayRotation = new Date().getDate() % tiedIndices.length;
  const lowestIdx = tiedIndices[dayRotation];
  const lowestLevel = minLevel;
  const lowestCup = WELLNESS_CUPS[lowestIdx];

  // Staleness check
  const today = new Date().toISOString().slice(0, 10);
  const checkedToday = wheelState?.checkedToday;
  let stalenessLabel = "";
  if (!checkedToday) {
    stalenessLabel = "check in first";
  } else if (checkedToday !== today) {
    const diff = Math.floor(
      (new Date(today).getTime() - new Date(checkedToday).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff > 0) stalenessLabel = `${diff}d ago`;
  }

  // Top items by composite score that include the lowest cup
  const topItems = activeItems
    .filter((item) => parseCups(item.cups).includes(lowestIdx))
    .sort((a, b) => cupScore(parseCups(b.cups), cupLevels) - cupScore(parseCups(a.cups), cupLevels))
    .slice(0, 2);

  return (
    <div className="glass-card interactive-glow p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Wishlist
        </h2>
      </div>

      {/* Lowest cup indicator */}
      <div className="relative z-10 mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: lowestCup.color }}
          />
          <span className="text-sm font-medium" style={{ color: lowestCup.color }}>
            {lowestCup.name}
          </span>
          <span className="text-xs text-foreground/40">
            {lowestLevel}/5
          </span>
          {stalenessLabel && (
            <span className="text-[10px] text-foreground/30 ml-auto">
              ({stalenessLabel})
            </span>
          )}
        </div>
        {/* Level bar */}
        <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(lowestLevel / 5) * 100}%`,
              background: lowestCup.color,
              opacity: 0.6,
            }}
          />
        </div>
      </div>

      {/* Top suggestions */}
      <div className="flex-1 space-y-2 relative z-10">
        {topItems.length > 0 ? (
          topItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2.5 rounded-lg border border-border/30 bg-muted/5"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground font-medium truncate">{item.title}</div>
                {item.description && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</div>
                )}
              </div>
              <div className="flex gap-0.5 flex-shrink-0">
                {parseCups(item.cups).map((idx) => {
                  const cup = WELLNESS_CUPS[idx];
                  if (!cup) return null;
                  return (
                    <span
                      key={idx}
                      className="text-[9px] font-semibold px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: cup.color + "20",
                        color: cup.color,
                      }}
                    >
                      {cup.short}
                    </span>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Add something that fills {lowestCup.name}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-card-border relative z-10">
        <Link href="/dream-scroll">
          <span className="text-sm text-[hsl(var(--accent))] hover:underline font-medium cursor-pointer">
            See all →
          </span>
        </Link>
      </div>
    </div>
  );
}
