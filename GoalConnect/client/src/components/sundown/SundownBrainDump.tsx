import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Capture {
  id: string;
  item: string;
  project: string | null;
  type: string | null;
  done: boolean;
  createdTime: string;
}

const PROJECTS = ["All", "Life", "Piano", "VetHub", "Fairy Bubbles"] as const;

const PROJECT_COLORS: Record<string, string> = {
  Life: "var(--bd-life)",
  Piano: "var(--bd-piano)",
  VetHub: "var(--bd-vethub)",
  "Fairy Bubbles": "var(--bd-fairy)",
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Want: { bg: "rgba(212,140,171,0.15)", text: "#d48cab" },
  "To Do": { bg: "rgba(225,164,92,0.15)", text: "#e1a45c" },
  Fix: { bg: "rgba(212,122,106,0.15)", text: "#d47a6a" },
  Note: { bg: "rgba(160,160,180,0.15)", text: "#a0a0b4" },
  Idea: { bg: "rgba(90,154,206,0.15)", text: "#5a9ace" },
  Phrase: { bg: "rgba(176,142,255,0.15)", text: "#b08eff" },
  "Look Up": { bg: "rgba(180,160,120,0.15)", text: "#b4a078" },
};

function projectGlowClass(project: string | null): string {
  switch (project) {
    case "Life": return "bd-glow-life";
    case "Piano": return "bd-glow-piano";
    case "VetHub": return "bd-glow-vethub";
    case "Fairy Bubbles": return "bd-glow-fairy";
    default: return "bd-glow-life";
  }
}

export function SundownBrainDump() {
  const [filter, setFilter] = useState<string>("All");
  const [showDone, setShowDone] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ captures: Capture[]; total: number }>({
    queryKey: ["/api/brain-dump/captures"],
    queryFn: async () => {
      const res = await fetch("/api/brain-dump/captures", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const res = await fetch(`/api/brain-dump/captures/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ done }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brain-dump/captures"] });
    },
  });

  const captures = data?.captures || [];
  const filtered = captures.filter((c) => {
    if (!showDone && c.done) return false;
    if (filter !== "All" && c.project !== filter) return false;
    return true;
  });

  const pendingCount = captures.filter((c) => !c.done).length;
  const doneCount = captures.filter((c) => c.done).length;

  return (
    <div className="sd-full-width">
      <style>{`
        :root {
          --bd-life: #7dab8e;
          --bd-piano: #b08eff;
          --bd-vethub: #5a9ace;
          --bd-fairy: #e1a45c;
        }
        .bd-grid { column-count: 2; column-gap: 14px; }
        @media (max-width: 600px) { .bd-grid { column-count: 1; } }

        .bd-card {
          break-inside: avoid;
          margin-bottom: 14px;
          padding: 18px 16px;
          border-radius: 18px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.06);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.25s;
        }
        .bd-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 12px 36px rgba(0,0,0,0.4);
        }
        .bd-card::before {
          content: '';
          position: absolute;
          top: -40%;
          right: -25%;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.55;
          pointer-events: none;
        }
        .bd-glow-life::before   { background: var(--bd-life); }
        .bd-glow-piano::before  { background: var(--bd-piano); }
        .bd-glow-vethub::before { background: var(--bd-vethub); }
        .bd-glow-fairy::before  { background: var(--bd-fairy); }

        .bd-card.is-done { opacity: 0.35; }
        .bd-card.is-done .bd-title { text-decoration: line-through; color: var(--sd-text-muted); }
      `}</style>

      <div className="sd-shell" style={{ animationDelay: "2.5s" }}>
        <div className="sd-face">
          {/* Header */}
          <div className="sd-card-hdr">
            <span className="sd-card-title">Brain Dump</span>
            <span className="sd-badge">{pendingCount} pending</span>
          </div>

          {/* Filter chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {PROJECTS.map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 10,
                  border: `1px solid ${filter === p ? "rgba(225,164,92,0.5)" : "rgba(225,164,92,0.2)"}`,
                  background: filter === p ? "rgba(225,164,92,0.2)" : "rgba(20,10,14,0.5)",
                  color: filter === p ? "var(--sd-text-accent)" : "var(--sd-text-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: filter === p ? "0 0 10px rgba(225,164,92,0.15)" : "none",
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setShowDone(!showDone)}
              style={{
                padding: "5px 12px",
                borderRadius: 10,
                border: `1px solid ${showDone ? "rgba(225,164,92,0.4)" : "rgba(225,164,92,0.15)"}`,
                background: showDone ? "rgba(225,164,92,0.15)" : "transparent",
                color: "var(--sd-text-muted)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              {showDone ? `hide done (${doneCount})` : `show done (${doneCount})`}
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--sd-text-muted)", fontSize: 13 }}>
              Loading captures...
            </div>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--sd-text-muted)", fontSize: 13 }}>
              {filter === "All" ? "All clear." : `No ${filter} captures.`}
            </div>
          )}

          {/* Masonry grid */}
          {!isLoading && filtered.length > 0 && (
            <div className="bd-grid">
              {filtered.map((capture) => {
                const typeStyle = TYPE_COLORS[capture.type || ""] || { bg: "rgba(160,160,180,0.15)", text: "#a0a0b4" };
                return (
                  <div
                    key={capture.id}
                    className={`bd-card ${projectGlowClass(capture.project)} ${capture.done ? "is-done" : ""}`}
                    onClick={() => toggleMutation.mutate({ id: capture.id, done: !capture.done })}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, position: "relative" }}>
                      {/* Checkbox */}
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 7,
                          border: `1.5px solid ${capture.done ? "rgba(225,164,92,0.6)" : "rgba(225,164,92,0.3)"}`,
                          background: capture.done ? "rgba(225,164,92,0.4)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: capture.done ? "#0a0507" : "transparent",
                          flexShrink: 0,
                          marginTop: 2,
                          transition: "all 0.2s",
                        }}
                      >
                        &#10003;
                      </div>

                      <div style={{ flex: 1 }}>
                        {/* Title */}
                        <div
                          className="bd-title"
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            lineHeight: 1.35,
                            marginBottom: 8,
                            color: "var(--sd-text-primary)",
                          }}
                        >
                          {capture.item}
                        </div>

                        {/* Tags */}
                        <div style={{ display: "flex", gap: 5 }}>
                          {capture.project && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase" as const,
                                letterSpacing: "0.05em",
                                padding: "2px 7px",
                                borderRadius: 5,
                                background: `${PROJECT_COLORS[capture.project] || "var(--bd-life)"}22`,
                                color: PROJECT_COLORS[capture.project] || "var(--bd-life)",
                              }}
                            >
                              {capture.project}
                            </span>
                          )}
                          {capture.type && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase" as const,
                                letterSpacing: "0.04em",
                                padding: "2px 6px",
                                borderRadius: 5,
                                background: typeStyle.bg,
                                color: typeStyle.text,
                              }}
                            >
                              {capture.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
