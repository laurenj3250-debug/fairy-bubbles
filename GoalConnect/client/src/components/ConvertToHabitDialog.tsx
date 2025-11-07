import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Todo, Goal } from "@shared/schema";
import { Repeat, Target } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConvertToHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo: Todo | null;
}

export function ConvertToHabitDialog({ open, onOpenChange, todo }: ConvertToHabitDialogProps) {
  const { toast } = useToast();
  const [cadence, setCadence] = useState<"daily" | "weekly">("daily");
  const [targetPerWeek, setTargetPerWeek] = useState("3");
  const [linkedGoalId, setLinkedGoalId] = useState<string>("");

  // Fetch goals for linking
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    queryFn: () => apiRequest("/api/goals", "GET"),
  });

  const createHabitMutation = useMutation({
    mutationFn: async () => {
      if (!todo) return;

      return apiRequest("/api/habits", "POST", {
        title: todo.title,
        description: todo.description,
        icon: "🔄", // Default icon for converted tasks
        color: "#8B5CF6", // Purple color
        cadence,
        targetPerWeek: cadence === "weekly" ? parseInt(targetPerWeek) : null,
        difficulty: todo.difficulty,
        linkedGoalId: linkedGoalId ? parseInt(linkedGoalId) : (todo.linkedGoalId || null),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Habit created! 🔄",
        description: `"${todo?.title}" is now a recurring habit`,
      });
      onOpenChange(false);
      setCadence("daily");
      setTargetPerWeek("3");
      setLinkedGoalId("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create habit",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createHabitMutation.mutate();
  };

  if (!todo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            Convert to Habit
          </DialogTitle>
          <DialogDescription>
            Turn "{todo.title}" into a recurring habit
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cadence */}
          <div className="space-y-2">
            <Label>How often?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCadence("daily")}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${cadence === "daily"
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="text-sm font-semibold mb-1">Daily</div>
                <div className="text-xs text-muted-foreground">Every day</div>
              </button>
              <button
                type="button"
                onClick={() => setCadence("weekly")}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${cadence === "weekly"
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="text-sm font-semibold mb-1">Weekly</div>
                <div className="text-xs text-muted-foreground">X times/week</div>
              </button>
            </div>
          </div>

          {/* Target per week (if weekly) */}
          {cadence === "weekly" && (
            <div className="space-y-2">
              <Label htmlFor="targetPerWeek">Times per week</Label>
              <Select value={targetPerWeek} onValueChange={setTargetPerWeek}>
                <SelectTrigger id="targetPerWeek">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'time' : 'times'} per week
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Link to Goal */}
          {goals.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="linkedGoal" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Link to Goal
              </Label>
              <Select
                value={linkedGoalId || (todo.linkedGoalId?.toString() || "")}
                onValueChange={setLinkedGoalId}
              >
                <SelectTrigger id="linkedGoal">
                  <SelectValue placeholder="Select a goal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No goal</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id.toString()}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {todo.linkedGoalId && (
                <p className="text-xs text-muted-foreground">
                  Inheriting goal link from task
                </p>
              )}
            </div>
          )}

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="text-muted-foreground">
              The original task will remain in your todo list. You can delete it after creating the habit.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createHabitMutation.isPending}
            >
              {createHabitMutation.isPending ? "Creating..." : "Create Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
