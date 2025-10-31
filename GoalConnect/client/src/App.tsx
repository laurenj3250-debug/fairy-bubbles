import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import Dashboard from "@/pages/Dashboard";
import Habits from "@/pages/Habits";
import Goals from "@/pages/Goals";
import TodoList from "@/pages/TodoList";
import Calendar from "@/pages/Calendar";
import Pet from "@/pages/Pet";
import ShopPage from "@/pages/ShopPage";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/habits" component={Habits} />
        <Route path="/goals" component={Goals} />
        <Route path="/todos" component={TodoList} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/pet" component={Pet} />
        <Route path="/shop" component={ShopPage} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
