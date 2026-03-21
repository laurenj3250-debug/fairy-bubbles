import { differenceInDays } from 'date-fns';

export function SundownCountdown() {
  const start = new Date(2025, 6, 14);
  const end = new Date(2028, 6, 14);
  const now = new Date();
  const total = differenceInDays(end, start);
  const elapsed = Math.max(0, differenceInDays(now, start));
  const remaining = Math.max(0, differenceInDays(end, now));
  const pct = Math.min(100, (elapsed / total) * 100);
  const months = Math.floor(remaining / 30.44);
  const years = Math.floor(months / 12);
  const monthsRem = months % 12;

  return (
    <div className="sd-residency-strip">
      <span className="sd-icon">🎓</span>
      <div className="sd-bar-wrap">
        <div className="sd-bar-fill" style={{ width: `${pct}%` }} />
        <div className="sd-marker" style={{ left: '33.33%' }} />
        <div className="sd-marker" style={{ left: '66.66%' }} />
      </div>
      <div>
        <div className="sd-days">
          {remaining <= 0 ? 'Done!' : remaining.toLocaleString()}
        </div>
        <div className="sd-time-left">
          {remaining <= 0
            ? '🎉'
            : `${years > 0 ? `${years}y ` : ''}${monthsRem}m left`}
        </div>
      </div>
    </div>
  );
}
