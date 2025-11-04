import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Smile, Meh, Frown, Laugh, Angry, Battery, BatteryMedium, BatteryLow, BatteryFull, BatteryWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habitTitle: string;
  onComplete: (data: { note?: string; mood?: number; energyLevel?: number }) => void;
}

const MOOD_OPTIONS = [
  { value: 1, label: "Terrible", icon: Angry, color: "text-red-500" },
  { value: 2, label: "Bad", icon: Frown, color: "text-orange-500" },
  { value: 3, label: "Okay", icon: Meh, color: "text-yellow-500" },
  { value: 4, label: "Good", icon: Smile, color: "text-green-500" },
  { value: 5, label: "Great", icon: Laugh, color: "text-emerald-500" },
];

const ENERGY_OPTIONS = [
  { value: 1, label: "Exhausted", icon: BatteryWarning, color: "text-red-500" },
  { value: 2, label: "Low", icon: BatteryLow, color: "text-orange-500" },
  { value: 3, label: "Medium", icon: BatteryMedium, color: "text-yellow-500" },
  { value: 4, label: "High", icon: Battery, color: "text-green-500" },
  { value: 5, label: "Energized", icon: BatteryFull, color: "text-emerald-500" },
];

export function HabitCompletionDialog({ open, onOpenChange, habitTitle, onComplete }: HabitCompletionDialogProps) {
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [energyLevel, setEnergyLevel] = useState<number | undefined>(undefined);

  const handleComplete = () => {
    onComplete({
      note: note.trim() || undefined,
      mood,
      energyLevel,
    });
    // Reset form
    setNote("");
    setMood(undefined);
    setEnergyLevel(undefined);
    onOpenChange(false);
  };

  const handleSkip = () => {
    onComplete({});
    setNote("");
    setMood(undefined);
    setEnergyLevel(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete: {habitTitle}</DialogTitle>
          <DialogDescription>
            Add context to track patterns and insights
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mood Selection */}
          <div>
            <Label className="mb-3 block">How are you feeling?</Label>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMood(value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                    mood === value
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <Icon className={cn("w-6 h-6", mood === value ? color : "text-muted-foreground")} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level Selection */}
          <div>
            <Label className="mb-3 block">Energy level?</Label>
            <div className="grid grid-cols-5 gap-2">
              {ENERGY_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEnergyLevel(value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                    energyLevel === value
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <Icon className={cn("w-6 h-6", energyLevel === value ? color : "text-muted-foreground")} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="note" className="mb-2 block">
              Notes (optional)
            </Label>
            <Textarea
              id="note"
              placeholder="How did it go? Any observations?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip & Complete
          </Button>
          <Button onClick={handleComplete}>
            Save & Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
