import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import { EnchantedForestBackground } from "@/components/EnchantedForestBackground";
import Dashboard from "@/pages/Dashboard";
import Habits from "@/pages/Habits";
import Goals from "@/pages/Goals";
import TodoList from "@/pages/TodoList";
import Calendar from "@/pages/Calendar";
import Planner from "@/pages/Planner";
import Analytics from "@/pages/Analytics";
import Pet from "@/pages/Pet";
import ShopPage from "@/pages/ShopPage";
import Settings from "@/pages/Settings";
import SignupPage from "@/pages/Signup";
import LoginPage from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { AuthGate } from "@/components/AuthGate";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function ProtectedRoutes() {
  console.log("ProtectedRoutes rendering");
  return (
    <AuthGate>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/habits" component={Habits} />
        <Route path="/goals" component={Goals} />
        <Route path="/todos" component={TodoList} />
        <Route path="/planner" component={Planner} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/pet" component={Pet} />
        <Route path="/shop" component={ShopPage} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </AuthGate>
  );
}

function DebugInfo() {
  const [location] = useLocation();
  const { user, loading } = useAuth();

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      background: "rgba(255, 0, 0, 0.9)",
      color: "white",
      padding: "10px",
      zIndex: 99999,
      fontSize: "14px",
      fontFamily: "monospace"
    }}>
      Route: {location} | Loading: {loading ? "true" : "false"} | User: {user ? user.email : "null"}
    </div>
  );
}

function App() {
  console.log("App rendering");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <EnchantedForestBackground />
          <DebugInfo />
          <Toaster />
          <Switch>
            {/* Public routes - no auth required */}
            <Route path="/login" component={LoginPage} />
            <Route path="/signup" component={SignupPage} />

            {/* All other routes require authentication */}
            <Route path="/:rest*">
              <ProtectedRoutes />
            </Route>
          </Switch>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
