import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mountain, ArrowLeft, Cloud, Wind, Thermometer, Package, TrendingUp, AlertTriangle, Check, Backpack, Trophy, X } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  fatalityRate: number;
  bestSeasonStart: string;
  bestSeasonEnd: string;
}

interface Route {
  id: number;
  mountainId: number;
  name: string;
  difficultyGrade: string;
  lengthMeters: number;
  elevationGain: number;
  typicalDays: number;
  description: string;
  hazards: string;
}

interface GearItem {
  inventoryId: number;
  gearId: number;
  name: string;
  category: string;
  weightGrams: number;
  tier: string;
}

interface ExpeditionResult {
  success: boolean;
  xpEarned: number;
  successChance: number;
  mountain: {
    name: string;
    elevation: number;
    tier: string;
  };
  route: {
    name: string;
    grade: string;
  };
}

export default function ExpeditionPlanning() {
  const [, params] = useRoute("/expedition/plan/:mountainId");
  const [, setLocation] = useLocation();
  const mountainId = params?.mountainId ? parseInt(params.mountainId) : null;

  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [selectedGear, setSelectedGear] = useState<number[]>([]);
  const [teamSize, setTeamSize] = useState(1);
  const [expeditionResult, setExpeditionResult] = useState<ExpeditionResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Fetch mountain details
  const { data: mountains = [] } = useQuery({
    queryKey: ["/api/mountains"],
  });

  const mountain = mountains.find((m: Mountain) => m.id === mountainId);

  // Fetch routes for this mountain
  const { data: routes = [] } = useQuery({
    queryKey: [`/api/mountains/${mountainId}/routes`],
    enabled: !!mountainId,
  });

  // Fetch player's gear inventory
  const { data: inventory = [] } = useQuery<GearItem[]>({
    queryKey: ["/api/alpine-gear/inventory"],
  });

  // Fetch player stats
  const { data: stats } = useQuery({
    queryKey: ["/api/climbing/stats"],
  });

  // Mutation to create expedition
  const createExpeditionMutation = useMutation({
    mutationFn: async (data: {
      routeId: number;
      mountainId: number;
      gearIds: number[];
      teamSize: number;
    }) => {
      const response = await apiRequest("POST", "/api/expeditions", data);
      return response;
    },
    onSuccess: (data) => {
      setExpeditionResult(data);
      setShowResultModal(true);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/climbing/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expeditions"] });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to create expedition");
    },
  });

  const selectedRouteData = routes.find((r: Route) => r.id === selectedRoute);

  // Calculate total weight of selected gear
  const totalWeight = selectedGear.reduce((sum, gearId) => {
    const gear = inventory.find(g => g.gearId === gearId);
    return sum + (gear?.weightGrams || 0);
  }, 0);

  const toggleGear = (gearId: number) => {
    setSelectedGear(prev =>
      prev.includes(gearId) ? prev.filter(id => id !== gearId) : [...prev, gearId]
    );
  };

  const handleStartExpedition = () => {
    if (!selectedRoute) {
      alert("Please select a route");
      return;
    }

    createExpeditionMutation.mutate({
      routeId: selectedRoute,
      mountainId: mountainId!,
      gearIds: selectedGear,
      teamSize,
    });
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    setLocation("/world-map");
  };

  if (!mountainId || !mountain) {
    return (
      <div className="min-h-screen pb-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <Link href="/world-map">
            <Button variant="outline" size="icon" className="mb-4">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Card className="bg-slate-800/60 border-slate-700/50">
            <CardContent className="pt-6">
              <p className="text-slate-400">Mountain not found. Please select a mountain from the World Map.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    beginner: "bg-green-500/20 text-green-300 border-green-500/40",
    intermediate: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    advanced: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    expert: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    elite: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  };

  const canAttempt = stats && stats.climbingLevel >= mountain.requiredClimbingLevel;

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/world-map">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Mountain className="w-8 h-8" />
              Plan Expedition: {mountain.name}
            </h1>
            <p className="text-slate-400">
              {mountain.elevation.toLocaleString()} m • {mountain.country}
            </p>
          </div>
          {stats && (
            <div className="text-right">
              <div className="text-sm text-slate-400">Your Level</div>
              <div className="text-2xl font-bold text-white">{stats.climbingLevel}</div>
            </div>
          )}
        </div>

        {/* Level Check Alert */}
        {!canAttempt && (
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-300">
              You need level {mountain.requiredClimbingLevel} to attempt this mountain. Keep training!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Mountain & Route Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mountain Info */}
            <Card className="bg-slate-800/60 border-slate-700/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{mountain.name}</CardTitle>
                    <CardDescription>{mountain.mountainRange}, {mountain.continent}</CardDescription>
                  </div>
                  <Badge className={tierColors[mountain.difficultyTier]} variant="outline">
                    {mountain.difficultyTier}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">{mountain.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500 mb-1">Elevation</div>
                    <div className="font-bold text-white">{mountain.elevation.toLocaleString()} m</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Fatality Rate</div>
                    <div className={`font-bold ${mountain.fatalityRate > 10 ? 'text-red-400' : 'text-white'}`}>
                      {mountain.fatalityRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Best Season</div>
                    <div className="font-bold text-white">
                      {mountain.bestSeasonStart} - {mountain.bestSeasonEnd}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Required Level</div>
                    <div className={`font-bold ${canAttempt ? 'text-green-400' : 'text-red-400'}`}>
                      {mountain.requiredClimbingLevel}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Selection */}
            <Card className="bg-slate-800/60 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Select Route
                </CardTitle>
                <CardDescription>
                  {routes.length > 0 ? `${routes.length} available routes` : "No routes available yet"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {routes.length === 0 ? (
                  <p className="text-slate-400 text-sm">Routes data coming soon...</p>
                ) : (
                  routes.map((route: Route) => (
                    <button
                      key={route.id}
                      onClick={() => setSelectedRoute(route.id)}
                      disabled={!canAttempt}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedRoute === route.id
                          ? 'bg-blue-600/20 border-blue-500/50'
                          : 'bg-slate-900/40 border-slate-700/50 hover:border-slate-600/50'
                      } ${!canAttempt ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-white">{route.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {route.difficultyGrade}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{route.description}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Distance:</span>
                          <span className="text-white ml-1">{(route.lengthMeters / 1000).toFixed(1)} km</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Elevation:</span>
                          <span className="text-white ml-1">{route.elevationGain} m</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Duration:</span>
                          <span className="text-white ml-1">{route.typicalDays} days</span>
                        </div>
                      </div>
                      {route.hazards && (
                        <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {route.hazards}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Weather Forecast */}
            <Card className="bg-slate-800/60 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Weather Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Conditions</span>
                    </div>
                    <div className="text-lg font-bold text-white">Partly Cloudy</div>
                  </div>
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Wind Speed</span>
                    </div>
                    <div className="text-lg font-bold text-white">15 km/h</div>
                  </div>
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Temperature</span>
                    </div>
                    <div className="text-lg font-bold text-white">-5°C</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  * Weather simulation coming soon
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Gear & Expedition Setup */}
          <div className="space-y-6">
            {/* Gear Selection */}
            <Card className="bg-slate-800/60 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Backpack className="w-5 h-5" />
                  Gear Loadout
                </CardTitle>
                <CardDescription>
                  {inventory.length} items available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {inventory.length === 0 ? (
                  <div className="text-center py-4">
                    <Package className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">No gear in inventory</p>
                    <Link href="/alpine-shop">
                      <Button variant="outline" size="sm" className="mt-2">
                        Visit Shop
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                      {inventory.map((gear) => (
                        <button
                          key={gear.gearId}
                          onClick={() => toggleGear(gear.gearId)}
                          disabled={!canAttempt}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedGear.includes(gear.gearId)
                              ? 'bg-blue-600/20 border-blue-500/50'
                              : 'bg-slate-900/40 border-slate-700/50 hover:border-slate-600/50'
                          } ${!canAttempt ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-white">{gear.name}</span>
                                {selectedGear.includes(gear.gearId) && (
                                  <Check className="w-4 h-4 text-green-400" />
                                )}
                              </div>
                              <div className="text-xs text-slate-400 capitalize">
                                {gear.category.replace(/_/g, ' ')} • {(gear.weightGrams / 1000).toFixed(1)} kg
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Weight Summary */}
                    <div className="pt-3 border-t border-slate-700/50">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Total Weight:</span>
                        <span className="font-bold text-white">
                          {(totalWeight / 1000).toFixed(1)} kg
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Items Selected:</span>
                        <span className="font-bold text-white">
                          {selectedGear.length}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Expedition Parameters */}
            <Card className="bg-slate-800/60 border-slate-700/50">
              <CardHeader>
                <CardTitle>Expedition Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Team Size</label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(parseInt(e.target.value))}
                    disabled={!canAttempt}
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Solo (1 climber)</option>
                    <option value={2}>Pair (2 climbers)</option>
                    <option value={3}>Small Team (3 climbers)</option>
                    <option value={4}>Full Team (4 climbers)</option>
                  </select>
                </div>

                {selectedRouteData && (
                  <div className="bg-slate-900/40 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimated Duration:</span>
                      <span className="text-white font-bold">{selectedRouteData.typicalDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Difficulty:</span>
                      <span className="text-white font-bold">{selectedRouteData.difficultyGrade}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleStartExpedition}
                  disabled={!canAttempt || !selectedRoute || createExpeditionMutation.isPending}
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold py-6"
                >
                  {createExpeditionMutation.isPending ? (
                    "Starting Expedition..."
                  ) : !canAttempt ? (
                    "Level Too Low"
                  ) : !selectedRoute ? (
                    "Select Route First"
                  ) : (
                    <>
                      <Mountain className="w-5 h-5 mr-2" />
                      Start Expedition
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Expedition Result Modal */}
        <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {expeditionResult?.success ? (
                  <>
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    Summit Success!
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    Expedition Failed
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {expeditionResult && (
              <div className="space-y-4 py-4">
                <div className={`rounded-lg p-4 ${
                  expeditionResult.success
                    ? 'bg-green-900/20 border border-green-500/30'
                    : 'bg-red-900/20 border border-red-500/30'
                }`}>
                  <p className="text-center text-lg mb-2">
                    {expeditionResult.success
                      ? `You reached the summit of ${expeditionResult.mountain.name}!`
                      : `You didn't reach the summit this time, but you learned valuable lessons.`
                    }
                  </p>
                  <p className="text-center text-sm text-slate-400">
                    {expeditionResult.route.name} • {expeditionResult.route.grade}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-sm text-slate-400 mb-1">Success Chance</div>
                    <div className="text-2xl font-bold text-white">
                      {expeditionResult.successChance}%
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-sm text-slate-400 mb-1">XP Earned</div>
                    <div className="text-2xl font-bold text-green-400">
                      +{expeditionResult.xpEarned}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-sm text-slate-400 mb-2">Mountain Details</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Peak:</span>
                      <span className="text-white font-semibold">{expeditionResult.mountain.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Elevation:</span>
                      <span className="text-white font-semibold">
                        {expeditionResult.mountain.elevation.toLocaleString()} m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Difficulty:</span>
                      <span className="text-white font-semibold capitalize">
                        {expeditionResult.mountain.tier}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCloseResultModal}
                    className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
                  >
                    Back to World Map
                  </Button>
                  {expeditionResult.success && (
                    <Button
                      onClick={() => {
                        setShowResultModal(false);
                        setSelectedRoute(null);
                        setSelectedGear([]);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Plan Another
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
