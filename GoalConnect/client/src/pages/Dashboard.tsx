import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitToggleRow } from "@/components/HabitToggleRow";
import { VirtualPet } from "@/components/VirtualPet";
import { EmptyState } from "@/components/EmptyState";
import { FAB } from "@/components/FAB";
import { Home, Calendar, List, CheckCircle, Sparkles, Zap, Star, Crown } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { useState, useMemo, useEffect } from "react";
import { getToday, calculateStreak } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { HabitDialog } from "@/components/HabitDialog";
import { GoalDialog } from "@/components/GoalDialog";
import { HabitLogDialog } from "@/components/HabitLogDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type TabType = "today" | "calendar" | "todos";

// Magical Canvas Component
function MagicalCanvas() {
  useEffect(() => {
    const canvas = document.getElementById('magicCanvas');
    if (!canvas) return;

    // Create fairy lights
    const colors = ['#a7f3d0', '#fbbf24', '#a78bfa', '#fca5a5', '#93c5fd'];
    for (let i = 0; i < 30; i++) {
      const light = document.createElement('div');
      light.className = 'absolute rounded-full float-fairy blur-sm';
      light.style.background = colors[Math.floor(Math.random() * colors.length)];
      light.style.width = Math.random() * 4 + 2 + 'px';
      light.style.height = light.style.width;
      light.style.left = Math.random() * 100 + '%';
      light.style.top = Math.random() * 100 + '%';
      light.style.animationDelay = Math.random() * 8 + 's';
      light.style.animationDuration = (Math.random() * 4 + 6) + 's';
      canvas.appendChild(light);
    }

    // Create twinkling stars
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'absolute w-0.5 h-0.5 bg-white rounded-full twinkle';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.boxShadow = '0 0 3px white, 0 0 6px white';
      canvas.appendChild(star);
    }

    return () => {
      if (canvas) {
        canvas.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      id="magicCanvas"
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("today");
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [habitLogDialogOpen, setHabitLogDialogOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: todayLogs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", getToday()],
    queryFn: () => fetch(`/api/habit-logs?date=${getToday()}`).then(res => res.json()),
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: number; completed: boolean }) => {
      const existingLog = todayLogs.find(log => log.habitId === habitId);

      if (existingLog) {
        return apiRequest(`/api/habit-logs/${existingLog.id}`, "PATCH", {
          completed: !existingLog.completed,
        });
      } else {
        return apiRequest("/api/habit-logs", "POST", {
          habitId,
          date: getToday(),
          completed: true,
          note: null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"], exact: false });
    },
  });

  const todayHabits = useMemo(() => {
    return habits.map(habit => {
      const log = todayLogs.find(l => l.habitId === habit.id);
      return { ...habit, completed: log?.completed || false };
    });
  }, [habits, todayLogs]);

  const currentStreak = useMemo(() => {
    const completedToday = todayHabits.filter(h => h.completed).length;
    if (completedToday === 0) return 0;
    return 1; // Simplified for now
  }, [todayHabits]);

  const completedCount = todayHabits.filter(h => h.completed).length;
  const totalCount = todayHabits.length;

  const handleToggleHabit = (habitId: number, completed: boolean) => {
    toggleHabitMutation.mutate({ habitId, completed });
  };

  const handleFabClick = () => {
    setQuickActionOpen(true);
  };

  const handleLongPress = (habit: Habit) => {
    setSelectedHabit(habit);
    setHabitLogDialogOpen(true);
  };

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getDayOfWeek = (daysAgo: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return days[date.getDay()];
  };

  if (habitsLoading || logsLoading) {
    return (
      <div className="min-h-screen enchanted-bg flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6">
        <MagicalCanvas />
        <div className="w-full md:w-80 relative z-10">
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
        <div className="flex-1 relative z-10">
          <Skeleton className="h-20 w-full rounded-3xl mb-6" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="min-h-screen enchanted-bg flex items-center justify-center p-6">
        <MagicalCanvas />
        <div className="relative z-10">
          <EmptyState
            icon={CheckCircle}
            title="Ready to build something awesome?"
            description="Let's create your first habit and start your journey to greatness!"
            actionLabel="Start a new habit"
            onAction={handleFabClick}
          />
        </div>
        <FAB onClick={handleFabClick} />
        <HabitDialog open={habitDialogOpen} onOpenChange={setHabitDialogOpen} />
        <GoalDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen enchanted-bg overflow-x-hidden">
      <MagicalCanvas />

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        {/* Enchanted Header */}
        <div className="glass-card rounded-3xl p-6 mb-6 magical-glow relative overflow-hidden shimmer-effect">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative float-animation">
                <Avatar className="w-14 h-14 border-3 border-white/30 shadow-lg relative">
                  <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    AL
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center border-2 border-white/50 pulse-animation shadow-lg">
                  <Crown className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div>
                <h1
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(167, 139, 250, 0.8)' }}
                  data-testid="greeting-text"
                >
                  {getGreeting()}, Alex ✨
                </h1>
                <p className="text-sm text-white/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                  {formatDate()} • Keep growing! 🌱
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Badge
                className="rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-2 flex-1 sm:flex-initial justify-center bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border-2 border-yellow-400/40 text-yellow-100 backdrop-blur-xl shadow-lg"
                data-testid="streak-badge"
              >
                <Zap className="w-4 h-4" />
                <span>{currentStreak} day streak</span>
              </Badge>
              <Badge
                className="rounded-full px-6 py-2 text-lg font-bold flex-1 sm:flex-initial justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-white/30 shadow-lg"
                data-testid="completion-badge"
              >
                {completedCount}/{totalCount}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Enchanted Pet Card */}
            <div className="glass-card rounded-3xl p-8 text-center relative overflow-hidden magical-glow">
              {/* Floating Sparkles */}
              <div className="absolute inset-0 pointer-events-none">
                <span className="absolute top-5 left-5 text-xl float-sparkle">✨</span>
                <span className="absolute top-8 right-8 text-xl float-sparkle" style={{animationDelay: '1s'}}>🌟</span>
                <span className="absolute top-5 right-4 text-xl float-sparkle" style={{animationDelay: '0.5s'}}>💫</span>
                <span className="absolute bottom-8 left-6 text-xl float-sparkle" style={{animationDelay: '1.5s'}}>⭐</span>
                <span className="absolute bottom-10 right-9 text-xl float-sparkle" style={{animationDelay: '0.8s'}}>✨</span>
              </div>

              <div className="relative z-10">
                <VirtualPet />
                <h3
                  className="text-xl font-bold bg-gradient-to-r from-green-300 via-emerald-400 to-purple-400 bg-clip-text text-transparent mb-3"
                  style={{ fontFamily: "'Comfortaa', cursive" }}
                >
                  Your Forest Friend
                </h3>
                <Badge className="rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 text-green-200 backdrop-blur-xl mb-6 shadow-lg">
                  🌱 Growing Steadily 🌱
                </Badge>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/20 shadow-lg">
                    <div className="text-2xl font-bold text-white mb-1">⚡ {currentStreak}</div>
                    <div className="text-xs text-white/80">Day Streak</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/20 shadow-lg">
                    <div className="text-2xl font-bold text-white mb-1">⭐ {Math.round((completedCount / totalCount) * 100)}%</div>
                    <div className="text-xs text-white/80">This Week</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Magical Insights */}
            <div className="glass-card-pink rounded-3xl p-6 magical-glow" style={{animationDelay: '1s'}}>
              <h3
                className="text-base font-bold text-yellow-400 mb-5 flex items-center gap-2"
                style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }}
              >
                <Sparkles className="w-4 h-4" />
                Quick Insights
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xs text-white/70 mb-2">Best Day</div>
                  <div className="text-lg font-bold text-white">Mon</div>
                </div>
                <div className="text-center border-x border-white/20">
                  <div className="text-xs text-white/70 mb-2">Streak</div>
                  <div className="text-lg font-bold text-white">{currentStreak}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/70 mb-2">Weekly</div>
                  <div className="text-lg font-bold text-white">5%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex flex-col gap-6 pb-20 md:pb-0">
            {/* Magical Tabs */}
            <div className="glass-card rounded-3xl p-2 flex gap-2">
              <Button
                variant={activeTab === "today" ? "default" : "ghost"}
                className={cn(
                  "flex-1 rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-300",
                  activeTab === "today"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-white/30 shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                onClick={() => setActiveTab("today")}
                data-testid="tab-today"
              >
                <Home className="w-4 h-4 mr-2" />
                Today
              </Button>
              <Button
                variant={activeTab === "calendar" ? "default" : "ghost"}
                className={cn(
                  "flex-1 rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-300",
                  activeTab === "calendar"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-white/30 shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                onClick={() => setActiveTab("calendar")}
                data-testid="tab-calendar"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={activeTab === "todos" ? "default" : "ghost"}
                className={cn(
                  "flex-1 rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-300",
                  activeTab === "todos"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-white/30 shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                onClick={() => setActiveTab("todos")}
                data-testid="tab-todos"
              >
                <List className="w-4 h-4 mr-2" />
                To-Do
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === "today" && (
              <div className="fade-in" data-testid="today-panel">
                {/* Enchanted Habits Card */}
                <div className="glass-card-green rounded-3xl p-8 magical-glow mb-6" style={{animationDelay: '0.5s'}}>
                  <div className="flex items-center justify-between mb-6">
                    <h2
                      className="text-xl font-bold text-white flex items-center gap-3"
                      style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
                    >
                      Today's Habits
                      <Badge className="rounded-full px-4 py-1 text-sm font-bold bg-green-500/30 border-2 border-green-500/40 text-green-200">
                        {completedCount}/{totalCount}
                      </Badge>
                    </h2>
                    <Sparkles className="w-6 h-6 text-yellow-400" style={{filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))'}} />
                  </div>
                  <div className="space-y-3">
                    {todayHabits.map(habit => (
                      <div
                        key={habit.id}
                        className={cn(
                          "bg-white/10 backdrop-blur-xl rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group",
                          habit.completed
                            ? "bg-green-500/30 border-green-500/50 shadow-lg shadow-green-500/20"
                            : "border-white/10 hover:border-green-500/40 hover:translate-x-2 hover:scale-[1.02]"
                        )}
                        onClick={() => handleToggleHabit(habit.id, habit.completed)}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full border-3 flex items-center justify-center flex-shrink-0 transition-all duration-300",
                          habit.completed
                            ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-500 shadow-lg"
                            : "bg-white/5 border-white/30"
                        )}>
                          {habit.completed && <span className="text-white font-bold pop">✓</span>}
                        </div>
                        <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center" style={{filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5)', color: habit.color}}>
                          {(() => {
                            const IconComponent = (Icons as any)[habit.icon] || Icons.Sparkles;
                            return <IconComponent className="w-6 h-6" />;
                          })()}
                        </div>
                        <div className={cn(
                          "flex-1 font-medium text-base",
                          habit.completed ? "line-through text-white/60" : "text-white"
                        )}>
                          {habit.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Magical Weekly Progress */}
                <div className="glass-card-blue rounded-3xl p-8 magical-glow" style={{animationDelay: '1.5s'}}>
                  <h3
                    className="text-lg font-bold text-white mb-6 flex items-center gap-2"
                    style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
                  >
                    This Week's Progress 🌿
                  </h3>
                  <div className="grid grid-cols-7 gap-3">
                    {[6, 5, 4, 3, 2, 1, 0].map((daysAgo, idx) => {
                      const isToday = daysAgo === 0;
                      return (
                        <div key={idx} className="text-center">
                          <div className="text-xs text-white/70 mb-3 font-semibold">
                            {getDayOfWeek(daysAgo)}
                          </div>
                          <div className={cn(
                            "aspect-square rounded-full flex items-center justify-center text-base font-bold transition-all duration-300 border-2",
                            isToday
                              ? "border-yellow-400 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 text-white pulse-glow shadow-lg"
                              : "bg-white/10 backdrop-blur-xl border-white/20 text-white/60 hover:scale-110 hover:shadow-lg"
                          )}>
                            {isToday ? completedCount : 0}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="glass-card rounded-3xl p-16 text-center fade-in">
                <h2
                  className="text-3xl font-bold text-white mb-4"
                  style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
                >
                  📅 Calendar View
                </h2>
                <p className="text-white/70">Your magical calendar and streaks will appear here</p>
              </div>
            )}

            {activeTab === "todos" && (
              <div className="glass-card rounded-3xl p-16 text-center fade-in">
                <h2
                  className="text-3xl font-bold text-white mb-4"
                  style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
                >
                  ✅ To-Do List
                </h2>
                <p className="text-white/70">Your enchanted tasks will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <FAB onClick={handleFabClick} />

      <Sheet open={quickActionOpen} onOpenChange={setQuickActionOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>What would you like to do?</SheetTitle>
          </SheetHeader>
          <div className="grid gap-3 py-4">
            <Button
              onClick={() => {
                setQuickActionOpen(false);
                setHabitDialogOpen(true);
              }}
              className="w-full justify-start rounded-xl"
              variant="outline"
              data-testid="button-create-habit"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Start a new habit
            </Button>
            <Button
              onClick={() => {
                setQuickActionOpen(false);
                setGoalDialogOpen(true);
              }}
              className="w-full justify-start rounded-xl"
              variant="outline"
              data-testid="button-create-goal"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Dream big
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <HabitDialog open={habitDialogOpen} onOpenChange={setHabitDialogOpen} />
      <GoalDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} />
      <HabitLogDialog open={habitLogDialogOpen} onOpenChange={setHabitLogDialogOpen} habit={selectedHabit} />
    </div>
  );
}
