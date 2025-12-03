/**
 * Import Settings Page
 *
 * Configure data imports from Apple Health and Kilter Board.
 * Supports file uploads for Apple Health and API connection for Kilter Board.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  ArrowLeft,
  Watch,
  Mountain,
  Upload,
  RefreshCw,
  Check,
  X,
  Loader2,
  Link as LinkIcon,
  Unlink,
  FileUp,
  Clock,
  Activity,
  Bike,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useHabitMappings, type HabitMapping, type CreateMappingInput } from "@/hooks/useHabitMappings";
import { Plus, Trash2 } from "lucide-react";

// Types
interface KilterBoardStatus {
  connected: boolean;
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  syncFrequency: string | null;
  autoCompleteHabits: boolean | null;
}

interface ClimbingSession {
  id: number;
  sessionDate: string;
  problemsSent: number;
  problemsAttempted: number;
  maxGrade: string | null;
  boardAngle: number | null;
}

interface KilterStats {
  totalSessions: number;
  totalProblemsSent: number;
  totalProblemsAttempted: number;
  highestGrade: string | null;
  averageProblemsPerSession: number;
}

interface AppleHealthUploadResult {
  success: boolean;
  workoutsImported: number;
  duplicatesSkipped: number;
  habitsMatched: number;
}

interface StravaStatus {
  connected: boolean;
  configured: boolean;
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
}

interface StravaActivity {
  id: number;
  workoutType: string;
  startTime: string;
  durationMinutes: number;
  distanceKm: string;
  caloriesBurned: number | null;
  metadata: {
    name: string;
    sport_type: string;
    total_elevation_gain?: number;
  };
}

interface StravaStats {
  strava: {
    allTime: {
      runs: { count: number; distanceKm: number; durationHours: number };
      rides: { count: number; distanceKm: number; durationHours: number };
      swims: { count: number; distanceKm: number; durationHours: number };
    };
  };
  local: {
    totalActivities: number;
    totalDuration: number;
    totalCalories: number;
  };
}

export default function ImportSettings() {
  const [activeTab, setActiveTab] = useState("apple-health");

  // Kilter Board state
  const [kilterUsername, setKilterUsername] = useState("");
  const [kilterPassword, setKilterPassword] = useState("");

  // Apple Health state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Auto-complete mapping state
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [newMappingHabitId, setNewMappingHabitId] = useState<number | null>(null);
  const [newMappingTypes, setNewMappingTypes] = useState<string[]>([]);
  const [newMappingMinDuration, setNewMappingMinDuration] = useState<number>(0);

  // Fetch habits for mapping
  const { data: habits = [] } = useQuery<Array<{ id: number; title: string; icon: string }>>({
    queryKey: ["/api/habits"],
  });

  // Fetch habit mappings
  const {
    mappings,
    activityTypes,
    isLoading: isLoadingMappings,
    createMapping,
    deleteMapping,
    isCreating,
    isDeleting,
  } = useHabitMappings();

  // Fetch Kilter Board connection status
  const { data: kilterStatus, isLoading: isLoadingStatus } = useQuery<KilterBoardStatus>({
    queryKey: ["/api/import/kilter-board/status"],
    refetchInterval: false,
  });

  // Fetch Kilter Board stats
  const { data: kilterStats } = useQuery<KilterStats>({
    queryKey: ["/api/import/kilter-board/stats"],
    enabled: kilterStatus?.connected === true,
  });

  // Fetch recent sessions
  const { data: recentSessions } = useQuery<{ sessions: ClimbingSession[] }>({
    queryKey: ["/api/import/kilter-board/sessions"],
    enabled: kilterStatus?.connected === true,
  });

  // Connect to Kilter Board
  const connectMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      return await apiRequest("/api/import/kilter-board/connect", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/import/kilter-board/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/import/kilter-board/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/import/kilter-board/sessions"] });
      setKilterUsername("");
      setKilterPassword("");
    },
  });

  // Disconnect from Kilter Board
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/import/kilter-board/disconnect", "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/import/kilter-board/status"] });
    },
  });

  // Sync Kilter Board data
  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/import/kilter-board/sync", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/import/kilter-board/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/import/kilter-board/sessions"] });
    },
  });

  // Upload Apple Health export
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import/apple-health/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json() as Promise<AppleHealthUploadResult>;
    },
    onSuccess: () => {
      setSelectedFile(null);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
    },
  });

  // ============= STRAVA =============
  // Fetch Strava connection status
  const { data: stravaStatus, isLoading: isLoadingStravaStatus } = useQuery<StravaStatus>({
    queryKey: ["/api/import/strava/status"],
    refetchInterval: false,
  });

  // Fetch Strava activities
  const { data: stravaActivities } = useQuery<{ activities: StravaActivity[] }>({
    queryKey: ["/api/import/strava/activities"],
    enabled: stravaStatus?.connected === true,
  });

  // Fetch Strava stats
  const { data: stravaStats } = useQuery<StravaStats>({
    queryKey: ["/api/import/strava/stats"],
    enabled: stravaStatus?.connected === true,
  });

  // Get Strava auth URL and redirect
  const stravaAuthMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/import/strava/auth", "GET") as { authUrl: string };
      return response;
    },
    onSuccess: (data) => {
      // Redirect to Strava OAuth
      window.location.href = data.authUrl;
    },
  });

  // Disconnect from Strava
  const stravaDisconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/import/strava/disconnect", "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/import/strava/status"] });
    },
  });

  // Sync Strava data
  const stravaSyncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/import/strava/sync", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/import/strava/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/import/strava/stats"] });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (kilterUsername && kilterPassword) {
      connectMutation.mutate({ username: kilterUsername, password: kilterPassword });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/settings">
            <Button variant="outline" size="icon" className="mb-4">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Import Data
          </h1>
          <p className="text-muted-foreground">
            Connect external sources to auto-complete habits and track stats
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-background/40 backdrop-blur-sm">
            <TabsTrigger value="apple-health" className="flex items-center gap-2">
              <Watch className="w-4 h-4" />
              Apple Health
            </TabsTrigger>
            <TabsTrigger value="kilter-board" className="flex items-center gap-2">
              <Mountain className="w-4 h-4" />
              Kilter Board
            </TabsTrigger>
            <TabsTrigger value="strava" className="flex items-center gap-2">
              <Bike className="w-4 h-4" />
              Strava
            </TabsTrigger>
            <TabsTrigger value="auto-complete" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Auto-Complete
            </TabsTrigger>
          </TabsList>

          {/* Apple Health Tab */}
          <TabsContent value="apple-health" className="space-y-6">
            <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Health Export
                </CardTitle>
                <CardDescription>
                  Export your data from the Apple Health app and upload the XML file here
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-foreground/20 rounded-xl p-8 text-center transition-colors hover:border-foreground/40">
                  <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <Label
                      htmlFor="file-upload"
                      className="cursor-pointer text-primary hover:underline"
                    >
                      Click to select file
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      or drag and drop your export.xml file
                    </p>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xml"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={uploadMutation.isPending}
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {uploadMutation.isSuccess && uploadMutation.data && (
                  <div className="p-4 bg-mountain-alpine-meadow/20 border border-mountain-alpine-meadow/30 rounded-lg">
                    <div className="flex items-center gap-2 text-mountain-alpine-meadow mb-2">
                      <Check className="w-5 h-5" />
                      <span className="font-semibold">Upload Complete</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Workouts</p>
                        <p className="font-semibold">{uploadMutation.data.workoutsImported}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duplicates</p>
                        <p className="font-semibold">{uploadMutation.data.duplicatesSkipped}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Habits Matched</p>
                        <p className="font-semibold">{uploadMutation.data.habitsMatched}</p>
                      </div>
                    </div>
                  </div>
                )}

                {uploadMutation.isError && (
                  <div className="p-4 bg-destructive/20 border border-destructive/30 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive">
                      <X className="w-5 h-5" />
                      <span className="font-semibold">Upload Failed</span>
                    </div>
                    <p className="text-sm mt-1 text-muted-foreground">
                      {uploadMutation.error instanceof Error
                        ? uploadMutation.error.message
                        : "An error occurred"}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-foreground/10">
                  <h4 className="font-semibold mb-2">How to export from Apple Health</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open the Health app on your iPhone</li>
                    <li>Tap your profile picture in the top right</li>
                    <li>Scroll down and tap "Export All Health Data"</li>
                    <li>Wait for the export to complete, then share the zip file</li>
                    <li>Extract the zip and upload export.xml here</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kilter Board Tab */}
          <TabsContent value="kilter-board" className="space-y-6">
            {/* Connection Status Card */}
            <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Connection Status
                </CardTitle>
                <CardDescription>
                  Connect your Kilter Board account to sync climbing data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStatus ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking connection...
                  </div>
                ) : kilterStatus?.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-mountain-alpine-meadow/20 border border-mountain-alpine-meadow/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-mountain-alpine-meadow animate-pulse" />
                        <div>
                          <p className="font-semibold text-mountain-alpine-meadow">Connected</p>
                          <p className="text-sm text-muted-foreground">
                            Kilter Board account linked
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectMutation.mutate()}
                        disabled={disconnectMutation.isPending}
                      >
                        {disconnectMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4" />
                        )}
                        Disconnect
                      </Button>
                    </div>

                    {kilterStatus.lastSyncAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Last synced: {formatDateTime(kilterStatus.lastSyncAt)}
                      </div>
                    )}

                    <Button
                      onClick={() => syncMutation.mutate()}
                      disabled={syncMutation.isPending}
                      className="w-full"
                    >
                      {syncMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Sync Now
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleConnect} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="kilter-username">Username or Email</Label>
                      <Input
                        id="kilter-username"
                        type="text"
                        value={kilterUsername}
                        onChange={(e) => setKilterUsername(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kilter-password">Password</Label>
                      <Input
                        id="kilter-password"
                        type="password"
                        value={kilterPassword}
                        onChange={(e) => setKilterPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    {connectMutation.isError && (
                      <div className="p-3 bg-destructive/20 border border-destructive/30 rounded-lg text-sm">
                        <span className="text-destructive">
                          {connectMutation.error instanceof Error
                            ? connectMutation.error.message
                            : "Connection failed"}
                        </span>
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={connectMutation.isPending}
                    >
                      {connectMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          Connect Account
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Your credentials are used only to authenticate with Kilter Board
                      and are not stored.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            {kilterStatus?.connected && kilterStats && (
              <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Climbing Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{kilterStats.totalSessions}</p>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{kilterStats.totalProblemsSent}</p>
                      <p className="text-sm text-muted-foreground">Problems Sent</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">
                        {kilterStats.highestGrade || "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">Highest Grade</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">
                        {(kilterStats.averageProblemsPerSession ?? 0).toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg per Session</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Sessions */}
            {kilterStatus?.connected && recentSessions?.sessions && recentSessions.sessions.length > 0 && (
              <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentSessions.sessions.slice(0, 5).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{formatDate(session.sessionDate)}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.problemsSent} sends
                            {session.maxGrade && ` • Max: ${session.maxGrade}`}
                            {session.boardAngle && ` • ${session.boardAngle}°`}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {session.problemsSent}/{session.problemsAttempted}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Strava Tab */}
          <TabsContent value="strava" className="space-y-6">
            {/* Connection Status Card */}
            <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Connection Status
                </CardTitle>
                <CardDescription>
                  Connect your Strava account to sync running, cycling, and other activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStravaStatus ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking connection...
                  </div>
                ) : !stravaStatus?.configured ? (
                  <div className="p-4 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-200">
                      Strava integration is not configured. Please add STRAVA_CLIENT_ID and
                      STRAVA_CLIENT_SECRET environment variables.
                    </p>
                  </div>
                ) : stravaStatus?.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                        <div>
                          <p className="font-semibold text-orange-400">Connected</p>
                          <p className="text-sm text-muted-foreground">
                            Strava account linked
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stravaDisconnectMutation.mutate()}
                        disabled={stravaDisconnectMutation.isPending}
                      >
                        {stravaDisconnectMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4" />
                        )}
                        Disconnect
                      </Button>
                    </div>

                    {stravaStatus.lastSyncAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Last synced: {formatDateTime(stravaStatus.lastSyncAt)}
                      </div>
                    )}

                    <Button
                      onClick={() => stravaSyncMutation.mutate()}
                      disabled={stravaSyncMutation.isPending}
                      className="w-full"
                    >
                      {stravaSyncMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Sync Now
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Connect your Strava account to import running, cycling, swimming, and other
                      activities automatically.
                    </p>
                    <Button
                      onClick={() => stravaAuthMutation.mutate()}
                      disabled={stravaAuthMutation.isPending}
                      className="w-full bg-[#FC4C02] hover:bg-[#E34402]"
                    >
                      {stravaAuthMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Connect with Strava
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      You will be redirected to Strava to authorize access.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            {stravaStatus?.connected && stravaStats && (
              <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activity Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-orange-500/20 rounded-lg">
                      <p className="text-2xl font-bold">{stravaStats.strava.allTime.runs.count}</p>
                      <p className="text-sm text-muted-foreground">Runs</p>
                      <p className="text-xs text-orange-400">
                        {stravaStats.strava.allTime.runs.distanceKm.toFixed(0)} km
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                      <p className="text-2xl font-bold">{stravaStats.strava.allTime.rides.count}</p>
                      <p className="text-sm text-muted-foreground">Rides</p>
                      <p className="text-xs text-blue-400">
                        {stravaStats.strava.allTime.rides.distanceKm.toFixed(0)} km
                      </p>
                    </div>
                    <div className="text-center p-4 bg-cyan-500/20 rounded-lg">
                      <p className="text-2xl font-bold">{stravaStats.strava.allTime.swims.count}</p>
                      <p className="text-sm text-muted-foreground">Swims</p>
                      <p className="text-xs text-cyan-400">
                        {stravaStats.strava.allTime.swims.distanceKm.toFixed(0)} km
                      </p>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">
                      {stravaStats.local?.totalActivities || 0} activities imported
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stravaStats.local?.totalDuration
                        ? `${Math.round(stravaStats.local.totalDuration / 60)} hours total`
                        : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activities */}
            {stravaStatus?.connected && stravaActivities?.activities && stravaActivities.activities.length > 0 && (
              <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stravaActivities.activities.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{activity.metadata.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(activity.startTime)}
                            {" • "}
                            {activity.durationMinutes} min
                            {activity.distanceKm && ` • ${activity.distanceKm} km`}
                          </p>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {activity.workoutType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Auto-Complete Tab */}
          <TabsContent value="auto-complete" className="space-y-6">
            <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Habit Auto-Complete Rules
                </CardTitle>
                <CardDescription>
                  Configure which activities from Strava automatically complete your habits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Mappings */}
                {mappings.length > 0 && (
                  <div className="space-y-3">
                    {mappings.map((mapping) => (
                      <div
                        key={mapping.id}
                        className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{mapping.habitIcon}</span>
                          <div>
                            <p className="font-medium">{mapping.habitTitle}</p>
                            <p className="text-sm text-muted-foreground">
                              {(mapping.matchCriteria.activityTypes || []).join(", ") || "Any activity"}
                              {mapping.matchCriteria.minDurationMinutes && ` • ${mapping.matchCriteria.minDurationMinutes}+ min`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {mapping.sourceType}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMapping(mapping.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Mapping */}
                {!showAddMapping ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowAddMapping(true)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Auto-Complete Rule
                  </Button>
                ) : (
                  <div className="p-4 bg-card/50 rounded-lg border border-border/50 space-y-4">
                    <div className="space-y-2">
                      <Label>Habit</Label>
                      <select
                        className="w-full p-2 bg-background/50 border border-border rounded-md"
                        value={newMappingHabitId || ""}
                        onChange={(e) => setNewMappingHabitId(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Select a habit...</option>
                        {habits
                          .filter(h => !mappings.some(m => m.habitId === h.id && m.sourceType === "strava"))
                          .map((habit) => (
                            <option key={habit.id} value={habit.id}>
                              {habit.icon} {habit.title}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Activity Types (select multiple)</Label>
                      <div className="flex flex-wrap gap-2">
                        {activityTypes.map((type) => (
                          <Badge
                            key={type}
                            variant={newMappingTypes.includes(type) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              if (newMappingTypes.includes(type)) {
                                setNewMappingTypes(newMappingTypes.filter(t => t !== type));
                              } else {
                                setNewMappingTypes([...newMappingTypes, type]);
                              }
                            }}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Minimum Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={newMappingMinDuration || ""}
                        onChange={(e) => setNewMappingMinDuration(parseInt(e.target.value) || 0)}
                        placeholder="0 (any duration)"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          if (!newMappingHabitId) return;
                          await createMapping({
                            habitId: newMappingHabitId,
                            sourceType: "strava",
                            matchCriteria: {
                              activityTypes: newMappingTypes.length > 0 ? newMappingTypes : undefined,
                              minDurationMinutes: newMappingMinDuration > 0 ? newMappingMinDuration : undefined,
                            },
                          });
                          setShowAddMapping(false);
                          setNewMappingHabitId(null);
                          setNewMappingTypes([]);
                          setNewMappingMinDuration(0);
                        }}
                        disabled={!newMappingHabitId || isCreating}
                      >
                        {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        Create Rule
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowAddMapping(false);
                          setNewMappingHabitId(null);
                          setNewMappingTypes([]);
                          setNewMappingMinDuration(0);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {mappings.length === 0 && !showAddMapping && (
                  <div className="text-center py-8 text-muted-foreground">
                    <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No auto-complete rules configured yet.</p>
                    <p className="text-xs mt-1">
                      Create rules to automatically mark habits complete when you log activities on Strava.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">How Auto-Complete Works</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>1. Connect your Strava account in the Strava tab</p>
                <p>2. Create auto-complete rules above linking habits to activity types</p>
                <p>3. When you sync Strava, matching activities will automatically complete your habits</p>
                <p>4. Manual habit entries won't be overwritten by auto-complete</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
