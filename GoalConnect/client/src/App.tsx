import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import { ProgressBackground } from "@/components/ProgressBackground";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import BaseCamp from "@/pages/BaseCamp";
import DashboardNew from "@/pages/DashboardNew";
import Habits from "@/pages/Habits";
import HabitInsights from "@/pages/HabitInsights";
import Goals from "@/pages/Goals";
import Todos from "@/pages/Todos";
import WeeklyHub from "@/pages/WeeklyHub";
import AlpineShop from "@/pages/AlpineShop";
import WorldMap from "@/pages/WorldMap";
// ARCHIVED: Alpine Expeditions (System A)
// import ExpeditionPlanning from "@/pages/ExpeditionPlanning";
// import ExpeditionLogbook from "@/pages/ExpeditionLogbook";
import ExpeditionMissions from "@/pages/ExpeditionMissions";
import DreamScroll from "@/pages/DreamScrollMountain";
import Settings from "@/pages/Settings";
import ImportSettings from "@/pages/ImportSettings";
import SignupPage from "@/pages/Signup";
import LoginPage from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BackgroundProvider } from "@/contexts/BackgroundContext";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { useMountainTheme } from "@/hooks/useMountainTheme";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Component that requires authentication
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  console.log("[RequireAuth] Checking auth:", { loading, hasUser: !!user });

  if (loading) {
    console.log("[RequireAuth] Still loading, showing spinner");
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
    console.log("[RequireAuth] No user, redirecting to /login");
    return <Redirect to="/login" />;
  }

  console.log("[RequireAuth] User authenticated, rendering children");
  return <>{children}</>;
}

function AppRoutes() {
  const timeOfDay = useTimeOfDay();
  const { user } = useAuth();

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

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />

      {/* Protected routes */}
      <Route path="/">
        <RequireAuth>
          <BaseCamp />
          <BottomNav />
        </RequireAuth>
      </Route>
      {/* Legacy routes - kept during migration */}
      <Route path="/weekly-hub-old">
        <RequireAuth>
          <WeeklyHub />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/dashboard">
        <RequireAuth>
          <DashboardNew />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/habits">
        <RequireAuth>
          <Habits />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/habit-insights">
        <RequireAuth>
          <HabitInsights />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/goals">
        <RequireAuth>
          <Goals />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/todos">
        <RequireAuth>
          <Todos />
          <BottomNav />
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
      <Route path="/alpine-shop">
        <RequireAuth>
          <AlpineShop />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/world-map">
        <RequireAuth>
          <WorldMap />
          <BottomNav />
        </RequireAuth>
      </Route>
      {/* ARCHIVED: Alpine Expeditions (System A) - Kept for reference
      <Route path="/expedition/plan/:mountainId">
        <RequireAuth>
          <ExpeditionPlanning />
          <BottomNav />
        </RequireAuth>
      </Route>
      */}
      <Route path="/expedition-missions">
        <RequireAuth>
          <ExpeditionMissions />
          <BottomNav />
        </RequireAuth>
      </Route>
      {/* ARCHIVED: Logbook merged into main Expedition Missions page
      <Route path="/expedition-logbook">
        <RequireAuth>
          <ExpeditionLogbook />
          <BottomNav />
        </RequireAuth>
      </Route>
      */}
      <Route path="/dream-scroll">
        <RequireAuth>
          <DreamScroll />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/settings">
        <RequireAuth>
          <Settings />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/settings/import">
        <RequireAuth>
          <ImportSettings />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
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
