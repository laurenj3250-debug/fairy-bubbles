import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Goal } from "@shared/schema";

interface GoalProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}

export function GoalProgressDialog({ open, onOpenChange, goal }: GoalProgressDialogProps) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  const addProgressMutation = useMutation({
    mutationFn: async (data: { goalId: number; userId: number; value: number; note?: string; date: string }) => {
      return await apiRequest("/api/goal-updates", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/points"], exact: false });
      toast({ 
        title: "Progress added", 
        description: "Your goal progress has been updated" 
      });
      onOpenChange(false);
      setValue("");
      setNote("");
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to add progress", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !value) return;

    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue <= 0) {
      toast({ 
        title: "Invalid value", 
        description: "Please enter a positive number", 
        variant: "destructive" 
      });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    addProgressMutation.mutate({
      goalId: goal.id,
      userId: goal.userId,
      value: numValue,
      note: note || undefined,
      date: today,
    });
  };

  if (!goal) return null;

  const newValue = goal.currentValue + (parseInt(value) || 0);
  const newProgress = Math.min((newValue / goal.targetValue) * 100, 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="goal-progress-dialog">
        <DialogHeader>
          <DialogTitle>Add Progress</DialogTitle>
          <DialogDescription>
            Update your progress for "{goal.title}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="progress-value">
              Add {goal.unit} (current: {goal.currentValue}/{goal.targetValue})
            </Label>
            <Input
              id="progress-value"
              type="number"
              min="1"
              placeholder={`e.g., 5 ${goal.unit}`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              data-testid="input-goal-progress"
              autoFocus
            />
          </div>

          {value && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">New total:</span>
                <span className="font-semibold">
                  {newValue}/{goal.targetValue} {goal.unit} ({Math.round(newProgress)}%)
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="progress-note">Note (optional)</Label>
            <Textarea
              id="progress-note"
              placeholder="Add a note about this update..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              data-testid="input-goal-note"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!value || addProgressMutation.isPending}
              data-testid="button-add-progress"
            >
              Add Progress
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
