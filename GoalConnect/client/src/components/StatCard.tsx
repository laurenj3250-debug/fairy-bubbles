import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  className?: string;
}

export function StatCard({ icon: Icon, value, label, className }: StatCardProps) {
  return (
    <Card className={cn("rounded-3xl", className)} data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="flex flex-col gap-2 p-6">
        <div className="p-2 rounded-xl bg-primary/10 w-fit">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="text-3xl font-bold tabular-nums" data-testid="stat-value">{value}</div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
