import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { X, Mountain, Zap, Brain, Footprints } from "lucide-react";
import type { Habit, Goal } from "@shared/schema";
import { cn } from "@/lib/utils";
import { FrequencySelector } from "./FrequencySelector";
import { FrequencyType } from "@shared/lib/habitFrequency";

interface HabitCreateDialogProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit;
}

// Route Templates - Pre-configured climbing routes
const ROUTE_TEMPLATES = [
  {
    id: "morning-yoga",
    name: "Morning Stretch",
    icon: "🧘",
    category: "mind" as const,
    effort: "light" as const,
    grade: "5.6",
    cadence: "daily" as const,
    description: "Light morning movement",
  },
  {
    id: "training",
    name: "Training Session",
    icon: "💪",
    category: "training" as const,
    effort: "heavy" as const,
    grade: "5.10",
    cadence: "weekly" as const,
    targetPerWeek: 3,
    description: "Hard physical training",
  },
  {
    id: "read",
    name: "Read",
    icon: "📚",
    category: "mind" as const,
    effort: "light" as const,
    grade: "5.7",
    cadence: "daily" as const,
    description: "Daily reading habit",
  },
  {
    id: "climb",
    name: "Climb",
    icon: "🧗",
    category: "training" as const,
    effort: "heavy" as const,
    grade: "5.11",
    cadence: "weekly" as const,
    targetPerWeek: 2,
    description: "Climbing sessions",
  },
  {
    id: "walk",
    name: "Walk Outside",
    icon: "🥾",
    category: "foundation" as const,
    effort: "light" as const,
    grade: "5.5",
    cadence: "daily" as const,
    description: "Daily outdoor movement",
  },
  {
    id: "meditate",
    name: "Meditate",
    icon: "🧠",
    category: "mind" as const,
    effort: "light" as const,
    grade: "5.8",
    cadence: "daily" as const,
    description: "Mindfulness practice",
  },
];

