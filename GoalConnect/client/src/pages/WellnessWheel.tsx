import { useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { initWheelEngine, type WheelStorageAdapter } from "@/lib/wellness-wheel-engine";

// Key → field mapping for the state API
const STATE_KEYS: Record<string, string> = {
  "ww-cup-levels": "cupLevels",
  "ww-checked-today": "checkedToday",
  "ww-cup-timestamps": "cupTimestamps",
  "ww-settings": "settings",
  "ww-custom-presets": "customPresets",
  "ww-activity-freq": "activityFreq",
};

// Debounce helper
function debounce(fn: (...args: any[]) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export default function WellnessWheel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ReturnType<typeof initWheelEngine> | null>(null);
  const cacheRef = useRef<Map<string, any>>(new Map());
  const initializedRef = useRef(false);

  // Fetch initial state
  const { data: stateData, isLoading: stateLoading } = useQuery<{
    cupLevels: number[];
    checkedToday: string;
    cupTimestamps: Record<string, string>;
    settings: { onboardingComplete?: boolean; soundEnabled?: boolean };
    customPresets: string[];
    activityFreq: Record<string, number>;
    updatedAt: string;
  }>({
    queryKey: ["/api/wellness-wheel/state"],
  });

  // Fetch history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/wellness-wheel/history"],
  });

  // Fetch activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/wellness-wheel/activities"],
  });

  // State mutation (debounced write-through)
  const stateMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const res = await fetch("/api/wellness-wheel/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save state");
      return res.json();
    },
  });

  // History mutation
  const historyMutation = useMutation({
    mutationFn: async ({ date, cupLevels }: { date: string; cupLevels: number[] }) => {
      const res = await fetch(`/api/wellness-wheel/history/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cupLevels }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save history");
      return res.json();
    },
  });

  // Activity mutation
  const activityMutation = useMutation({
    mutationFn: async (activity: { date: string; time: string; activity: string; cups: number[]; notes?: string }) => {
      const res = await fetch("/api/wellness-wheel/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activity),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save activity");
      return res.json();
    },
  });

  // Debounced state save
  const debouncedSaveState = useMemo(
    () =>
      debounce((updates: Record<string, any>) => {
        stateMutation.mutate(updates);
      }, 500),
    []
  );

  // Build the in-memory cache from API data
  const buildCache = useCallback(() => {
    const cache = new Map<string, any>();

    if (stateData) {
      cache.set("ww-cup-levels", stateData.cupLevels || [3, 3, 3, 3, 3, 3]);
      cache.set("ww-checked-today", stateData.checkedToday || "");
      cache.set("ww-cup-timestamps", stateData.cupTimestamps || {});
      cache.set("ww-settings", stateData.settings || {});
      cache.set("ww-custom-presets", stateData.customPresets || []);
      cache.set("ww-activity-freq", stateData.activityFreq || {});
    }

    // Populate history entries
    if (historyData && Array.isArray(historyData)) {
      for (const entry of historyData) {
        cache.set(`ww-history:${entry.date}`, entry.cupLevels);
      }
    }

    // Populate activity log entries (grouped by date)
    if (activitiesData && Array.isArray(activitiesData)) {
      const byDate: Record<string, any[]> = {};
      for (const act of activitiesData) {
        if (!byDate[act.date]) byDate[act.date] = [];
        byDate[act.date].push(act);
      }
      for (const [date, acts] of Object.entries(byDate)) {
        cache.set(`ww-activity-log:${date}`, acts);
      }
    }

    cacheRef.current = cache;
    return cache;
  }, [stateData, historyData, activitiesData]);

  // Create storage adapter
  const createAdapter = useCallback((): WheelStorageAdapter => {
    const cache = cacheRef.current;

    return {
      get(key: string, fallback: any): any {
        if (cache.has(key)) return cache.get(key);
        return fallback;
      },
      set(key: string, val: any): void {
        // Capture old value BEFORE writing (needed for activity log diffing)
        const oldVal = cache.get(key);
        cache.set(key, val);

        // Write-through to API
        if (key in STATE_KEYS) {
          const field = STATE_KEYS[key];
          debouncedSaveState({ [field]: val });
        } else if (key.startsWith("ww-history:")) {
          const date = key.replace("ww-history:", "");
          historyMutation.mutate({ date, cupLevels: val });
        } else if (key.startsWith("ww-activity-log:")) {
          // Activity logs are written via POST, not SET
          // The engine calls storeSet for the whole array, but we need to detect new entries
          const date = key.replace("ww-activity-log:", "");
          const newEntries = val as any[];
          const existing = oldVal || [];
          // Find entries not yet in the existing set (new ones)
          if (newEntries.length > existing.length) {
            const newest = newEntries[newEntries.length - 1];
            if (newest && newest.activity) {
              activityMutation.mutate({
                date,
                time: newest.time || new Date().toISOString(),
                activity: newest.activity,
                cups: newest.cups || [],
                notes: newest.notes || "",
              });
            }
          }
        }
      },
    };
  }, [debouncedSaveState, historyMutation, activityMutation]);

  // Initialize engine ONCE when data first becomes available
  useEffect(() => {
    if (stateLoading || historyLoading || activitiesLoading) return;
    if (!containerRef.current) return;
    if (initializedRef.current) return; // Don't re-init on data changes

    initializedRef.current = true;

    // Build cache from fetched data
    buildCache();

    // Create adapter and init engine
    const adapter = createAdapter();
    const engine = initWheelEngine(containerRef.current, adapter, "/wheel/");
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
      initializedRef.current = false;
    };
  }, [stateLoading, historyLoading, activitiesLoading]);

  if (stateLoading || historyLoading || activitiesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0408]">
        <div className="w-8 h-8 border-4 border-[rgba(212,168,67,0.3)] border-t-[rgb(212,168,67)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Scoped wheel styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:wght@300;400;600&display=swap');
        .ww-root{width:100%;height:100vh;display:flex;align-items:center;justify-content:center;
          background:#0a0408;font-family:'Cormorant Garamond',Georgia,serif;
          -webkit-user-select:none;user-select:none;overflow:hidden}
        .ww-root #phone-frame{position:relative;width:100%;height:100%;max-width:430px;max-height:932px;overflow:hidden;border-radius:0}
        @media(min-width:500px) and (max-width:799px){.ww-root #phone-frame{border-radius:40px;
          box-shadow:0 0 0 2px rgba(212,168,67,.15),0 0 80px rgba(180,100,140,.15),0 25px 60px rgba(0,0,0,.5)}}
        @media(min-width:800px){
          .ww-root #phone-frame{max-width:none;max-height:none;width:min(90vh,700px);height:min(90vh,700px);
            border-radius:0;box-shadow:none;background:transparent;z-index:1;overflow:visible}
          .ww-root #bg{display:none}
          .ww-root #wheel-canvas{mix-blend-mode:normal;
            filter:drop-shadow(0 0 25px rgba(255,230,180,.20))
                   drop-shadow(0 0 60px rgba(212,168,67,.12))
                   drop-shadow(0 0 100px rgba(180,140,160,.08))}
          .ww-root #nudge-card{left:50%;right:auto;width:320px;transform:translateX(-50%) translateY(calc(100% + 40px));
            bottom:calc(16px + env(safe-area-inset-bottom,0px))}
          .ww-root #nudge-card.visible{transform:translateX(-50%) translateY(0)}
          .ww-root #log-fab{bottom:20px;right:calc(50% - 200px)}
          .ww-root #detail-panel{left:50%;right:auto;width:400px;transform:translateX(-50%) translateY(100%);
            border-radius:16px 16px 0 0}
          .ww-root #detail-panel.open{transform:translateX(-50%) translateY(0)}
          .ww-root #log-panel{left:50%;right:auto;width:400px;transform:translateX(-50%) translateY(100%);
            border-radius:16px 16px 0 0}
          .ww-root #log-panel.open{transform:translateX(-50%) translateY(0)}
          .ww-root #export-btn{top:16px;right:16px;position:fixed}
          .ww-root #sound-btn{top:16px;right:54px;position:fixed}
        }
        .ww-root #bg{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0}
        .ww-root #wheel-canvas{position:absolute;z-index:1;pointer-events:none;touch-action:none}
        .ww-root #detail-panel{position:absolute;bottom:0;left:0;right:0;z-index:10;
          background:linear-gradient(175deg,rgba(28,16,12,.92) 0%,rgba(10,4,8,.95) 100%);
          backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
          border-top:1.5px solid rgba(212,168,67,.25);
          box-shadow:0 -4px 30px rgba(0,0,0,.4),inset 0 1px 0 rgba(212,168,67,.08);
          padding:20px 20px calc(30px + env(safe-area-inset-bottom,0px));
          transform:translateY(100%);transition:transform .35s cubic-bezier(.4,0,.2,1)}
        .ww-root #detail-panel.open{transform:translateY(0)}
        .ww-root #panel-cup-name{font-family:'Cinzel Decorative','Cormorant Garamond',Georgia,serif;
          font-size:20px;font-weight:400;letter-spacing:.12em;
          color:rgba(255,255,255,.9);text-align:center;margin-bottom:6px;
          text-shadow:0 1px 8px rgba(212,168,67,.15)}
        .ww-root #panel-nudge{font-size:13px;font-style:italic;color:rgba(255,255,255,.5);
          text-align:center;margin-bottom:14px;min-height:18px;line-height:1.4}
        .ww-root #panel-levels{display:flex;gap:8px;justify-content:center}
        .ww-root .level-btn{flex:1;max-width:72px;padding:10px 4px;
          border:1px solid rgba(212,168,67,.12);border-radius:6px;
          background:linear-gradient(180deg,rgba(40,28,18,.6) 0%,rgba(20,12,8,.7) 100%);
          color:rgba(255,255,255,.6);
          font-family:'Cormorant Garamond',Georgia,serif;font-size:11px;
          letter-spacing:.05em;text-align:center;cursor:pointer;transition:all .2s;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
        .ww-root .level-btn.active{border-color:var(--cup-color);
          background:linear-gradient(180deg,rgba(40,28,18,.8) 0%,rgba(20,12,8,.9) 100%);
          color:#fff;box-shadow:0 0 12px var(--cup-color-dim),inset 0 0 8px rgba(212,168,67,.06)}
        .ww-root .level-btn .num{display:block;font-size:18px;font-weight:600;margin-bottom:2px}
        .ww-root #nudge-card{position:absolute;bottom:calc(20px + env(safe-area-inset-bottom,0px));left:16px;right:70px;z-index:8;
          background:linear-gradient(170deg,rgba(38,24,14,.88) 0%,rgba(16,8,6,.90) 60%,rgba(28,16,10,.85) 100%);
          backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
          border:1px solid rgba(212,168,67,.18);border-radius:10px;padding:16px 18px;
          box-shadow:0 4px 20px rgba(0,0,0,.3),inset 0 1px 0 rgba(212,168,67,.06);
          transform:translateY(calc(100% + 40px));transition:transform .4s cubic-bezier(.4,0,.2,1),opacity .3s;
          opacity:0;pointer-events:none}
        .ww-root #nudge-card.visible{transform:translateY(0);opacity:1;pointer-events:auto}
        .ww-root #nudge-card .nudge-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;
          color:rgba(255,255,255,.4);margin-bottom:6px}
        .ww-root #nudge-card .nudge-cup{font-size:15px;font-weight:600;margin-bottom:4px}
        .ww-root #nudge-card .nudge-text{font-size:13px;font-style:italic;color:rgba(255,255,255,.65);line-height:1.5}
        .ww-root #log-fab{position:absolute;bottom:calc(20px + env(safe-area-inset-bottom,0px));right:16px;z-index:9;width:46px;height:42px;
          border-radius:48% 52% 44% 56% / 60% 58% 42% 40%;
          border:1px solid rgba(212,168,67,.3);
          background:radial-gradient(ellipse at 40% 35%,rgba(60,38,22,.85) 0%,rgba(28,14,8,.90) 70%);
          backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
          color:rgba(212,168,67,.8);font-size:20px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 3px 12px rgba(0,0,0,.3),inset 0 1px 0 rgba(212,168,67,.08);
          transition:transform .2s,box-shadow .2s}
        .ww-root #log-fab:active{transform:scale(.92)}
        .ww-root #log-panel{position:absolute;bottom:0;left:0;right:0;z-index:12;max-height:70vh;
          background:linear-gradient(175deg,rgba(28,16,12,.94) 0%,rgba(10,4,8,.96) 100%);
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border-top:1.5px solid rgba(212,168,67,.25);
          box-shadow:0 -4px 30px rgba(0,0,0,.4),inset 0 1px 0 rgba(212,168,67,.08);
          padding:16px 16px calc(30px + env(safe-area-inset-bottom,0px));overflow-y:auto;
          transform:translateY(100%);transition:transform .35s cubic-bezier(.4,0,.2,1)}
        .ww-root #log-panel.open{transform:translateY(0)}
        .ww-root #log-panel .log-title{font-family:'Cinzel Decorative','Cormorant Garamond',Georgia,serif;
          font-size:15px;font-weight:400;letter-spacing:.12em;
          color:rgba(255,255,255,.85);text-align:center;margin-bottom:12px;
          text-shadow:0 1px 6px rgba(212,168,67,.12)}
        .ww-root .preset-list{display:flex;flex-direction:column;gap:6px}
        .ww-root .preset-item{padding:10px 12px;border:1px solid rgba(212,168,67,.10);border-radius:6px;
          background:linear-gradient(180deg,rgba(40,28,18,.3) 0%,rgba(20,12,8,.4) 100%);
          cursor:pointer;transition:background .15s}
        .ww-root .preset-item:active{background:rgba(212,168,67,.08)}
        .ww-root .preset-item .preset-name{font-size:14px;color:rgba(255,255,255,.8)}
        .ww-root .preset-item .preset-cups{font-size:11px;color:rgba(255,255,255,.4);margin-top:2px}
        .ww-root .log-confirm{display:none;flex-direction:column;gap:10px;align-items:center}
        .ww-root .log-confirm .confirm-title{font-size:15px;color:rgba(255,255,255,.85);text-align:center}
        .ww-root .cup-tags{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
        .ww-root .cup-tag{padding:6px 12px;border-radius:5px;font-size:12px;letter-spacing:.04em;
          border:1px solid rgba(212,168,67,.10);
          background:linear-gradient(180deg,rgba(40,28,18,.3) 0%,rgba(20,12,8,.4) 100%);
          color:rgba(255,255,255,.6);cursor:pointer;transition:all .15s}
        .ww-root .cup-tag.active{border-color:var(--tag-color);color:#fff;
          background:linear-gradient(180deg,rgba(40,28,18,.5) 0%,rgba(20,12,8,.6) 100%)}
        .ww-root .log-actions{display:flex;gap:10px;margin-top:6px}
        .ww-root .log-actions button{flex:1;padding:10px;border-radius:6px;font-family:inherit;font-size:13px;
          letter-spacing:.05em;cursor:pointer;border:none}
        .ww-root .log-actions .btn-cancel{background:linear-gradient(180deg,rgba(40,28,18,.4) 0%,rgba(20,12,8,.5) 100%);
          color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.08)}
        .ww-root .log-actions .btn-save{background:linear-gradient(180deg,rgba(60,42,18,.5) 0%,rgba(40,24,8,.6) 100%);
          color:rgba(212,168,67,.9);border:1px solid rgba(212,168,67,.3);
          box-shadow:inset 0 0 8px rgba(212,168,67,.06)}
        .ww-root .custom-input{width:100%;padding:10px 12px;border:1px solid rgba(255,255,255,.12);
          border-radius:10px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.8);
          font-family:inherit;font-size:13px;outline:none}
        .ww-root .custom-input::placeholder{color:rgba(255,255,255,.3)}
        .ww-root #panel-activities{margin-top:10px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px}
        .ww-root #panel-activities .act-item{font-size:12px;color:rgba(255,255,255,.45);padding:3px 0}
        .ww-root #panel-activities .act-time{color:rgba(255,255,255,.25);margin-right:6px}
        .ww-root .panel-patterns{margin-top:12px;border-top:1px solid rgba(255,255,255,.06);padding-top:10px}
        .ww-root .panel-patterns .pattern-heading{font-size:10px;letter-spacing:.1em;text-transform:uppercase;
          color:rgba(255,255,255,.3);margin-bottom:6px;margin-top:8px}
        .ww-root .panel-patterns .pattern-heading:first-child{margin-top:0}
        .ww-root .panel-patterns .pattern-item{font-size:12px;padding:2px 0;color:rgba(255,255,255,.65)}
        .ww-root .panel-patterns .pattern-item.negative{color:rgba(255,255,255,.4)}
        .ww-root .panel-patterns .pattern-trend{font-size:11px;color:rgba(255,255,255,.45);font-style:italic;margin-bottom:4px}
        .ww-root .checklist-promoted{border-top:1px solid rgba(212,168,67,.25);padding-top:8px;margin-bottom:6px}
        .ww-root #export-btn{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:12px;z-index:9;width:32px;height:32px;
          border-radius:6px;border:1px solid rgba(212,168,67,.15);
          background:linear-gradient(180deg,rgba(40,28,18,.5) 0%,rgba(16,8,6,.6) 100%);
          backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
          color:rgba(212,168,67,.5);font-size:14px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,.2)}
        .ww-root #export-btn:active{transform:scale(.92)}
        .ww-root #toast{position:fixed;top:calc(20px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%) translateY(-80px);
          z-index:50;padding:10px 20px;border-radius:8px;
          background:linear-gradient(175deg,rgba(38,24,14,.92) 0%,rgba(16,8,6,.94) 100%);
          border:1px solid rgba(212,168,67,.25);color:rgba(255,255,255,.85);
          font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:.04em;
          box-shadow:0 4px 20px rgba(0,0,0,.4);transition:transform .35s cubic-bezier(.4,0,.2,1),opacity .3s;opacity:0;
          pointer-events:none;white-space:nowrap}
        .ww-root #toast.visible{transform:translateX(-50%) translateY(0);opacity:1}
        .ww-root #sound-btn{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:50px;z-index:9;width:32px;height:32px;
          border-radius:6px;border:1px solid rgba(212,168,67,.15);
          background:linear-gradient(180deg,rgba(40,28,18,.5) 0%,rgba(16,8,6,.6) 100%);
          backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
          color:rgba(212,168,67,.5);font-size:14px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,.2)}
        .ww-root #sound-btn:active{transform:scale(.92)}
        .ww-root #sound-btn.on{color:rgba(212,168,67,.85);border-color:rgba(212,168,67,.3)}
      `}</style>

      <div className="ww-root" ref={containerRef}>
        <div id="phone-frame">
          <img id="bg" src="/wheel/background.png" alt="" />
          <canvas id="wheel-canvas"></canvas>
          <div id="detail-panel">
            <div id="panel-cup-name"></div>
            <div id="panel-nudge"></div>
            <div id="panel-levels"></div>
            <div id="panel-activities"></div>
          </div>
          <div id="nudge-card">
            <div className="nudge-label">needs attention</div>
            <div className="nudge-cup" id="nudge-cup-name"></div>
            <div className="nudge-text" id="nudge-text"></div>
          </div>
          <button id="log-fab" aria-label="Log activity">+</button>
          <div id="log-panel">
            <div className="log-title">Log Activity</div>
            <div id="log-presets" className="preset-list"></div>
            <div id="log-confirm" className="log-confirm">
              <div className="confirm-title" id="confirm-activity-name"></div>
              <div className="cup-tags" id="confirm-cup-tags"></div>
              <div className="log-actions">
                <button className="btn-cancel" id="log-cancel">Cancel</button>
                <button className="btn-save" id="log-save">Save</button>
              </div>
            </div>
          </div>
          <button id="sound-btn" aria-label="Toggle sound">&#9835;</button>
          <button id="export-btn" aria-label="Export data">&#8681;</button>
        </div>
        <div id="toast"></div>
      </div>
    </>
  );
}
