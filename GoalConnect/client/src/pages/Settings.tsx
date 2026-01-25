import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mountain, Lock, Check, Download, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ForestBackground } from "@/components/ForestBackground";

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
    <div className="min-h-screen relative">
      {/* Forest background */}
      <ForestBackground />

      {/* Sidebar Navigation */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-[160px] z-20 flex-col justify-center pl-6">
        <div className="space-y-4">
          <Link href="/">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              dashboard
            </span>
          </Link>
          <Link href="/habits">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              habits
            </span>
          </Link>
          <Link href="/goals">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              goals
            </span>
          </Link>
          <Link href="/todos">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              todos
            </span>
          </Link>
          <Link href="/study">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              study
            </span>
          </Link>
          <Link href="/journey">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              journey
            </span>
          </Link>
          <Link href="/adventures">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              adventures
            </span>
          </Link>
          <Link href="/settings">
            <span className="block text-peach-400 text-sm font-heading cursor-pointer">
              settings
            </span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 px-5 md:px-8 pb-24 pt-8">
        <div className="max-w-[900px] ml-0 md:ml-[188px] space-y-5">
          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="logo-text tracking-wider text-2xl">SETTINGS</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Customize your experience
              </p>
            </div>
          </header>

          {/* Import Data Link */}
          <Link href="/settings/import">
            <div className="glass-card frost-accent p-4 cursor-pointer transition-all hover:scale-[1.01] mb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-peach-400/20">
                    <Download className="w-6 h-6 text-peach-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">Import Data</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Connect Apple Health, Kilter Board & more
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
            </div>
          </Link>

          {/* Unlocked Backgrounds */}
          <div className="glass-card frost-accent p-5 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Mountain className="w-5 h-5 text-peach-400" />
              <span className="card-title">Unlocked Backgrounds</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {unlockedBackgrounds.length > 0
                ? `${unlockedBackgrounds.length} background${unlockedBackgrounds.length !== 1 ? 's' : ''} unlocked`
                : "Summit mountains to unlock backgrounds"}
            </p>
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
          </div>

          {/* Locked Backgrounds */}
          {lockedBackgrounds.length > 0 && (
            <div className="glass-card frost-accent p-5">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-[var(--text-muted)]" />
                <span className="card-title">Locked Backgrounds</span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Summit these mountains to unlock their backgrounds
              </p>
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
                      <div className="absolute inset-0 bg-black/60" />

                      {/* Lock Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full p-4 backdrop-blur-sm bg-black/40">
                          <Lock className="w-8 h-8 text-white/40" />
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
