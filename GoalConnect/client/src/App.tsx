import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import { EnchantedForestBackground } from "@/components/EnchantedForestBackground";
import Dashboard from "@/pages/DashboardNew";
import Habits from "@/pages/Habits";
import Goals from "@/pages/Goals";
import Todos from "@/pages/Todos";
import WeeklyView from "@/pages/WeeklyView";
import Pet from "@/pages/Pet";
import ShopPage from "@/pages/ShopPage";
import Wonderland from "@/pages/Wonderland";
import OutsideWorld from "@/pages/OutsideWorld";
import Combat from "@/pages/Combat";
import SpriteUpload from "@/pages/SpriteUpload";
import SignupPage from "@/pages/Signup";
import LoginPage from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

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
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />

      {/* Protected routes */}
      <Route path="/">
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
      <Route path="/weekly">
        <RequireAuth>
          <WeeklyView />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/pet">
        <RequireAuth>
          <Pet />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/shop">
        <RequireAuth>
          <ShopPage />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/wonderland">
        <RequireAuth>
          <Wonderland />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/outside-world">
        <RequireAuth>
          <OutsideWorld />
          <BottomNav />
        </RequireAuth>
      </Route>
      <Route path="/combat/:encounterId">
        {(params) => (
          <RequireAuth>
            <Combat encounterId={parseInt(params.encounterId)} />
            <BottomNav />
          </RequireAuth>
        )}
      </Route>
      <Route path="/sprites/upload">
        <RequireAuth>
          <SpriteUpload />
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
          <EnchantedForestBackground />
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
