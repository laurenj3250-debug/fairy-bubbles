import { getGreeting, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Gem } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { UserPoints } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const greeting = getGreeting();
  const today = formatDate(new Date());

  const { data: points } = useQuery<UserPoints>({
    queryKey: ["/api/points"],
  });

  const { user } = useAuth();
  const sessionName = user?.name?.trim();
  const sessionEmail = user?.email ?? "";
  const resolvedName = (userName ?? sessionName ?? sessionEmail ?? "User").trim() || "User";
  const avatarInitials = (resolvedName || sessionEmail || "U").slice(0, 2).toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 h-14 bg-background/95 backdrop-blur border-b flex items-center justify-between px-4"
      data-testid="dashboard-header"
    >
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold" data-testid="greeting-text">
          {greeting}, {resolvedName}
        </h1>
        <p className="text-xs text-muted-foreground" data-testid="current-date">
          {today}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="gap-1.5" data-testid="badge-points">
          <Gem className="w-3.5 h-3.5" />
          <span className="font-semibold">{points?.available ?? 0}</span>
        </Badge>
        
        <Avatar className="w-10 h-10" data-testid="user-avatar">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {avatarInitials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
