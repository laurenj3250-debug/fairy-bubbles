import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FAB } from "@/components/FAB";
import { ProgressRing } from "@/components/ProgressRing";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Goal } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalDialog } from "@/components/GoalDialog";
import { GoalProgressDialog } from "@/components/GoalProgressDialog";
import { useState } from "react";

export default function Goals() {
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/goals/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"], exact: false });
    },
  });

  const handleFabClick = () => {
    setGoalDialogOpen(true);
  };

  const handleDeleteGoal = (id: number) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      deleteGoalMutation.mutate(id);
    }
  };

  const handleAddProgress = (goal: Goal) => {
    setSelectedGoal(goal);
    setProgressDialogOpen(true);
  };

  if (goalsLoading) {
    return (
      <div className="min-h-screen pb-20">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto p-4 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <FAB onClick={handleFabClick} />
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto p-4">
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Set your first goal and start tracking your progress"
            actionLabel="Create Goal"
            onAction={handleFabClick}
          />
        </main>
        <FAB onClick={handleFabClick} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Your Goals</h2>
          <span className="text-sm text-muted-foreground">{goals.length} goals</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const progress = (goal.currentValue / goal.targetValue) * 100;
            const daysUntil = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysUntil < 0;
            const isUrgent = daysUntil >= 0 && daysUntil <= 7;

            return (
              <Card
                key={goal.id}
                className="hover-elevate transition-all"
                data-testid={`goal-card-${goal.id}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {goal.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-base line-clamp-2">{goal.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {goal.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 w-8 h-8"
                    onClick={() => handleDeleteGoal(goal.id)}
                    data-testid={`button-delete-goal-${goal.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <ProgressRing progress={progress} size={80} strokeWidth={10} />
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold tabular-nums">
                          {goal.currentValue}
                          <span className="text-muted-foreground">/{goal.targetValue}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{goal.unit}</div>
                      </div>
                      <Badge
                        variant={isOverdue ? "destructive" : isUrgent ? "default" : "secondary"}
                        className="flex items-center gap-1.5"
                      >
                        <Calendar className="w-3 h-3" />
                        {isOverdue ? "Overdue" : `${daysUntil}d left`}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-medium">{formatDate(goal.deadline)}</span>
                  </div>

                  <Button
                    className="w-full gap-2"
                    onClick={() => handleAddProgress(goal)}
                    data-testid={`button-add-progress-${goal.id}`}
                  >
                    <Plus className="w-4 h-4" />
                    Add Progress
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      
      <FAB onClick={handleFabClick} />
      <GoalDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} />
      <GoalProgressDialog
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        goal={selectedGoal}
      />
    </div>
  );
}
