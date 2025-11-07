import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Habit } from "@shared/schema";
import { getToday } from "@/lib/utils";

interface HabitLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
}

export function HabitLogDialog({ open, onOpenChange, habit }: HabitLogDialogProps) {
  const { toast } = useToast();
  const [note, setNote] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!habit) return;
      
      return apiRequest("/api/habit-logs", "POST", {
        habitId: habit.id,
        date: getToday(),
        completed: true,
        note: note || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"], exact: false });
      toast({ title: "Habit logged", description: "Your note has been saved" });
      setNote("");
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save note", variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (!habit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="habit-log-dialog">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Add a note to track details about this habit completion
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
            >
              <span className="text-xl">{habit.icon}</span>
            </div>
            <div>
              <h3 className="font-medium">{habit.title}</h3>
              <p className="text-sm text-muted-foreground">{getToday()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How did it go? Any observations or thoughts?"
              rows={4}
              className="resize-none"
              data-testid="input-habit-note"
            />
          </div>
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
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-save-note"
          >
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
