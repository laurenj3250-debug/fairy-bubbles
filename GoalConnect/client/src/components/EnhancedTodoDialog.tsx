import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Sparkles, Target } from "lucide-react";
import type { Goal } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EnhancedTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnhancedTodoDialog({ open, onOpenChange }: EnhancedTodoDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [linkedGoalId, setLinkedGoalId] = useState<string>("");

  // Fetch goals for linking
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    queryFn: () => apiRequest("/api/goals", "GET"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/todos", "POST", {
        title,
        description,
        dueDate: dueDate || null,
        difficulty,
        linkedGoalId: linkedGoalId ? parseInt(linkedGoalId) : null,
        completed: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({
        title: "Task created! ✨",
        description: "Your new task has been added",
      });
      // Reset form
      setTitle("");
      setDescription("");
      setDueDate("");
      setDifficulty("medium");
      setLinkedGoalId("");
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate();
  };

  const points = {
    easy: 5,
    medium: 10,
    hard: 15,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create New Task
          </DialogTitle>
          <DialogDescription>
            Add a task and earn coins when you complete it!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Review PR #47"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Due Date (optional)
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Link to Goal */}
          {goals.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="linkedGoal" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Link to Goal (optional)
              </Label>
              <Select value={linkedGoalId} onValueChange={setLinkedGoalId}>
                <SelectTrigger id="linkedGoal">
                  <SelectValue placeholder="Select a goal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No goal</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id.toString()}>
                      {goal.title} ({goal.currentValue}/{goal.targetValue} {goal.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Completing this task will update your goal progress
              </p>
            </div>
          )}

          {/* Difficulty */}
          <div className="space-y-2">
            <Label>Difficulty (affects coins earned)</Label>
            <div className="grid grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${difficulty === diff
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <div className="text-sm font-semibold capitalize mb-1">{diff}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    🪙 {points[diff]}
                  </div>
                </button>
              ))}
            </div>
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
              disabled={createMutation.isPending || !title.trim()}
            >
              {createMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
