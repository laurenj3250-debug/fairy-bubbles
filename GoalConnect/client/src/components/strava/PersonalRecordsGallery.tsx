import { motion } from "framer-motion";
import { Trophy, Bike, FootprintsIcon, Mountain, Zap, Clock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PRRecord {
  id: string;
  type: "distance" | "time" | "pace" | "elevation" | "power";
  activityType: string; // "Run", "Ride", etc.
  value: number;
  unit: string;
  date: string; // ISO date
  previousValue?: number;
  isNew?: boolean;
}

interface PersonalRecordsGalleryProps {
  records: PRRecord[];
  onRecordClick?: (record: PRRecord) => void;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Run: FootprintsIcon,
  Ride: Bike,
  Hike: Mountain,
  default: Trophy,
};

const recordTypeLabels: Record<PRRecord["type"], string> = {
  distance: "Longest",
  time: "Duration",
  pace: "Fastest Pace",
  elevation: "Most Elevation",
  power: "Max Power",
};

function formatValue(value: number, type: PRRecord["type"], unit: string): string {
  switch (type) {
    case "pace": {
      // Pace is in seconds per km/mile - convert to min:sec
      const minutes = Math.floor(value / 60);
      const seconds = Math.round(value % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}${unit}`;
    }
    case "time": {
      // Time in minutes
      if (value < 60) return `${Math.round(value)}${unit}`;
      const hours = Math.floor(value / 60);
      const mins = Math.round(value % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    case "distance":
      return `${value.toFixed(1)}${unit}`;
    default:
      return `${Math.round(value)}${unit}`;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PRCard({ record, onClick }: { record: PRRecord; onClick?: () => void }) {
  const Icon = typeIcons[record.activityType] || typeIcons.default;
  const improvement = record.previousValue
    ? ((record.value - record.previousValue) / record.previousValue) * 100
    : null;

  return (
    <motion.button
      className={cn(
        "relative flex flex-col gap-2 p-4 rounded-xl text-left",
        "bg-card/40 backdrop-blur-sm border border-card-border",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        record.isNew && "ring-2 ring-yellow-400/50"
      )}
      onClick={onClick}
      initial={record.isNew ? { scale: 0.9, opacity: 0 } : false}
      animate={record.isNew ? { scale: 1, opacity: 1 } : false}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* New PR Badge */}
      {record.isNew && (
        <motion.div
          className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <Crown className="h-3 w-3" />
          <span className="text-xs font-bold uppercase">New PR</span>
        </motion.div>
      )}

      {/* Header with icon and activity type */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "p-2 rounded-lg",
          record.isNew ? "bg-yellow-400/20" : "bg-muted/50"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            record.isNew ? "text-yellow-400" : "text-muted-foreground"
          )} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground">
            {recordTypeLabels[record.type]}
          </span>
          <span className="text-xs text-muted-foreground/70">
            {record.activityType}
          </span>
        </div>
      </div>

      {/* Value */}
      <div className={cn(
        "text-2xl font-bold",
        record.isNew && "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
      )}>
        {formatValue(record.value, record.type, record.unit)}
      </div>

      {/* Footer with date and improvement */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(record.date)}</span>
        {improvement !== null && improvement > 0 && (
          <span className="text-green-500 font-medium">
            +{improvement.toFixed(1)}%
          </span>
        )}
      </div>
    </motion.button>
  );
}

export function PersonalRecordsGallery({ records, onRecordClick }: PersonalRecordsGalleryProps) {
  if (records.length === 0) {
    return (
      <Card className="bg-card/40 backdrop-blur-sm border-card-border">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Trophy className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-medium">No Personal Records Yet</p>
            <p className="text-sm text-muted-foreground">
              Complete activities to set your first records!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort: new PRs first, then by date
  const sortedRecords = [...records].sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <Card className="bg-card/40 backdrop-blur-sm border-card-border">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <CardTitle className="text-lg">Personal Records</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedRecords.map((record) => (
            <PRCard
              key={record.id}
              record={record}
              onClick={() => onRecordClick?.(record)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
