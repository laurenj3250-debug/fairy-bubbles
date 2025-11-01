import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Download, Moon, Bell, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { logout } from "@/lib/auth";

export default function Settings() {
  const { toast } = useToast();
  const sessionQuery = useSession();
  const accountName = sessionQuery.data?.user?.name ?? "GoalConnect user";
  const accountEmail = sessionQuery.data?.user?.email ?? "unknown@goalconnect.local";

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<UserSettings>) => 
      apiRequest("/api/settings", "POST", { ...settings, ...newSettings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"], exact: false });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.removeQueries({ predicate: query => query.queryKey[0] !== "session" });
      await sessionQuery.refetch();
      toast({
        title: "Signed out",
        description: "You have been logged out.",
      });
    },
    onError: error => {
      const message = error instanceof Error ? error.message : "Unable to log out.";
      toast({
        title: "Logout failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/export");
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gremlin-dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDarkModeToggle = (checked: boolean) => {
    updateSettingsMutation.mutate({ darkMode: checked });
    document.documentElement.classList.toggle("dark", checked);
  };

  const handleNotificationsToggle = (checked: boolean) => {
    updateSettingsMutation.mutate({ notifications: checked });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto p-4 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>

        <Card data-testid="account-settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Display name</Label>
              <span className="text-sm text-muted-foreground">{accountName}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Email</Label>
              <span className="text-sm text-muted-foreground">{accountEmail}</span>
            </div>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              className="w-full"
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Signing out…" : "Sign out"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Manage credentials in Supabase Auth. Ensure <code>APP_USER_EMAIL</code> (and optional name overrides) in your{" "}
              <code>.env</code> match the Supabase account you want to use.
            </p>
          </CardContent>
        </Card>

        <Card data-testid="appearance-settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="text-sm font-medium">
                Dark Mode
              </Label>
              <Switch
                id="dark-mode"
                checked={settings?.darkMode ?? true}
                onCheckedChange={handleDarkModeToggle}
                data-testid="switch-dark-mode"
              />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="notifications-settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="text-sm font-medium">
                Enable Notifications
              </Label>
              <Switch
                id="notifications"
                checked={settings?.notifications ?? true}
                onCheckedChange={handleNotificationsToggle}
                data-testid="switch-notifications"
              />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="data-settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Export all your habits, goals, and progress data
              </p>
              <Button
                variant="outline"
                onClick={handleExportData}
                className="w-full"
                data-testid="button-export-data"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
