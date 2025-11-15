/**
 * RouteStatsPanel - Consolidated stats panel with 3 columns
 * Displays: Sent • In Progress • Total Routes
 */

interface RouteStatsPanelProps {
  sent: number;
  inProgress: number;
  total: number;
}

export function RouteStatsPanel({ sent, inProgress, total }: RouteStatsPanelProps) {
  return (
    <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Soft teal glow */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: 'radial-gradient(circle at 50% 50%, hsl(180 70% 50%), transparent 70%)',
        }}
      />

      <div className="relative z-10 grid grid-cols-3 gap-6">
        {/* Sent */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🧗‍♀️</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Sent
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground font-heading">
            {sent}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center">
          <div className="h-16 w-px bg-border" />
        </div>

        {/* In Progress */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🔄</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              In Progress
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground font-heading">
            {inProgress}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center">
          <div className="h-16 w-px bg-border" />
        </div>

        {/* Total Routes */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🗺</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Total
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground font-heading">
            {total}
          </div>
        </div>
      </div>
    </div>
  );
}
