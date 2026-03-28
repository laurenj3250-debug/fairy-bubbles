import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SundownCard } from "./SundownCard";
import { WELLNESS_CUPS, parseCups } from "@shared/wellness-cups";
import type { DreamScrollItem } from "@shared/schema";

const CUPS = ["Body", "Adventure", "Novelty", "Soul", "People", "Mastery"] as const;

export function SundownJournalTab() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: items = [] } = useQuery<DreamScrollItem[]>({
    queryKey: ["/api/dream-scroll"],
  });

  // Filter items by cup and completion
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by completion
    if (!showCompleted) {
      result = result.filter((item) => !item.completed);
    }

    // Filter by cup
    if (filter !== "all") {
      const cupIndex = CUPS.indexOf(filter as typeof CUPS[number]);
      if (cupIndex >= 0) {
        result = result.filter((item) => {
          const cups = parseCups(item.cups);
          return cups.includes(cupIndex);
        });
      }
    }

    return result;
  }, [items, filter, showCompleted]);

  const handleToggle = async (id: number) => {
    try {
      await apiRequest(`/api/dream-scroll/${id}/toggle`, "POST");
      queryClient.invalidateQueries({ queryKey: ["/api/dream-scroll"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle item",
        variant: "destructive",
      });
    }
  };

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SundownCard
        title="Dream Scroll"
        headerRight={
          <span style={{
            fontSize: 11, fontWeight: 600, color: "var(--sd-text-accent)",
            background: "rgba(200,131,73,0.15)", padding: "3px 10px", borderRadius: 10,
          }}>
            {completedCount}/{items.length}
          </span>
        }
        useTray={false}
      >
        {/* Cup filter tabs */}
        <div className="sd-month-tabs" style={{ marginBottom: 14 }}>
          <button
            className={`sd-month-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          {CUPS.map((cup) => (
            <button
              key={cup}
              className={`sd-month-tab ${filter === cup ? "active" : ""}`}
              onClick={() => setFilter(cup)}
            >
              {cup}
            </button>
          ))}
        </div>

        {/* Show/hide completed toggle */}
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            style={{
              fontSize: 11, fontWeight: 600, color: "var(--sd-text-muted)",
              background: "none", border: "none", cursor: "pointer",
              textDecoration: "underline", textUnderlineOffset: 2,
            }}
          >
            {showCompleted ? "Hide Completed" : "Show Completed"}
          </button>
        </div>

        {/* Items list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredItems.length === 0 ? (
            <div style={{
              padding: "20px 0", fontSize: 13,
              color: "var(--sd-text-muted)", textAlign: "center",
            }}>
              {filter === "all" ? "No dream scroll items yet" : `No items in ${filter}`}
            </div>
          ) : (
            filteredItems.map((item) => {
              const cups = parseCups(item.cups);
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 12,
                    background: "var(--sd-goal-face, rgba(85,48,50,0.4))",
                    borderTop: "1px solid rgba(255,200,140,0.06)",
                    opacity: item.completed ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {/* Toggle button */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    style={{
                      width: 22, height: 22, minWidth: 22, borderRadius: "50%",
                      border: item.completed
                        ? "2px solid var(--sd-text-accent)"
                        : "2px solid rgba(169,130,106,0.4)",
                      background: item.completed ? "rgba(200,131,73,0.25)" : "transparent",
                      cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    {item.completed && (
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                        stroke="var(--sd-text-accent)" strokeWidth={3}
                        strokeLinecap="round" strokeLinejoin="round"
                      >
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: "var(--sd-text-primary)",
                      textDecoration: item.completed ? "line-through" : "none",
                      lineHeight: 1.3,
                    }}>
                      {item.title}
                    </div>
                    {item.description && (
                      <div style={{
                        fontSize: 11, color: "var(--sd-text-muted)",
                        marginTop: 2, lineHeight: 1.3,
                      }}>
                        {item.description}
                      </div>
                    )}
                  </div>

                  {/* Cup dots */}
                  {cups.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      {cups.map((idx) => {
                        const cup = WELLNESS_CUPS[idx];
                        if (!cup) return null;
                        return (
                          <div
                            key={idx}
                            title={cup.name}
                            style={{
                              width: 8, height: 8, borderRadius: "50%",
                              background: cup.color, opacity: 0.7,
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SundownCard>
    </div>
  );
}
