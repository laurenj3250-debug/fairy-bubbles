import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import { MountainBackground } from "@/components/MountainBackground";
import Dashboard from "@/pages/DashboardNew";
import Habits from "@/pages/HabitsMountain";
import Goals from "@/pages/Goals";
import Todos from "@/pages/Todos";
// import WeeklyView from "@/pages/WeeklyView"; // REMOVED: Consolidated into WeeklyHub
import WeeklyHub from "@/pages/WeeklyHub";
// REMOVED LEGACY GAME PAGES:
// import Pet from "@/pages/Pet";
// import ShopPage from "@/pages/ShopPage";
import AlpineShop from "@/pages/AlpineShop";
import WorldMap from "@/pages/WorldMap";
import ExpeditionPlanning from "@/pages/ExpeditionPlanning";
// import Wonderland from "@/pages/Wonderland";
// import OutsideWorld from "@/pages/OutsideWorld";
// import BiomeExploration from "@/pages/BiomeExploration";
// import Combat from "@/pages/Combat";
// import PartyManagement from "@/pages/PartyManagement";
// import SpriteUpload from "@/pages/SpriteUpload";
// import SpriteOrganize from "@/pages/SpriteOrganize";
// import LevelEditor from "@/pages/LevelEditor";
// import GameDataAdmin from "@/pages/GameDataAdmin";
import DreamScroll from "@/pages/DreamScrollMountain";
import SignupPage from "@/pages/Signup";
import LoginPage from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

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
          <Redirect to="/weekly-hub" />
        </RequireAuth>
      </Route>
      <Route path="/dashboard">
        <RequireAuth>
          <Dashboard />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/habits">
        <RequireAuth>
          <Habits />
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
      {/* Redirect /weekly to /weekly-hub */}
      <Route path="/weekly">
        <RequireAuth>
          <Redirect to="/weekly-hub" />
        </RequireAuth>
      </Route>
      <Route path="/weekly-hub">
        <RequireAuth>
          <WeeklyHub />
          <BottomNav />
        </RequireAuth>
      </Route>
      {/* REMOVED LEGACY ROUTES:
      <Route path="/pet"> - Pet page
      <Route path="/shop"> - Costume shop
      <Route path="/combat/:encounterId"> - Combat
      <Route path="/party"> - Party Management
      <Route path="/wonderland"> - Wonderland
      <Route path="/outside-world"> - Outside World
      <Route path="/explore/:biomeId"> - Biome Exploration
      <Route path="/sprites/upload"> - Sprite Upload
      <Route path="/sprites/organize"> - Sprite Organize
      <Route path="/level-editor"> - Level Editor
      <Route path="/game/admin"> - Game Data Admin
      */}
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
      <Route path="/expedition/plan/:mountainId">
        <RequireAuth>
          <ExpeditionPlanning />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/dream-scroll">
        <RequireAuth>
          <DreamScroll />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <MountainBackground />
          <Toaster />
          <AppRoutes />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
