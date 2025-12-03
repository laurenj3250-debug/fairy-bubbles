import { useQuery, useMutation } from "@tanstack/react-query";
import type { Goal, Todo } from "@shared/schema";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Target, Plus, Check, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MonthlyGoalsProps {
  className?: string;
}

export function MonthlyGoals({ className }: MonthlyGoalsProps) {
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  // Get current month in YYYY-MM format
  const currentMonth = format(new Date(), "yyyy-MM");
  const currentMonthDisplay = format(new Date(), "MMMM");

  // Fetch goals
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Fetch todos to calculate progress
  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Filter for current month's goals (non-archived)
  // Goals with month = currentMonth OR goals without month field (legacy goals)
  const currentMonthGoals = useMemo(() => {
    return goals.filter((goal) => {
      // Skip archived goals
      if ((goal as any).archived) return false;
      // Show goals for current month or goals without month (legacy)
      const goalMonth = (goal as any).month;
      return !goalMonth || goalMonth === currentMonth;
    });
  }, [goals, currentMonth]);

  // Calculate progress for each goal based on linked todos
  const goalsWithProgress = useMemo(() => {
    return currentMonthGoals.map((goal) => {
      const linkedTodos = todos.filter((todo) => (todo as any).goalId === goal.id);
      const completedTodos = linkedTodos.filter((todo) => todo.completed);

      // Progress can be either from linked todos or from goal's own currentValue/targetValue
      let progress = 0;
      if (linkedTodos.length > 0) {
        progress = (completedTodos.length / linkedTodos.length) * 100;
      } else if (goal.targetValue > 0) {
        progress = (goal.currentValue / goal.targetValue) * 100;
      }

      return {
        ...goal,
        linkedTodosCount: linkedTodos.length,
        completedTodosCount: completedTodos.length,
        progress: Math.min(100, Math.round(progress)),
      };
    });
  }, [currentMonthGoals, todos]);

  // Add new monthly goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (title: string) => {
      return await apiRequest("/api/goals", "POST", {
        title,
        description: "",
        targetValue: 100,
        currentValue: 0,
        unit: "%",
        deadline: format(new Date(), "yyyy-12-31"), // End of year
        category: "personal",
        month: currentMonth,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setNewGoalTitle("");
      setAddGoalOpen(false);
    },
  });

  const handleAddGoal = () => {
    if (newGoalTitle.trim()) {
      addGoalMutation.mutate(newGoalTitle.trim());
    }
  };

  return (
    <div className={cn("glass-card interactive-glow p-6 rounded-3xl", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{currentMonthDisplay} Goals</h2>
        </div>
        <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              disabled={currentMonthGoals.length >= 4}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add {currentMonthDisplay} Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="goal-title">What do you want to achieve this month?</Label>
                <Input
                  id="goal-title"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g., Complete React course"
                  onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
                />
              </div>
              <Button
                onClick={handleAddGoal}
                disabled={!newGoalTitle.trim() || addGoalMutation.isPending}
                className="w-full"
              >
                {addGoalMutation.isPending ? "Adding..." : "Add Goal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      {goalsWithProgress.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm mb-1">
            No goals set for {currentMonthDisplay}
          </p>
          <p className="text-muted-foreground/70 text-xs">
            Set 2-4 goals to focus your efforts
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {goalsWithProgress.map((goal) => (
            <div
              key={goal.id}
              className="bg-card/50 rounded-xl p-4 hover:bg-card/80 transition-all"
            >
              <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2">
                {goal.title}
              </h3>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      goal.progress >= 100
                        ? "bg-green-500"
                        : goal.progress >= 50
                        ? "bg-primary"
                        : "bg-primary/50"
                    )}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              {/* Progress Text */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{goal.progress}%</span>
                {goal.linkedTodosCount > 0 && (
                  <span>
                    {goal.completedTodosCount}/{goal.linkedTodosCount} tasks
                  </span>
                )}
                {goal.progress >= 100 && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer link */}
      <div className="mt-4 pt-4 border-t border-card-border">
        <Link href="/goals">
          <a className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
            Manage all goals
            <ChevronRight className="w-4 h-4" />
          </a>
        </Link>
      </div>
    </div>
  );
}
