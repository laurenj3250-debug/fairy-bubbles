interface RecentStatsProps {
  today: string;
  week: string;
  avg: string;
}

export function RecentStats({ today, week, avg }: RecentStatsProps) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col bg-card/70 backdrop-blur-xl">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-2">RECENT</div>
      <div className="flex flex-col gap-1 mt-1">
        <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Today</span><span className="font-semibold">{today}</span></div>
        <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">This week</span><span className="font-semibold">{week}</span></div>
        <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Avg/week</span><span className="font-semibold">{avg}</span></div>
      </div>
    </div>
  );
}
