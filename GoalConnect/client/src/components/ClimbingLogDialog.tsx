/**
 * ClimbingLogDialog - Form for adding/editing outdoor climbing ticks
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mountain, MapPin, Star, Calendar, Check } from "lucide-react";
import type { ClimbingTickInput, RouteType, AscentStyle, ClimbingTick } from "@/hooks/useClimbingLog";

interface ClimbingLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tick: ClimbingTickInput) => Promise<unknown>;
  editingTick?: ClimbingTick;
  isSubmitting?: boolean;
}

const ROUTE_TYPES: { value: RouteType; label: string }[] = [
  { value: "sport", label: "Sport" },
  { value: "trad", label: "Trad" },
  { value: "boulder", label: "Boulder" },
  { value: "alpine", label: "Alpine" },
  { value: "ice", label: "Ice" },
];

const ASCENT_STYLES: { value: AscentStyle; label: string; description: string }[] = [
  { value: "onsight", label: "Onsight", description: "First try, no beta" },
  { value: "flash", label: "Flash", description: "First try with beta" },
  { value: "redpoint", label: "Redpoint", description: "Led clean after working" },
  { value: "pinkpoint", label: "Pinkpoint", description: "Led with pre-placed gear" },
  { value: "send", label: "Send", description: "Clean ascent (general)" },
  { value: "attempt", label: "Attempt", description: "Worked/fell" },
  { value: "toprope", label: "Top Rope", description: "TR ascent" },
];

// Common climbing grades by type
const GRADES = {
  sport: ["5.6", "5.7", "5.8", "5.9", "5.10a", "5.10b", "5.10c", "5.10d", "5.11a", "5.11b", "5.11c", "5.11d", "5.12a", "5.12b", "5.12c", "5.12d", "5.13a", "5.13b", "5.13c", "5.13d", "5.14a", "5.14b", "5.14c", "5.14d"],
  trad: ["5.6", "5.7", "5.8", "5.9", "5.10a", "5.10b", "5.10c", "5.10d", "5.11a", "5.11b", "5.11c", "5.11d", "5.12a", "5.12b", "5.12c", "5.12d", "5.13a"],
  boulder: ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12", "V13", "V14", "V15"],
  alpine: ["AI1", "AI2", "AI3", "AI4", "AI5", "AI6", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"],
  ice: ["WI1", "WI2", "WI3", "WI4", "WI5", "WI6", "WI7"],
};

export function ClimbingLogDialog({
  open,
  onOpenChange,
  onSubmit,
  editingTick,
  isSubmitting = false,
}: ClimbingLogDialogProps) {
  const [routeName, setRouteName] = useState("");
  const [grade, setGrade] = useState("");
  const [routeType, setRouteType] = useState<RouteType>("sport");
  const [ascentStyle, setAscentStyle] = useState<AscentStyle>("redpoint");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [pitches, setPitches] = useState(1);
  const [stars, setStars] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editingTick) {
      setRouteName(editingTick.routeName);
      setGrade(editingTick.grade);
      setRouteType(editingTick.routeType);
      setAscentStyle(editingTick.ascentStyle);
      setDate(editingTick.date);
      setLocation(editingTick.location ?? "");
      setArea(editingTick.area ?? "");
      setPitches(editingTick.pitches);
      setStars(editingTick.stars ?? undefined);
      setNotes(editingTick.notes ?? "");
    } else {
      // Reset to defaults for new tick
      setRouteName("");
      setGrade("");
      setRouteType("sport");
      setAscentStyle("redpoint");
      setDate(new Date().toISOString().split("T")[0]);
      setLocation("");
      setArea("");
      setPitches(1);
      setStars(undefined);
      setNotes("");
    }
  }, [editingTick]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!routeName.trim() || !grade) return;

    await onSubmit({
      routeName: routeName.trim(),
      grade,
      routeType,
      ascentStyle,
      date,
      location: location.trim() || undefined,
      area: area.trim() || undefined,
      pitches: pitches > 1 ? pitches : undefined,
      stars,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setRouteName("");
    setGrade("");
    setRouteType("sport");
    setAscentStyle("redpoint");
    setDate(new Date().toISOString().split("T")[0]);
    setLocation("");
    setArea("");
    setPitches(1);
    setStars(undefined);
    setNotes("");
    onOpenChange(false);
  };

  const currentGrades = GRADES[routeType] || GRADES.sport;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mountain className="w-5 h-5" />
            {editingTick ? "Edit Tick" : "Log a Climb"}
          </DialogTitle>
          <DialogDescription>
            Record your outdoor climbing ascent
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Route Name */}
          <div className="space-y-2">
            <Label htmlFor="routeName">Route Name *</Label>
            <Input
              id="routeName"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="e.g., The Nose, Midnight Lightning"
              required
            />
          </div>

          {/* Route Type & Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={routeType} onValueChange={(v) => setRouteType(v as RouteType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROUTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grade *</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {currentGrades.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ascent Style */}
          <div className="space-y-2">
            <Label>Ascent Style *</Label>
            <Select value={ascentStyle} onValueChange={(v) => setAscentStyle(v as AscentStyle)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASCENT_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    <div className="flex items-center gap-2">
                      <span>{style.label}</span>
                      <span className="text-xs text-muted-foreground">
                        ({style.description})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Location & Area */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Crag/Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Red River Gorge"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area/Wall</Label>
              <Input
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g., The Motherlode"
              />
            </div>
          </div>

          {/* Pitches (for multi-pitch) */}
          {routeType !== "boulder" && (
            <div className="space-y-2">
              <Label htmlFor="pitches">Pitches</Label>
              <Input
                id="pitches"
                type="number"
                min={1}
                max={50}
                value={pitches}
                onChange={(e) => setPitches(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {/* Stars Rating */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              Quality Rating
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setStars(stars === rating ? undefined : rating)}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                    stars && rating <= stars
                      ? "bg-yellow-400/20 border-yellow-400 text-yellow-500"
                      : "border-border hover:border-yellow-300"
                  }`}
                >
                  <Star
                    className={`w-5 h-5 ${stars && rating <= stars ? "fill-current" : ""}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Beta, conditions, how it felt..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !routeName.trim() || !grade}>
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  {editingTick ? "Update" : "Log Climb"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ClimbingLogDialog;
