import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mountain, Globe, MapPin, Lock, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Region {
  id: number;
  name: string;
  continent: string;
  description: string;
}

interface Mountain {
  id: number;
  name: string;
  elevation: number;
  country: string;
  mountainRange: string;
  continent: string;
  difficultyTier: string;
  requiredClimbingLevel: number;
  description: string;
  firstAscentYear: number;
  fatalityRate: number;
  bestSeasonStart: string;
  bestSeasonEnd: string;
  regionId: number;
}

interface ClimbingStats {
  climbingLevel: number;
  summits: number;
  currentStreak: number;
  totalXp: number;
  totalDistance?: number;
  totalElevationGain?: number;
}

export default function WorldMap() {
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);

  const { data: regions = [], isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["/api/mountains/regions"],
  });

  const { data: allMountains = [], isLoading: mountainsLoading } = useQuery<Mountain[]>({
    queryKey: ["/api/mountains"],
  });

  const { data: stats } = useQuery<ClimbingStats>({
    queryKey: ["/api/climbing/stats"],
  });

  const filteredMountains = selectedRegion
    ? allMountains.filter((m) => m.regionId === selectedRegion)
    : allMountains;

  const tierColors: Record<string, string> = {
    beginner: "bg-green-500/20 text-green-300 border-green-500/40",
    intermediate: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    advanced: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    expert: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    elite: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  };

  const canAttempt = (mountain: Mountain) => {
    if (!stats) return false;
    return stats.climbingLevel >= mountain.requiredClimbingLevel;
  };

  if (regionsLoading || mountainsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="animate-pulse text-lg">Loading World Map...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Globe className="w-8 h-8" />
              World Map
            </h1>
            <p className="text-muted-foreground">
              {allMountains.length} mountains across {regions.length} regions
            </p>
          </div>
          {stats && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Climbing Level</div>
              <div className="text-2xl font-bold">{stats.climbingLevel}</div>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats?.summits || 0}</div>
                <div className="text-sm text-muted-foreground">Summits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {allMountains.filter((m) => canAttempt(m)).length}
                </div>
                <div className="text-sm text-muted-foreground">Unlocked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {stats?.totalElevationGain ? (stats.totalElevationGain / 1000).toFixed(1) : 0} km
                </div>
                <div className="text-sm text-muted-foreground">Elevation Gained</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {stats?.totalDistance ? (stats.totalDistance / 1000).toFixed(1) : 0} km
                </div>
                <div className="text-sm text-muted-foreground">Distance Traveled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regions & Mountains */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto gap-2">
            <TabsTrigger value="all" onClick={() => setSelectedRegion(null)}>
              All Regions
            </TabsTrigger>
            {regions.map((region) => (
              <TabsTrigger
                key={region.id}
                value={`region-${region.id}`}
                onClick={() => setSelectedRegion(region.id)}
              >
                {region.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedRegion ? `region-${selectedRegion}` : "all"} className="space-y-6">
            {/* Display selected region info */}
            {selectedRegion && (
              <Card className="bg-slate-900/40 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-6 h-6" />
                    {regions.find((r) => r.id === selectedRegion)?.name}
                  </CardTitle>
                  <CardDescription>
                    {regions.find((r) => r.id === selectedRegion)?.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Mountains Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMountains
                .sort((a, b) => a.requiredClimbingLevel - b.requiredClimbingLevel)
                .map((mountain) => {
                  const unlocked = canAttempt(mountain);

                  return (
                    <Card
                      key={mountain.id}
                      className={`bg-slate-900/40 border-slate-700/50 transition-all hover:bg-slate-900/60 ${
                        !unlocked ? "opacity-60" : ""
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Mountain className="w-5 h-5" />
                            {mountain.name}
                            {!unlocked && <Lock className="w-4 h-4 text-amber-400" />}
                          </CardTitle>
                          <Badge className={tierColors[mountain.difficultyTier]} variant="outline">
                            {mountain.difficultyTier}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm space-y-1">
                          <div className="font-medium text-white">{mountain.elevation.toLocaleString()} m</div>
                          <div>{mountain.country}</div>
                          <div className="text-xs">{mountain.mountainRange}</div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">{mountain.description}</p>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Required Level:</span>
                            <span className={unlocked ? "text-green-400" : "text-amber-400 flex items-center gap-1"}>
                              {mountain.requiredClimbingLevel}
                              {!unlocked && <Lock className="w-3 h-3" />}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">First Ascent:</span>
                            <span>{mountain.firstAscentYear}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fatality Rate:</span>
                            <span className={mountain.fatalityRate > 10 ? "text-red-400" : ""}>
                              {mountain.fatalityRate}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Best Season:</span>
                            <span>
                              {mountain.bestSeasonStart} - {mountain.bestSeasonEnd}
                            </span>
                          </div>
                        </div>

                        {unlocked ? (
                          <Link href="/expedition-missions">
                            <Button className="w-full">
                              <TrendingUp className="w-4 h-4 mr-2" />
                              View Missions
                            </Button>
                          </Link>
                        ) : (
                          <Button disabled className="w-full" variant="outline">
                            <Lock className="w-4 h-4 mr-2" />
                            Locked
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>

            {filteredMountains.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No mountains in this region yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
