import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitToggleRow } from "@/components/HabitToggleRow";
import { VirtualPet } from "@/components/VirtualPet";
import { EmptyState } from "@/components/EmptyState";
import { FAB } from "@/components/FAB";
import { AchievementSpotlight } from "@/components/AchievementSpotlight";
import { WeekAtAGlance } from "@/components/WeekAtAGlance";
import { WeeklyGoalsWidget } from "@/components/WeeklyGoalsWidget";
import { MonthlyGoalsWidget } from "@/components/MonthlyGoalsWidget";
import { GoalJourneyCard } from "@/components/GoalJourneyCard";
import { GoalBadge } from "@/components/GoalBadge";
import { DreamScrollWidget } from "@/components/DreamScrollWidget";
import { Home, Calendar, List, CheckCircle, Sparkles, Zap, Crown, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog, Goal } from "@shared/schema";
import { useState, useMemo, useEffect } from "react";
import { getToday, calculateStreak } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { HabitDialogNew as HabitDialog } from "@/components/HabitDialogNew";
import { GoalDialog } from "@/components/GoalDialog";
import { HabitLogDialog } from "@/components/HabitLogDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CalendarView } from "@/components/CalendarView";
import { useAuth } from "@/contexts/AuthContext";
import { Confetti, CelebrationModal } from "@/components/Confetti";
import { useToast } from "@/hooks/use-toast";

type TabType = "today" | "calendar" | "todos";

