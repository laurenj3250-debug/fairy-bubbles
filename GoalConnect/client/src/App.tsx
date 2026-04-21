import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/MainLayout";
// ProgressBackground removed — each page has its own SundownPageWrapper
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import Habits from "@/pages/Habits";
import HabitInsights from "@/pages/HabitInsights";
import Goals from "@/pages/Goals";
import DreamScroll from "@/pages/DreamScrollMountain";
import Settings from "@/pages/Settings";
import ImportSettings from "@/pages/ImportSettings";
import SignupPage from "@/pages/Signup";
import LoginPage from "@/pages/Login";
import NotFound from "@/pages/not-found";
import SundownDash from "@/pages/SundownDash";
import Fresh from "@/pages/Fresh";
import Journey from "@/pages/Journey";
import YearlyGoals from "@/pages/YearlyGoals";
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

      {/* Main Dashboard - SundownDash (no MainLayout — has its own nav) */}
      <Route path="/">
        <RequireAuth>
          <SundownDash />
        </RequireAuth>
      </Route>
      <Route path="/fresh">
        <RequireAuth>
          <Fresh />
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
      <Route path="/journey">
        <RequireAuth>
          <MainLayout variant="sidebar">
            <Journey />
          </MainLayout>
        </RequireAuth>
      </Route>
      <Route path="/yearly-goals">
        <RequireAuth>
          <MainLayout>
            <YearlyGoals />
          </MainLayout>
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
                  <Toaster />
                  <OfflineIndicator />
                  <AppRoutes />
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
