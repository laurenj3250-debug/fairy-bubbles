import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/MainLayout";
import { ProgressBackground } from "@/components/ProgressBackground";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import BaseCamp from "@/pages/BaseCamp";
import Habits from "@/pages/Habits";
import HabitInsights from "@/pages/HabitInsights";
import Goals from "@/pages/Goals";
import Todos from "@/pages/Todos";
// DEPRECATED: Alpine Shop replaced by personal Rewards system
// import AlpineShop from "@/pages/AlpineShop";
import WorldMap from "@/pages/WorldMap";
// ARCHIVED: Alpine Expeditions (System A)
// import ExpeditionPlanning from "@/pages/ExpeditionPlanning";
// import ExpeditionLogbook from "@/pages/ExpeditionLogbook";
import ExpeditionMissions from "@/pages/ExpeditionMissions";
import DreamScroll from "@/pages/DreamScrollMountain";
import Settings from "@/pages/Settings";
import ImportSettings from "@/pages/ImportSettings";
import SummitJournal from "@/pages/SummitJournal";
import SignupPage from "@/pages/Signup";
import LoginPage from "@/pages/Login";
import NotFound from "@/pages/not-found";
import V2Dashboard from "@/pages/V2Dashboard";
import IcyDash from "@/pages/IcyDash";
import WeeklyPlannerPage from "@/pages/WeeklyPlannerPage";
import Journey from "@/pages/Journey";
// REMOVED: Study Planner (board exam prep feature - no longer needed)
import YearlyGoals from "@/pages/YearlyGoals";
import ResidencyTracker from "@/pages/ResidencyTracker";
import MediaLibrary from "@/pages/MediaLibrary";
import Adventures from "@/pages/Adventures";
import RewardsPage from "@/pages/Rewards";
import Analytics from "@/pages/Analytics";
import WellnessWheel from "@/pages/WellnessWheel";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BackgroundProvider } from "@/contexts/BackgroundContext";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { useMountainTheme } from "@/hooks/useMountainTheme";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";

// Component that requires authentication
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          border: "4px solid rgba(94, 234, 212, 0.3)",
          borderTop: "4px solid rgb(94, 234, 212)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const timeOfDay = useTimeOfDay();
  const { user } = useAuth();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Fetch habits to check for streak
  const { data: habits = [] } = useQuery<any[]>({
    queryKey: ["/api/habits-with-data"],
    enabled: !!user,
  });

  // Check for high streak (7+ days)
  useEffect(() => {
    const longestStreak = habits.reduce((max, habit) => {
      const streak = habit.streak?.streak || 0;
      return Math.max(max, streak);
    }, 0);

    const hasStreak = longestStreak >= 7;
    document.documentElement.setAttribute('data-has-streak', hasStreak ? 'true' : 'false');
  }, [habits]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // "?" opens keyboard shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />

      {/* V2 Layout Experiment - no BottomNav (has own nav rail) */}
      <Route path="/v2">
        <RequireAuth>
          <V2Dashboard />
        </RequireAuth>
      </Route>

      {/* Main Dashboard - IcyDash */}
      <Route path="/">
        <RequireAuth>
          <MainLayout variant="sidebar">
            <IcyDash />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/habits">
        <RequireAuth>
          <MainLayout variant="sidebar">
            <Habits />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/habit-insights">
        <RequireAuth>
          <MainLayout>
            <HabitInsights />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/analytics">
        <RequireAuth>
          <MainLayout variant="sidebar">
            <Analytics />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/goals">
        <RequireAuth>
          <MainLayout variant="sidebar">
            <Goals />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/todos">
        <RequireAuth>
          <MainLayout variant="sidebar">
            <Todos />
          </MainLayout>
        </RequireAuth>
      </Route>
      {/* Redirect /weekly to / */}
      <Route path="/weekly">
        <RequireAuth>
          <Redirect to="/" />
        </RequireAuth>
      </Route>
      <Route path="/weekly-hub">
        <RequireAuth>
          <Redirect to="/" />
        </RequireAuth>
      </Route>
      {/* Alpine Shop deprecated — redirect to personal Rewards */}
      <Route path="/alpine-shop">
        <RequireAuth>
          <Redirect to="/rewards" />
        </RequireAuth>
      </Route>
      <Route path="/world-map">
        <RequireAuth>
          <MainLayout>
            <WorldMap />
          </MainLayout>
        </RequireAuth>
      </Route>
      {/* ARCHIVED: Alpine Expeditions (System A) - Kept for reference
      <Route path="/expedition/plan/:mountainId">
        <RequireAuth>
          <MainLayout>
            <ExpeditionPlanning />
          </MainLayout>
        </RequireAuth>
      </Route>
      */}
      <Route path="/expedition-missions">
        <RequireAuth>
          <MainLayout>
            <ExpeditionMissions />
          </MainLayout>
        </RequireAuth>
      </Route>
      {/* ARCHIVED: Logbook merged into main Expedition Missions page
      <Route path="/expedition-logbook">
        <RequireAuth>
          <MainLayout>
            <ExpeditionLogbook />
          </MainLayout>
        </RequireAuth>
      </Route>
      */}
      <Route path="/dream-scroll">
        <RequireAuth>
          <MainLayout>
            <DreamScroll />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/settings">
        <RequireAuth>
          <MainLayout variant="sidebar">
            <Settings />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/settings/import">
        <RequireAuth>
          <MainLayout>
            <ImportSettings />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/summit-journal">
        <RequireAuth>
          <MainLayout>
            <SummitJournal />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/journey">
        <RequireAuth>
          <MainLayout variant="sidebar">
            <Journey />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/planner">
        <RequireAuth>
          <MainLayout>
            <WeeklyPlannerPage />
          </MainLayout>
        </RequireAuth>
      </Route>
      {/* REMOVED: /study route (Study Planner board exam prep feature - no longer needed) */}
      <Route path="/yearly-goals">
        <RequireAuth>
          <MainLayout>
            <YearlyGoals />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/residency">
        <RequireAuth>
          <ResidencyTracker />
        </RequireAuth>
      </Route>
      <Route path="/media">
        <RequireAuth>
          <MainLayout>
            <MediaLibrary />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/adventures">
        <RequireAuth>
          <MainLayout>
            <Adventures />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/rewards">
        <RequireAuth>
          <MainLayout>
            <RewardsPage />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/wheel">
        <RequireAuth>
          <WellnessWheel />
        </RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>

    {/* Global Keyboard Shortcuts Modal */}
    <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}

function App() {
  // Initialize mountain theme at app root to ensure CSS variables are set
  // before any components render (fixes climbing holds color initialization)
  useMountainTheme();

  return (
    <ErrorBoundary fallbackMessage="GoalConnect encountered an error">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BackgroundProvider>
            <TooltipProvider>
              <ErrorBoundary fallbackMessage="Page failed to load">
                <ProgressBackground>
                  <Toaster />
                  <OfflineIndicator />
                  <AppRoutes />
                </ProgressBackground>
              </ErrorBoundary>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </TooltipProvider>
          </BackgroundProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
