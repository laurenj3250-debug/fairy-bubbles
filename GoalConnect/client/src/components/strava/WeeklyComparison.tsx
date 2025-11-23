import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Metric {
  id: string;
  label: string;
  thisWeek: number;
  lastWeek: number;
  unit: string;
  format?: "number" | "duration" | "distance";
}

interface WeeklyComparisonProps {
  metrics: Metric[];
}

function formatValue(value: number, format: Metric["format"], unit: string): string {
  switch (format) {
    case "duration": {
      if (value < 60) return `${Math.round(value)}${unit}`;
      const hours = Math.floor(value / 60);
      const mins = Math.round(value % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    case "distance":
      return `${value.toFixed(1)}${unit}`;
    default:
      return `${Math.round(value)}${unit ? ` ${unit}` : ""}`;
  }
}

function calculateChange(current: number, previous: number): { percentage: number; trend: "up" | "down" | "same" } {
  if (previous === 0 && current === 0) return { percentage: 0, trend: "same" };
  if (previous === 0) return { percentage: 100, trend: "up" };

  const change = ((current - previous) / previous) * 100;

  if (Math.abs(change) < 1) return { percentage: 0, trend: "same" };
  return {
    percentage: Math.round(change),
    trend: change > 0 ? "up" : "down",
  };
}

function TrendIndicator({ trend, percentage }: { trend: "up" | "down" | "same"; percentage: number }) {
  if (trend === "same") {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-sm">Same</span>
      </div>
    );
  }

  const isUp = trend === "up";

  return (
    <div className={cn(
      "flex items-center gap-1",
      isUp ? "text-green-500" : "text-muted-foreground"
    )}>
      {isUp ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">
        {isUp ? "+" : ""}{percentage}%
      </span>
    </div>
  );
}

function ComparisonBar({ thisWeek, lastWeek }: { thisWeek: number; lastWeek: number }) {
  const max = Math.max(thisWeek, lastWeek, 1);
  const thisWidth = (thisWeek / max) * 100;
  const lastWidth = (lastWeek / max) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-12">This</span>
        <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${thisWidth}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-12">Last</span>
        <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-muted-foreground/50 rounded-full transition-all duration-500"
            style={{ width: `${lastWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const { percentage, trend } = calculateChange(metric.thisWeek, metric.lastWeek);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-card/40 backdrop-blur-sm border border-card-border">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
        <TrendIndicator trend={trend} percentage={percentage} />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">
          {formatValue(metric.thisWeek, metric.format, metric.unit)}
        </span>
        <span className="text-sm text-muted-foreground">
          vs {formatValue(metric.lastWeek, metric.format, metric.unit)}
        </span>
      </div>

      <ComparisonBar thisWeek={metric.thisWeek} lastWeek={metric.lastWeek} />
    </div>
  );
}

export function WeeklyComparison({ metrics }: WeeklyComparisonProps) {
  // Calculate overall trend
  const overallChange = metrics.reduce((acc, m) => {
    const { percentage, trend } = calculateChange(m.thisWeek, m.lastWeek);
    return acc + (trend === "up" ? percentage : trend === "down" ? -percentage : 0);
  }, 0) / metrics.length;

  const overallTrend = overallChange > 5 ? "up" : overallChange < -5 ? "down" : "same";

  // Motivational messages based on overall performance
  const getMessage = () => {
    if (overallTrend === "up") {
      const messages = [
        "Crushing it this week!",
        "Great progress!",
        "Keep up the momentum!",
        "You're on fire!",
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    if (overallTrend === "same") {
      return "Staying consistent!";
    }
    // Down - but positive framing
    return "Every step counts. Keep going!";
  };

  return (
    <Card className="bg-card/40 backdrop-blur-sm border-card-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">This Week vs Last</CardTitle>
          <span className={cn(
            "text-sm font-medium",
            overallTrend === "up" && "text-green-500",
            overallTrend === "same" && "text-muted-foreground",
            overallTrend === "down" && "text-muted-foreground"
          )}>
            {getMessage()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
