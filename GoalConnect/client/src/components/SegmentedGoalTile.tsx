import { goalIcon } from "@/lib/goalIcon";
import { Pencil, Trash2, Plus } from "lucide-react";

const RING_SIZE = 108;
const VIEW_BOX = 140;
const CX = 70;
const CY = 70;
const R = 56;
const CIRC = 2 * Math.PI * R;
const SEGMENT_FALLBACK_THRESHOLD = 30;

interface SegmentedGoalTileProps {
  title: string;
  current: number;
  target: number;
  category: string;
  /** When true, ring uses urgent (red-orange) gradient and tile has overdue treatment */
  urgent?: boolean;
  /** Optional small label rendered below the title (e.g., "12d late", "Apr 30", "Complete") */
  dueLabel?: string;
  /** Optional click handler on the tile body. Falls through to onAddProgress if omitted. */
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddProgress?: () => void;
  /** Disables the +1 button (e.g., when increment mutation is pending) */
  addProgressPending?: boolean;
  /** Test id suffix */
  testId?: string;
}

function ContinuousRing({ filled, total, urgent }: { filled: number; total: number; urgent: boolean }) {
  const ratio = total > 0 ? Math.min(filled / total, 1) : 0;
  const dashOffset = CIRC * (1 - ratio);
  const stroke = urgent ? "url(#segGradUrgent)" : "url(#segGrad)";
  return (
    <svg viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`} style={{ transform: "rotate(-90deg)" }} className="absolute inset-0 w-full h-full">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(225,164,92,0.12)" strokeWidth={14} />
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={stroke}
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={dashOffset}
        style={{ filter: "drop-shadow(0 0 4px rgba(225,164,92,0.45))" }}
      />
    </svg>
  );
}

function SegmentedRing({ filled, total, urgent }: { filled: number; total: number; urgent: boolean }) {
  const segLen = CIRC / total;
  const gap = total <= 12 ? 4 : total <= 20 ? 2.5 : 1.5;
  const dash = Math.max(2, segLen - gap);
  const dasharray = `${dash} ${CIRC - dash}`;

  return (
    <svg viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`} style={{ transform: "rotate(-90deg)" }} className="absolute inset-0 w-full h-full">
      {Array.from({ length: total }, (_, i) => {
        const on = i < filled;
        const stroke = on ? (urgent ? "url(#segGradUrgent)" : "url(#segGrad)") : "rgba(225,164,92,0.12)";
        return (
          <circle
            key={i}
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={stroke}
            strokeWidth={14}
            strokeDasharray={dasharray}
            strokeDashoffset={-(i * segLen)}
            style={on ? { filter: "drop-shadow(0 0 3px rgba(225,164,92,0.4))" } : undefined}
          />
        );
      })}
    </svg>
  );
}

export function SegmentedGoalTile({
  title,
  current,
  target,
  category,
  urgent = false,
  dueLabel,
  onClick,
  onEdit,
  onDelete,
  onAddProgress,
  addProgressPending = false,
  testId,
}: SegmentedGoalTileProps) {
  const total = Math.max(1, target);
  const filled = Math.max(0, Math.min(current, total));
  const isComplete = filled >= total;
  const useSegments = total <= SEGMENT_FALLBACK_THRESHOLD;
  const fracText = isComplete ? "Complete" : `${filled} of ${total}`;

  const tileBorder = urgent
    ? "border-[rgba(200,100,90,0.5)] bg-[rgba(90,30,30,0.28)]"
    : isComplete
    ? "border-[rgba(150,210,170,0.35)] bg-[rgba(30,60,40,0.18)]"
    : "border-[rgba(255,200,140,0.12)] hover:border-[rgba(255,200,140,0.35)] bg-[var(--sd-face-bg)]";

  const handleClick = onClick ?? onAddProgress;

  return (
    <div
      role={handleClick ? "button" : undefined}
      tabIndex={handleClick ? 0 : -1}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (handleClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative rounded-[16px] border p-4 pb-3 transition-all flex flex-col items-center text-center gap-2 min-h-[220px] ${handleClick ? "cursor-pointer hover:-translate-y-0.5" : ""} ${tileBorder}`}
      data-testid={testId}
    >
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {!isComplete && onAddProgress && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddProgress(); }}
            disabled={addProgressPending}
            aria-label="Add progress"
            title="Add progress"
            data-testid={testId ? `${testId}-increment` : undefined}
            className="w-7 h-7 rounded-md bg-[rgba(225,164,92,0.1)] border border-[rgba(225,164,92,0.25)] text-[var(--sd-text-accent)] hover:bg-[rgba(225,164,92,0.2)] disabled:opacity-50 flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            aria-label="Edit"
            title="Edit"
            data-testid={testId ? `${testId}-edit` : undefined}
            className="w-7 h-7 rounded-md bg-[rgba(15,10,8,0.5)] border border-[rgba(225,164,92,0.2)] text-[var(--sd-text-muted)] hover:text-[var(--sd-text-primary)] hover:bg-black/60 flex items-center justify-center"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete"
            title="Delete"
            data-testid={testId ? `${testId}-delete` : undefined}
            className="w-7 h-7 rounded-md bg-[rgba(15,10,8,0.5)] border border-[rgba(200,80,80,0.3)] text-[rgba(220,120,120,0.8)] hover:text-red-300 hover:bg-black/60 flex items-center justify-center"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        {useSegments ? (
          <SegmentedRing filled={filled} total={total} urgent={urgent} />
        ) : (
          <ContinuousRing filled={filled} total={total} urgent={urgent} />
        )}
        <div className="absolute inset-0 grid place-items-center text-[34px] leading-none select-none">
          {goalIcon(category)}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 px-2.5 py-0.5 rounded-full whitespace-nowrap font-serif text-[13px] font-semibold text-[var(--sd-text-accent)] bg-[rgba(15,10,8,0.85)] border border-[rgba(225,164,92,0.3)]">
          {fracText}
        </div>
      </div>

      <div className="text-[14px] font-medium leading-snug text-[var(--sd-text-primary)] mt-1.5 px-1">
        {title}
      </div>

      {dueLabel && (
        <div
          className={`mt-auto text-[12px] uppercase tracking-[0.1em] font-semibold ${
            urgent ? "text-[#e4a89b]" : isComplete ? "text-[#a3d9b7]" : "text-[var(--sd-text-muted)]"
          }`}
        >
          {dueLabel}
        </div>
      )}
    </div>
  );
}

export function SegmentedRingGradients() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
      <defs>
        <linearGradient id="segGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,210,140,1)" />
          <stop offset="100%" stopColor="rgba(200,131,73,1)" />
        </linearGradient>
        <linearGradient id="segGradUrgent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(240,160,140,1)" />
          <stop offset="100%" stopColor="rgba(200,100,90,1)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
