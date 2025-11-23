import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mountain, Lock, Check, ArrowLeft, Download, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MountainBackground {
  id: number;
  name: string;
  elevation: number;
  country: string;
  backgroundImage: string;
  themeColors: string;
  difficultyTier: string;
  isActive: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function Settings() {
  const { data: backgrounds = [], isLoading } = useQuery<MountainBackground[]>({
    queryKey: ["/api/user/backgrounds"],
  });

  const activateBackgroundMutation = useMutation({
    mutationFn: async (mountainId: number) => {
      return await apiRequest("PATCH", `/api/user/backgrounds/${mountainId}/activate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/backgrounds"] });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to activate background");
    },
  });

  const unlockedBackgrounds = backgrounds.filter(b => b.unlocked);
  const lockedBackgrounds = backgrounds.filter(b => !b.unlocked);

  const handleActivate = (mountainId: number) => {
    activateBackgroundMutation.mutate(mountainId);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="icon" className="mb-4">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Settings
          </h1>
          <p className="text-muted-foreground">Customize your climbing experience</p>
        </div>

        {/* Import Data Link */}
        <Link href="/settings/import">
          <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 mb-8 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.01]">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.2))'
                  }}>
                    <Download className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Import Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect Apple Health, Kilter Board & more
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Unlocked Backgrounds */}
        <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mountain className="w-5 h-5" />
              Unlocked Backgrounds
            </CardTitle>
            <CardDescription>
              {unlockedBackgrounds.length > 0
                ? `${unlockedBackgrounds.length} background${unlockedBackgrounds.length !== 1 ? 's' : ''} unlocked`
                : "Summit mountains to unlock backgrounds"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-slate-700/30 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : unlockedBackgrounds.length === 0 ? (
              <div className="text-center py-12">
                <Mountain className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--foreground) / 0.3)' }} />
                <p className="text-muted-foreground mb-2">No backgrounds unlocked yet</p>
                <p className="text-sm text-muted-foreground/70">Complete expeditions to unlock mountain backgrounds</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unlockedBackgrounds.map(bg => (
                  <button
                    key={bg.id}
                    onClick={() => !bg.isActive && handleActivate(bg.id)}
                    disabled={bg.isActive || activateBackgroundMutation.isPending}
                    className={`relative group rounded-xl overflow-hidden transition-all ${
                      bg.isActive
                        ? 'ring-2 ring-[hsl(var(--accent))] scale-[1.02]'
                        : 'hover:scale-105 hover:shadow-xl cursor-pointer'
                    } ${activateBackgroundMutation.isPending ? 'opacity-50' : ''}`}
                  >
                    {/* Background Image */}
                    <div className="aspect-video relative">
                      <img
                        src={bg.backgroundImage}
                        alt={bg.name}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(to top, hsl(var(--background) / 0.9), hsl(var(--background) / 0.4), transparent)'
                        }}
                      />

                      {/* Active Badge */}
                      {bg.isActive && (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 text-white shadow-lg" style={{
                          background: 'hsl(var(--accent))'
                        }}>
                          <Check className="w-3 h-3" />
                          Active
                        </div>
                      )}

                      {/* Mountain Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold text-lg mb-1">{bg.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <span>{bg.elevation.toLocaleString()}m</span>
                          <span>•</span>
                          <span>{bg.country}</span>
                        </div>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {bg.difficultyTier}
                        </Badge>
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    {!bg.isActive && (
                      <div className="absolute inset-0 transition-colors flex items-center justify-center" style={{
                        background: 'transparent'
                      }} onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 rounded-lg font-semibold text-white shadow-lg" style={{
                          background: 'hsl(var(--primary) / 0.9)'
                        }}>
                          Select
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Locked Backgrounds */}
        {lockedBackgrounds.length > 0 && (
          <Card className="bg-background/40 backdrop-blur-xl border-foreground/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Locked Backgrounds
              </CardTitle>
              <CardDescription>
                Summit these mountains to unlock their backgrounds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lockedBackgrounds.map(bg => (
                  <div
                    key={bg.id}
                    className="relative rounded-xl overflow-hidden opacity-60"
                  >
                    {/* Background Image with Lock Overlay */}
                    <div className="aspect-video relative">
                      <img
                        src={bg.backgroundImage}
                        alt={bg.name}
                        className="w-full h-full object-cover filter grayscale"
                      />
                      <div className="absolute inset-0" style={{ background: 'hsl(var(--background) / 0.8)' }} />

                      {/* Lock Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full p-4 backdrop-blur-sm" style={{ background: 'hsl(var(--background) / 0.6)' }}>
                          <Lock className="w-8 h-8" style={{ color: 'hsl(var(--foreground) / 0.4)' }} />
                        </div>
                      </div>

                      {/* Mountain Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-foreground font-bold text-lg mb-1">{bg.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-foreground/70">
                          <span>{bg.elevation.toLocaleString()}m</span>
                          <span>•</span>
                          <span>{bg.country}</span>
                        </div>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {bg.difficultyTier}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                          Summit to unlock
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