const CATEGORY_CONFIG = {
  training: {
    label: "Training",
    icon: Mountain,
    description: "Physical training for the climb",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  mind: {
    label: "Mind",
    icon: Brain,
    description: "Mental preparation & focus",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  foundation: {
    label: "Foundation",
    icon: Footprints,
    description: "Daily basecamp routines",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  adventure: {
    label: "Adventure",
    icon: Zap,
    description: "Big weekly objectives",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
} as const;

const EFFORT_LEVELS = [
  { value: "light" as const, label: "Light", grade: "5.6-5.8", icon: "○" },
  { value: "medium" as const, label: "Medium", grade: "5.9-5.10", icon: "●" },
  { value: "heavy" as const, label: "Heavy", grade: "5.11+", icon: "⚫" },
] as const;

const GRADE_OPTIONS = ["5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "5.11", "5.12"];

const HABIT_ICONS = [
  "💪", "🧘", "📚", "🧗", "🥾", "🧠", "💧", "🥗",
  "🏃", "🏋️", "🚴", "🏊", "✍️", "💻", "🎨", "🎯"
];

export function HabitCreateDialog({ open, onClose, habit }: HabitCreateDialogProps) {
  const { user } = useAuth();

  // Form state - properly reset when dialog opens/closes or habit changes
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("⭐");
  const [category, setCategory] = useState<"training" | "mind" | "foundation" | "adventure">("training");
  const [effort, setEffort] = useState<"light" | "medium" | "heavy">("medium");
  const [grade, setGrade] = useState("5.9");
  const [frequency, setFrequency] = useState({
    numerator: 1,
    denominator: 1,
    type: FrequencyType.DAILY
  });
  const [linkedGoalId, setLinkedGoalId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);

  // Apply template to form
  const applyTemplate = (template: typeof ROUTE_TEMPLATES[0]) => {
    setTitle(template.name);
    setIcon(template.icon);
    setCategory(template.category);
    setEffort(template.effort);
    setGrade(template.grade);
    // Convert old template cadence to new frequency format
    if (template.cadence === "daily") {
      setFrequency({ numerator: 1, denominator: 1, type: FrequencyType.DAILY });
    } else if (template.cadence === "weekly") {
      setFrequency({
        numerator: template.targetPerWeek || 1,
        denominator: 7,
        type: FrequencyType.WEEKLY
      });
    }
    setShowTemplates(false);
  };

  // Reset form when dialog opens or habit changes
  useEffect(() => {
    if (open) {
      if (habit) {
        // Editing existing habit - skip templates
        setShowTemplates(false);
        setTitle(habit.title || "");
        setIcon(habit.icon || "⭐");
        setCategory((habit.category as any) || "training");
        setEffort((habit.effort as any) || "medium");
        setGrade(habit.grade || "5.9");

        // Load frequency from new fields or fall back to old cadence fields
        if (habit.frequencyNumerator && habit.frequencyDenominator && habit.frequencyType) {
          setFrequency({
            numerator: habit.frequencyNumerator,
            denominator: habit.frequencyDenominator,
            type: habit.frequencyType as FrequencyType
          });
        } else if (habit.cadence === "weekly") {
          setFrequency({
            numerator: habit.targetPerWeek || 1,
            denominator: 7,
            type: FrequencyType.WEEKLY
          });
        } else {
          // Default to daily
          setFrequency({
            numerator: 1,
            denominator: 1,
            type: FrequencyType.DAILY
          });
        }

        setLinkedGoalId(habit.linkedGoalId || null);
      } else {
        // New habit - show templates
        setShowTemplates(true);
        setTitle("");
        setIcon("⭐");
        setCategory("training");
        setEffort("medium");
        setGrade("5.9");
        setFrequency({
          numerator: 1,
          denominator: 1,
          type: FrequencyType.DAILY
        });
        setLinkedGoalId(null);
      }
      setError(null);
    }
  }, [open, habit]);

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    enabled: open,
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setSubmitting(true);

    try {
      setError(null);

      const data = {
        userId: user.id,
        title: title.trim(),
        description: "",
        icon,
        color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // default, not used in new design
        category,
        effort,
        grade,
        // New frequency fields
        frequencyNumerator: frequency.numerator,
        frequencyDenominator: frequency.denominator,
        frequencyType: frequency.type,
        // Keep old fields for backward compatibility (will be auto-populated by server if needed)
        cadence: frequency.type === FrequencyType.DAILY ? "daily" : frequency.denominator === 7 ? "weekly" : null,
        targetPerWeek: frequency.denominator === 7 ? frequency.numerator : null,
        difficulty: effort === "light" ? "easy" : effort === "medium" ? "medium" : "hard",
        linkedGoalId: linkedGoalId,
      };

      console.log("[HabitCreateDialog] Submitting habit:", data);

      if (habit) {
        await apiRequest(`/api/habits/${habit.id}`, "PATCH", data);
        console.log("[HabitCreateDialog] Habit updated successfully");
      } else {
        await apiRequest("/api/habits", "POST", data);
        console.log("[HabitCreateDialog] Habit created successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });

      // Reset form and close
      setSubmitting(false);
      onClose();
    } catch (error: any) {
      console.error("[HabitCreateDialog] Failed to save habit:", error);
      setError(error.message || "Failed to save route. Please try again.");
      setSubmitting(false);
    }
  };

  const categoryConfig = CATEGORY_CONFIG[category];
  const CategoryIcon = categoryConfig.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999998]"
      />

      {/* Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999999] w-full max-w-2xl max-h-[90vh] overflow-auto"
      >
        <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern p-6 mx-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {habit ? "Edit Route" : "Plan New Route"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Build your climbing route
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border-2 border-destructive/50 rounded-xl">
              <p className="text-sm text-destructive font-semibold">{error}</p>
            </div>
          )}

          {/* Template Selection Screen */}
          {showTemplates && !habit && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
                <p className="text-sm text-muted-foreground">Choose a template or customize</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {ROUTE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="p-4 border-2 border-card-border rounded-xl hover:border-primary/50 transition-all hover:bg-muted/10 text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{template.icon}</span>
                      <div>
                        <div className="font-semibold text-foreground">{template.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{template.category}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </button>
                ))}
              </div>

              <div className="text-center pt-4 border-t border-card-border">
                <button
                  type="button"
                  onClick={() => setShowTemplates(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Or customize from scratch →
                </button>
              </div>
            </div>
          )}

          {!showTemplates && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Route Templates - REMOVED, NOW IN SEPARATE SCREEN */}
              {!habit && false && (
                <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Quick Routes
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ROUTE_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all",
                        "hover:border-primary/50 hover:bg-muted/10",
                        "border-card-border bg-card/40"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="text-left">
                          <div className="text-sm font-semibold text-foreground">
                            {template.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {template.grade}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Route Name & Icon */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Route Name
              </label>
              <div className="flex gap-3">
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-16 h-16 text-3xl border-2 border-card-border rounded-xl bg-card/40 cursor-pointer hover:border-primary/50 transition-colors text-center"
                >
                  {HABIT_ICONS.map((habitIcon) => (
                    <option key={habitIcon} value={habitIcon}>
                      {habitIcon}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Morning climb, Read 20 pages..."
                  required
                  autoFocus
                  className="flex-1 px-4 py-3 border-2 border-card-border rounded-xl bg-card/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const Icon = config.icon;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all",
                        category === cat
                          ? `border-primary bg-primary/10`
                          : "border-card-border bg-card/40 hover:border-primary/30"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 mx-auto mb-1", config.color)} />
                      <div className="text-xs font-semibold text-foreground">
                        {config.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Effort Level */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Effort Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EFFORT_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setEffort(level.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      effort === level.value
                        ? "border-primary bg-primary/10"
                        : "border-card-border bg-card/40 hover:border-primary/30"
                    )}
                  >
                    <div className="text-2xl mb-1">{level.icon}</div>
                    <div className="text-sm font-semibold text-foreground">
                      {level.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {level.grade}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Grade (Advanced) */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-3 border-2 border-card-border rounded-xl bg-card/40 text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary/50 transition-colors"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Frequency Selector */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Frequency
              </label>
              <FrequencySelector value={frequency} onChange={setFrequency} />
            </div>

            {/* Link to Route (Goal) */}
            <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4">
              <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                ⛰️ Link to Route
                <span className="text-xs font-normal text-muted-foreground">(Recommended)</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Connect this habit to a bigger goal. Each completion auto-advances your route progress!
              </p>
              <select
                value={linkedGoalId || ""}
                onChange={(e) => setLinkedGoalId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border-2 border-primary/30 rounded-xl bg-card/40 text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">No route (habit only)</option>
                {goals.filter((g) => {
                  const percentage = (g.currentValue / g.targetValue) * 100;
                  return percentage < 100; // Only show incomplete goals
                }).map((goal) => {
                  const percentage = Math.round((goal.currentValue / goal.targetValue) * 100);
                  return (
                    <option key={goal.id} value={goal.id}>
                      {goal.title} ({percentage}% complete)
                    </option>
                  );
                })}
              </select>
              {!linkedGoalId && goals.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  💡 Tip: Create a route in the Routes tab to link habits to bigger goals
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-card-border">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-card-border bg-card/40 text-muted-foreground font-semibold hover:bg-muted/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl font-semibold transition-all",
                  submitting || !title.trim()
                    ? "bg-muted/20 text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                )}
              >
                {submitting ? "Saving..." : habit ? "Update Route" : "Create Route"}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </>
  );
}
