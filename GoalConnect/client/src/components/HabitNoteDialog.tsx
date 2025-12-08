import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Habit } from '@shared/schema';

interface HabitNoteDialogProps {
  habit: Habit | null;
  date: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (habitId: number, date: string, note: string) => void;
  existingNote?: string;
}

export function HabitNoteDialog({
  habit,
  date,
  open,
  onOpenChange,
  onSubmit,
  existingNote = '',
}: HabitNoteDialogProps) {
  const [note, setNote] = useState(existingNote);

  // Reset note when dialog opens with new habit
  useEffect(() => {
    if (open) {
      setNote(existingNote);
    }
  }, [open, existingNote]);

  const handleSubmit = () => {
    if (!habit) return;
    onSubmit(habit.id, date, note.trim());
    onOpenChange(false);
    setNote('');
  };

  const handleSkip = () => {
    if (!habit) return;
    onSubmit(habit.id, date, '');
    onOpenChange(false);
    setNote('');
  };

  if (!habit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 bg-slate-900/95 backdrop-blur-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading text-white flex items-center gap-2">
            <span>{habit.icon}</span>
            <span>{habit.title}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            {habit.notePlaceholder || "What did you do today?"}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={habit.notePlaceholder || "Add a note..."}
          className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-peach-400/50 focus:ring-peach-400/20 resize-none"
          autoFocus
        />

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-peach-500 hover:bg-peach-600 text-white"
          >
            Save & Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
