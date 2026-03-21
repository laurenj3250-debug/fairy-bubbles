import { SundownShell } from "./SundownCard";

/* ------------------------------------------------------------------ */
/*  SundownPlayer — decorative media player strip                      */
/* ------------------------------------------------------------------ */

export function SundownPlayer() {
  return (
    <SundownShell
      hover={false}
      style={{ borderRadius: 28, padding: 3 }}
    >
      {/* Face */}
      <div
        className="sd-player-face"
        style={{
          background: "var(--sd-face-bg)",
          backdropFilter: "blur(20px) saturate(1.3)",
          WebkitBackdropFilter: "blur(20px) saturate(1.3)",
          borderRadius: 25,
          height: 64,
          padding: "0 24px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 18,
          borderTop: "1px solid rgba(255,200,140,0.12)",
          boxShadow: "var(--sd-face-inset, inset 0 1px 0 rgba(255,200,140,0.08))",
        }}
      >
        {/* 1. Album art */}
        <div
          style={{
            width: 44,
            height: 44,
            minWidth: 44,
            borderRadius: 10,
            background:
              "linear-gradient(135deg, rgba(200,131,73,0.4), rgba(212,96,74,0.3))",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          🎵
        </div>

        {/* 2. Track info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--sd-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Sunset Lover
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--sd-text-muted)",
            }}
          >
            Petit Biscuit
          </div>
        </div>

        {/* 3. Controls */}
        <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
          <button
            className="sd-player-btn"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(80,50,35,0.4)",
              border: "none",
              color: "var(--sd-text-secondary)",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
          >
            ⏮
          </button>
          <button
            className="sd-player-btn sd-player-btn-play"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(200,131,73,0.35)",
              border: "none",
              color: "var(--sd-text-accent)",
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
          >
            ▶
          </button>
          <button
            className="sd-player-btn"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(80,50,35,0.4)",
              border: "none",
              color: "var(--sd-text-secondary)",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
          >
            ⏭
          </button>
        </div>

        {/* 4. Progress track */}
        <div
          className="sd-player-progress"
          style={{
            flex: 1,
            maxWidth: 300,
            height: 6,
            borderRadius: 3,
            background: "rgba(15,10,8,0.5)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "35%",
              height: "100%",
              borderRadius: 3,
              background: "linear-gradient(90deg, var(--sd-accent-dark), var(--sd-accent))",
              boxShadow: "0 0 6px rgba(218,165,32,0.4)",
            }}
          />
        </div>

        {/* 5. Time label */}
        <div
          className="sd-player-time"
          style={{
            fontSize: 11,
            color: "var(--sd-text-muted)",
            minWidth: 60,
            textAlign: "right",
          }}
        >
          1:24 / 3:41
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .sd-player-face {
            flex-wrap: wrap !important;
            height: auto !important;
            padding: 12px 18px !important;
          }
          .sd-player-progress {
            width: 100%;
            max-width: none !important;
            order: 10;
          }
          .sd-player-time {
            order: 11;
          }
        }
        .sd-player-btn:hover {
          background: rgba(120,80,55,0.5) !important;
          color: var(--sd-text-primary) !important;
        }
        .sd-player-btn-play:hover {
          background: rgba(200,131,73,0.5) !important;
          color: var(--sd-text-primary) !important;
        }
      `}</style>
    </SundownShell>
  );
}
