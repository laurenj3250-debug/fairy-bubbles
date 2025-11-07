import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Check } from "lucide-react";
import { HabitDialog } from "@/components/HabitDialog";
import { getToday } from "@/lib/utils";

export default function Habits() {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  const { data: habits = [], isLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: todayLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", getToday()],
  });

  // Debug logging
  console.log("Habits data:", habits);
  console.log("Today logs:", todayLogs);

  const deleteHabitMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/habits/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    },
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date: getToday(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Delete this habit?")) {
      deleteHabitMutation.mutate(id);
    }
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingHabit(undefined);
    setHabitDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setHabitDialogOpen(false);
    setEditingHabit(undefined);
  };

  const isCompletedToday = (habitId: number) => {
    return todayLogs.some(log => log.habitId === habitId && log.completed);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Habits</h1>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Habit
          </Button>
        </div>

        {habits.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No habits yet</p>
              <Button onClick={handleCreateNew}>Create your first habit</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => {
              const completed = isCompletedToday(habit.id);
              return (
                <Card key={habit.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {habit.title}
                          {completed && (
                            <span className="text-green-600">
                              <Check className="w-5 h-5" />
                            </span>
                          )}
                        </CardTitle>
                        {habit.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {habit.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(habit.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cadence:</span>
                      <span className="font-medium capitalize">{habit.cadence}</span>
                    </div>
                    {habit.cadence === "weekly" && habit.targetPerWeek && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Target:</span>
                        <span className="font-medium">{habit.targetPerWeek} times per week</span>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      variant={completed ? "secondary" : "default"}
                      onClick={() => toggleHabitMutation.mutate(habit.id)}
                    >
                      {completed ? "Completed Today ✓" : "Mark Complete"}
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleEdit(habit)}
                    >
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <HabitDialog
        open={habitDialogOpen}
        onClose={handleCloseDialog}
        habit={editingHabit}
      />
    </div>
  );
}