// Magical Canvas Component
function MagicalCanvas() {
  useEffect(() => {
    const canvas = document.getElementById('magicCanvas');
    if (!canvas) return;

    // Create fairy lights
    const colors = ['#a7f3d0', '#06b6d4', '#64748b', '#475569', '#93c5fd'];
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrationModal, setCelebrationModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    iconName: string;
  }>({ open: false, title: "", description: "", iconName: "sparkles" });

  const { user } = useAuth();
  const { toast } = useToast();
  const userName = user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const today = getToday();

  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: todayLogs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId }: { habitId: number; completed: boolean }) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date: today,
      });
    },
    // Optimistic update - update UI immediately before server responds
    onMutate: async ({ habitId, completed }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/habit-logs", today] });

      // Snapshot the previous value
      const previousLogs = queryClient.getQueryData<HabitLog[]>(["/api/habit-logs", today]);

      // Optimistically update to the new value
      queryClient.setQueryData<HabitLog[]>(["/api/habit-logs", today], (old = []) => {
        const existingLog = old.find(log => log.habitId === habitId);

        if (existingLog) {
          // Toggle existing log
          return old.map(log =>
            log.habitId === habitId
              ? { ...log, completed: !log.completed }
              : log
          );
        } else {
          // Add new log
          return [...old, {
            id: Date.now(), // temporary ID
            habitId,
            userId: 1,
            date: today,
            completed: true,
            note: null
          } as HabitLog];
        }
      });

      return { previousLogs };
    },
    onSuccess: (data: any) => {
      // Show reward feedback
      if (data.rewardDetails) {
        const { coinsEarned, baseCoins, streak, streakMultiplier, habitTitle } = data.rewardDetails;

        // Build toast message
        let toastTitle = `+${coinsEarned} coins earned! 🪙`;
        let toastDescription = `Completed "${habitTitle}"`;

        if (streakMultiplier > 1.0) {
          toastDescription += ` • ${streak} day streak (${streakMultiplier}x bonus!)`;
        }

        toast({
          title: toastTitle,
          description: toastDescription,
          duration: 3000,
        });
      }

      // Celebration for level-up
      if (data.petUpdate?.leveledUp) {
        setShowConfetti(true);
        toast({
          title: "🎉 Level Up!",
          description: "Your pet gained a level!",
          duration: 4000,
        });
      }

      // Celebration for evolution
      if (data.petUpdate?.evolved) {
        setCelebrationModal({
          open: true,
          title: "✨ Pet Evolved!",
          description: "Your pet has evolved to a new form! New items are now available in the shop!",
          iconName: "sparkles",
        });
      }
    },
    onError: (err, variables, context) => {
      console.error('❌ Toggle error:', err);
      // Rollback on error
      if (context?.previousLogs) {
        queryClient.setQueryData(["/api/habit-logs", today], context.previousLogs);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      // Also invalidate the "all" query used by CalendarView
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/all"] });
      // Refresh points display
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
    },
  });

  // Fetch all habit logs for streak calculation
  const { data: allHabitLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
    queryFn: async () => {
      if (habits.length === 0) return [];
      const logsPromises = habits.map(h =>
        fetch(`/api/habit-logs?habitId=${h.id}`).then(res => res.json())
      );
      const logsArrays = await Promise.all(logsPromises);
      return logsArrays.flat();
    },
    enabled: habits.length > 0,
  });

  const todayHabits = useMemo(() => {
    return habits.map(habit => {
      const log = todayLogs.find(l => l.habitId === habit.id);
      return { ...habit, completed: log?.completed || false };
    });
  }, [habits, todayLogs]);

  // Calculate real streak based on consecutive days with ALL habits completed
  const currentStreak = useMemo(() => {
    if (habits.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date();

    // Start from today and go backwards
    while (true) {
      const dateString = checkDate.toISOString().split('T')[0];
      const logsForDate = allHabitLogs.filter(log => log.date === dateString && log.completed);

      // Check if all habits were completed on this date
      const allCompleted = logsForDate.length === habits.length;

      if (!allCompleted) {
        // If it's today and nothing completed, streak is still 0 but don't break yet
        if (streak === 0 && dateString === today) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }

      streak++;
      checkDate.setDate(checkDate.getDate() - 1);

      // Safety limit to prevent infinite loop
      if (streak > 365) break;
    }

    return streak;
  }, [habits, allHabitLogs, today]);

  const completedCount = todayHabits.filter(h => h.completed).length;
  const totalCount = todayHabits.length;

  // Calculate achievements for spotlight
  const achievements = useMemo(() => {
    const achs = [];

    // Perfect day achievement
    if (completedCount === totalCount && totalCount > 0) {
      achs.push({
        id: "perfect-day",
        icon: "star" as const,
        title: "Perfect Day!",
        description: "All habits completed today",
        color: "bg-gradient-to-br from-teal-400 to-cyan-500",
      });
    }

    // Streak milestones
    if (currentStreak >= 7) {
      achs.push({
        id: "week-streak",
        icon: "flame" as const,
        title: `${currentStreak} Day Streak!`,
        description: "You're on fire! Keep it going!",
        color: "bg-gradient-to-br from-cyan-500 to-slate-500",
      });
    } else if (currentStreak >= 3) {
      achs.push({
        id: "mini-streak",
        icon: "flame" as const,
        title: `${currentStreak} Days Strong`,
        description: "Building momentum!",
        color: "bg-gradient-to-br from-cyan-400 to-cyan-600",
      });
    }

    // Habit completion milestone
    const totalCompletions = allHabitLogs.filter(log => log.completed).length;
    if (totalCompletions >= 100) {
      achs.push({
        id: "century",
        icon: "trophy" as const,
        title: "Century Club",
        description: `${totalCompletions} total habit completions!`,
        color: "bg-gradient-to-br from-slate-600 to-slate-700",
      });
    } else if (totalCompletions >= 50) {
      achs.push({
        id: "half-century",
        icon: "target" as const,
        title: "Halfway Hero",
        description: `${totalCompletions} completions and counting`,
        color: "bg-gradient-to-br from-blue-500 to-indigo-500",
      });
    }

    // Default encouragement if no achievements yet
    if (achs.length === 0) {
      achs.push({
        id: "getting-started",
        icon: "star" as const,
        title: "Let's Get Started!",
        description: "Complete your first habit today",
        color: "bg-gradient-to-br from-green-400 to-emerald-500",
      });
    }

    return achs;
  }, [completedCount, totalCount, currentStreak, allHabitLogs]);

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

  // Skip empty state - just show regular dashboard even with no habits

  return (
    <div className="min-h-screen enchanted-bg overflow-x-hidden">
      <MagicalCanvas />

      {/* Celebration components */}
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <CelebrationModal
        open={celebrationModal.open}
        onOpenChange={(open) => setCelebrationModal({ ...celebrationModal, open })}
        title={celebrationModal.title}
        description={celebrationModal.description}
        iconName={celebrationModal.iconName}
      />

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        {/* Enchanted Header */}
        <div className="glass-card rounded-3xl p-6 mb-6 magical-glow relative overflow-hidden shimmer-effect">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative float-animation">
                <Avatar className="w-14 h-14 border-3 border-white/30 shadow-lg relative">
                  <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                    {userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex items-center justify-center border-2 border-white/50 pulse-animation shadow-lg">
                  <Crown className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div>
                <h1
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(167, 139, 250, 0.8)' }}
                  data-testid="greeting-text"
                >
                  {getGreeting()}, {userName}
                </h1>
                <p className="text-sm text-white/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                  {formatDate()} - Keep growing!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Streak Ladder */}
              <div className="flex items-center gap-2">
                <Badge
                  className="rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-2 flex-1 sm:flex-initial justify-center bg-gradient-to-r from-teal-400/20 to-cyan-400/20 border-2 border-teal-400/40 text-teal-100 backdrop-blur-xl shadow-lg"
                  data-testid="streak-badge"
                >
                  <Zap className="w-4 h-4" />
                  <span>{currentStreak} day{currentStreak !== 1 ? 's' : ''}</span>
                </Badge>
                {/* Climbing ladder visualization */}
                {currentStreak > 0 && (
                  <div className="flex flex-col-reverse gap-0.5" title={`You've climbed ${currentStreak} rungs!`}>
                    {Array.from({ length: Math.min(currentStreak, 7) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-6 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full shadow-lg shadow-teal-400/50 animate-pulse"
                        style={{
                          animationDelay: `${i * 100}ms`,
                          opacity: 1 - (i * 0.1)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <Badge
                className="rounded-full px-6 py-2 text-lg font-bold flex-1 sm:flex-initial justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-white/30 shadow-lg"
                data-testid="completion-badge"
              >
                {completedCount}/{totalCount}
              </Badge>
            </div>
          </div>
        </div>

        {/* Achievement Spotlight */}
        <div className="mb-6">
          <AchievementSpotlight achievements={achievements} autoRotate={true} intervalMs={6000} />
        </div>

        {/* Active Goals Section - NEW! */}
        {goals.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-3xl font-extrabold text-white flex items-center gap-3"
                style={{
                  fontFamily: "'Comfortaa', cursive",
                  textShadow: '0 0 20px rgba(167, 139, 250, 0.8)'
                }}
              >
                <Target className="w-8 h-8 text-cyan-300" />
                Your Active Goals
              </h2>
              <Button
                onClick={() => setGoalDialogOpen(true)}
                className="rounded-full px-5 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-2 border-white/30 shadow-lg transition-all duration-300 hover:scale-105"
              >
                + New Goal
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {goals
                .filter(goal => {
                  const progress = (goal.currentValue / goal.targetValue) * 100;
                  return progress < 100; // Only show incomplete goals
                })
                .slice(0, 8) // Show max 8 goals on dashboard (since they're smaller now)
                .map(goal => (
                  <GoalBadge
                    key={goal.id}
                    goal={goal}
                    onClick={() => window.location.href = '/goals'}
                  />
                ))}
            </div>

            {goals.filter(g => (g.currentValue / g.targetValue) * 100 < 100).length > 8 && (
              <div className="text-center mt-4">
                <Button
                  onClick={() => window.location.href = '/goals'}
                  variant="ghost"
                  className="text-white/70 hover:text-white"
                >
                  View All Goals ({goals.filter(g => (g.currentValue / g.targetValue) * 100 < 100).length}) →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Week at a Glance */}
        <div className="mb-6">
          <WeekAtAGlance />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Enchanted Pet Card */}
            <VirtualPet />

            {/* Magical Insights */}
            <div className="glass-card-blue rounded-3xl p-6 magical-glow" style={{animationDelay: '1s'}}>
              <h3
                className="text-base font-bold text-teal-400 mb-5 flex items-center gap-2"
                style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(20, 184, 166, 0.5)' }}
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

            {/* Monthly Goals Widget */}
            <MonthlyGoalsWidget />

            {/* Dream Scroll Widget */}
            <DreamScrollWidget />
          </div>

          {/* Right Content Area */}
          <div className="flex flex-col gap-6 pb-20 md:pb-0">
            {/* Weekly Goals Widget */}
            <WeeklyGoalsWidget />

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
                    <Sparkles className="w-6 h-6 text-teal-400" style={{filter: 'drop-shadow(0 0 10px rgba(20, 184, 166, 0.8))'}} />
                  </div>
                  <div className="space-y-3">
                    {todayHabits.length === 0 ? (
                      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 text-center border-2 border-white/10 text-white/70">
                        No habits scheduled for today yet. Create or assign one to see it here.
                      </div>
                    ) : (
                      todayHabits.map(habit => (
                        <HabitToggleRow
                          key={habit.id}
                          title={habit.title}
                          icon={habit.icon}
                          color={habit.color}
                          completed={habit.completed}
                          onToggle={() => handleToggleHabit(habit.id, habit.completed)}
                          onLongPress={() => handleLongPress(habit)}
                          className={cn(
                            "border-white/10 hover:border-green-500/40",
                            habit.completed && "border-green-500/50 bg-green-500/30"
                          )}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Magical Weekly Progress */}
                <div className="glass-card-blue rounded-3xl p-8 magical-glow" style={{animationDelay: '1.5s'}}>
                  <h3
                    className="text-lg font-bold text-white mb-6 flex items-center gap-2"
                    style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
                  >
                    This Week's Progress
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
                              ? "border-teal-400 bg-gradient-to-br from-teal-400/30 to-cyan-400/30 text-white pulse-glow shadow-lg"
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
              <div className="fade-in" data-testid="calendar-panel">
                <CalendarView />
              </div>
            )}

            {activeTab === "todos" && (
              <div className="glass-card rounded-3xl p-16 text-center fade-in">
                <h2
                  className="text-3xl font-bold text-white mb-4"
                  style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
                >
                  To-Do List
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
