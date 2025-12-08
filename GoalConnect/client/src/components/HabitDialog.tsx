import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Habit, Goal } from "@shared/schema";

interface HabitDialogProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit;
}

const ICON_CATEGORIES = {
  "Health": ["💪", "🏃", "🧘", "💧", "🥗", "😴", "🏋️", "🧘‍♀️", "🍎", "🥤"],
  "Active": ["🚴", "🏊", "⚽", "🎾", "🧗", "🏔️", "⛰️", "🥾"],
  "Learn": ["📚", "📖", "✍️", "🎓", "🗣️", "💻", "🌍"],
  "Creative": ["🎨", "🎵", "🎮", "📱"],
  "Goals": ["🎯", "🔥", "⭐", "✨", "🌈", "🌱"],
  "Culture": ["🇩🇪", "🥨", "🍺", "☕"],
};

const COLOR_OPTIONS = [
  { name: "Cosmic Purple", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Sunset Pink", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "Ocean Blue", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { name: "Fresh Mint", gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { name: "Peachy", gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { name: "Deep Sea", gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)" },
  { name: "Cotton Candy", gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" },
  { name: "Rose Quartz", gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)" },
];

const QUICK_TEMPLATES = [
  { title: "Exercise", icon: "💪", minutes: 30, difficulty: "medium" as const },
  { title: "Read", icon: "📚", minutes: 20, difficulty: "easy" as const },
  { title: "Meditate", icon: "🧘", minutes: 10, difficulty: "easy" as const },
  { title: "Learn German", icon: "🇩🇪", minutes: 15, difficulty: "medium" as const },
  { title: "Climb", icon: "🧗", minutes: 60, difficulty: "hard" as const },
];

const UNIT_OPTIONS = [
  { value: "minutes", label: "minutes", presets: [10, 20, 30, 60] },
  { value: "lessons", label: "lessons", presets: [0.5, 1, 2, 3] },
  { value: "pages", label: "pages", presets: [5, 10, 20, 50] },
  { value: "sets", label: "sets", presets: [1, 2, 3, 5] },
  { value: "reps", label: "reps", presets: [10, 20, 30, 50] },
  { value: "chapters", label: "chapters", presets: [1, 2, 3, 5] },
  { value: "hours", label: "hours", presets: [0.5, 1, 2, 3] },
  { value: "km", label: "km", presets: [1, 3, 5, 10] },
  { value: "miles", label: "miles", presets: [1, 3, 5, 10] },
];

export function HabitDialog({ open, onClose, habit }: HabitDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(habit?.title || "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    (habit?.difficulty as "easy" | "medium" | "hard") || "medium"
  );
  const [icon, setIcon] = useState(habit?.icon || "⭐");
  const [color, setColor] = useState(habit?.color || COLOR_OPTIONS[0].gradient);
  const [iconCategory, setIconCategory] = useState<keyof typeof ICON_CATEGORIES>("Health");
  const [hasTarget, setHasTarget] = useState(false);
  const [targetAmount, setTargetAmount] = useState<number>(30);
  const [targetUnit, setTargetUnit] = useState<string>("minutes");
  const [cadence, setCadence] = useState<"daily" | "weekly">(habit?.cadence || "daily");
  const [targetPerWeek, setTargetPerWeek] = useState(habit?.targetPerWeek || 3);
  const [linkedGoalId, setLinkedGoalId] = useState<number | null>(habit?.linkedGoalId || null);
  const [requiresNote, setRequiresNote] = useState(habit?.requiresNote || false);
  const [notePlaceholder, setNotePlaceholder] = useState(habit?.notePlaceholder || "");
  const [submitting, setSubmitting] = useState(false);

  // Fetch goals for linking
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    enabled: open,
  });

  if (!open) return null;

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setTitle(template.title);
    setIcon(template.icon);
    setDifficulty(template.difficulty);
    setHasTarget(true);
    setTargetAmount(template.minutes);
    setTargetUnit("minutes");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to create habits");
      return;
    }

    setSubmitting(true);

    try {
      const habitDescription = hasTarget ? `${targetAmount} ${targetUnit}` : "";

      const data = {
        userId: user.id,
        title,
        description: habitDescription,
        difficulty,
        icon,
        color,
        cadence,
        targetPerWeek: cadence === "weekly" ? targetPerWeek : null,
        linkedGoalId: linkedGoalId || null,
        requiresNote,
        notePlaceholder: requiresNote ? notePlaceholder : null,
      };

      if (habit) {
        await apiRequest(`/api/habits/${habit.id}`, "PATCH", data);
      } else {
        await apiRequest("/api/habits", "POST", data);
      }

      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });

      // Close dialog
      onClose();
    } catch (error: any) {
      alert("Failed to save habit: " + (error?.message || "Unknown error"));
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 999998,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          zIndex: 999999,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px", color: "#000" }}>
          {habit ? "Edit Habit" : "Create New Habit"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Quick Templates */}
          {!habit && (
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "#666" }}>
                QUICK START
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {QUICK_TEMPLATES.map((template) => (
                  <button
                    key={template.title}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    style={{
                      padding: "8px 12px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "white",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#8B5CF6";
                      e.currentTarget.style.background = "#faf5ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.background = "white";
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>{template.icon}</span>
                    <span>{template.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Habit name..."
              required
              style={{
                width: "100%",
                padding: "14px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "500",
                outline: "none",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#8B5CF6"}
              onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
            />
          </div>

          {/* Icon Picker with Categories */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "#666" }}>
              ICON
            </label>

            {/* Category Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "12px", overflowX: "auto" }}>
              {Object.keys(ICON_CATEGORIES).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setIconCategory(category as keyof typeof ICON_CATEGORIES)}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: "8px",
                    background: iconCategory === category ? "#8B5CF6" : "#f3f4f6",
                    color: iconCategory === category ? "white" : "#6b7280",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Icon Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
              {ICON_CATEGORIES[iconCategory].map((emojiIcon) => (
                <button
                  key={emojiIcon}
                  type="button"
                  onClick={() => setIcon(emojiIcon)}
                  style={{
                    padding: "14px",
                    fontSize: "28px",
                    border: icon === emojiIcon ? "3px solid #8B5CF6" : "2px solid #e5e7eb",
                    borderRadius: "12px",
                    background: icon === emojiIcon ? "#faf5ff" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {emojiIcon}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Color Theme
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption.name}
                  type="button"
                  onClick={() => setColor(colorOption.gradient)}
                  style={{
                    height: "60px",
                    border: color === colorOption.gradient ? "4px solid #000" : "2px solid #ddd",
                    borderRadius: "12px",
                    background: colorOption.gradient,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {color === colorOption.gradient && (
                    <div style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "white",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Target Amount & Unit */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "#666" }}>
              DAILY TARGET (OPTIONAL)
            </label>

            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              {/* Amount input */}
              <input
                type="number"
                min="0"
                max="1000"
                step="0.5"
                value={hasTarget ? targetAmount : ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val > 0) {
                    setHasTarget(true);
                    setTargetAmount(val);
                  } else if (e.target.value === "") {
                    setHasTarget(false);
                  }
                }}
                placeholder="0"
                style={{
                  width: "100px",
                  padding: "14px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "18px",
                  fontWeight: "600",
                  textAlign: "center",
                  outline: "none",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#8B5CF6"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
              />

              {/* Unit selector */}
              <select
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                style={{
                  flex: 1,
                  padding: "14px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "500",
                  outline: "none",
                  cursor: "pointer",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#8B5CF6"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
              >
                {UNIT_OPTIONS.map(unit => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick preset buttons based on selected unit */}
            {hasTarget && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", color: "#9ca3af", marginRight: "4px", alignSelf: "center" }}>
                  Quick:
                </span>
                {UNIT_OPTIONS.find(u => u.value === targetUnit)?.presets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setHasTarget(true);
                      setTargetAmount(preset);
                    }}
                    style={{
                      padding: "6px 12px",
                      border: targetAmount === preset ? "2px solid #8B5CF6" : "2px solid #e5e7eb",
                      borderRadius: "8px",
                      background: targetAmount === preset ? "#faf5ff" : "white",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#6b7280",
                      transition: "all 0.2s",
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}

            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "6px", marginLeft: "2px" }}>
              e.g., "0.5 lessons" for half a Pimsleur lesson, "20 pages" for reading
            </p>
          </div>

          {/* Difficulty - Visual Buttons */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "#666" }}>
              DIFFICULTY & TOKENS
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {[
                { value: "easy" as const, label: "Easy", coins: 5, emoji: "😊" },
                { value: "medium" as const, label: "Medium", coins: 10, emoji: "💪" },
                { value: "hard" as const, label: "Hard", coins: 15, emoji: "🔥" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDifficulty(option.value)}
                  style={{
                    padding: "12px",
                    border: difficulty === option.value ? "3px solid #8B5CF6" : "2px solid #e5e7eb",
                    borderRadius: "12px",
                    background: difficulty === option.value ? "#faf5ff" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>{option.emoji}</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}>{option.label}</div>
                  <div style={{ fontSize: "13px", color: "#f59e0b", fontWeight: "500" }}>💎 {option.coins}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cadence - Visual Buttons */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "#666" }}>
              FREQUENCY
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setCadence("daily")}
                style={{
                  padding: "12px",
                  border: cadence === "daily" ? "3px solid #8B5CF6" : "2px solid #e5e7eb",
                  borderRadius: "12px",
                  background: cadence === "daily" ? "#faf5ff" : "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                }}
              >
                📅 Daily
              </button>
              <button
                type="button"
                onClick={() => setCadence("weekly")}
                style={{
                  padding: "12px",
                  border: cadence === "weekly" ? "3px solid #8B5CF6" : "2px solid #e5e7eb",
                  borderRadius: "12px",
                  background: cadence === "weekly" ? "#faf5ff" : "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                }}
              >
                📆 Weekly
              </button>
            </div>
          </div>

          {cadence === "weekly" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "#666" }}>
                TIMES PER WEEK: {targetPerWeek}x
              </label>
              <input
                type="range"
                min="1"
                max="7"
                step="1"
                value={targetPerWeek}
                onChange={(e) => setTargetPerWeek(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  height: "6px",
                  borderRadius: "3px",
                  outline: "none",
                  background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${((targetPerWeek || 1) / 7) * 100}%, #e5e7eb ${((targetPerWeek || 1) / 7) * 100}%, #e5e7eb 100%)`,
                  WebkitAppearance: "none",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "12px", color: "#9ca3af" }}>
                <span>1</span>
                <span>7</span>
              </div>
            </div>
          )}

          {/* Requires Note Toggle */}
          <div style={{ marginBottom: "20px", padding: "16px", background: "#fffbeb", borderRadius: "12px", border: "2px solid #fcd34d" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#000" }}>
                📝 Prompt for Note
              </label>
              <button
                type="button"
                onClick={() => setRequiresNote(!requiresNote)}
                style={{
                  width: "48px",
                  height: "24px",
                  borderRadius: "12px",
                  border: "none",
                  background: requiresNote ? "#f59e0b" : "#e5e7eb",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: requiresNote ? "26px" : "2px",
                    width: "20px",
                    height: "20px",
                    background: "white",
                    borderRadius: "50%",
                    transition: "all 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: requiresNote ? "12px" : "0" }}>
              Ask for a note when completing this habit
            </p>
            {requiresNote && (
              <input
                type="text"
                value={notePlaceholder}
                onChange={(e) => setNotePlaceholder(e.target.value)}
                placeholder="e.g., What did you learn today?"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #fcd34d",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#fcd34d"}
              />
            )}
          </div>

          {/* Link to Goal */}
          {goals.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "#666" }}>
                LINK TO GOAL (OPTIONAL)
              </label>
              <select
                value={linkedGoalId || ""}
                onChange={(e) => setLinkedGoalId(e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  outline: "none",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#8B5CF6"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
              >
                <option value="">None - Standalone habit</option>
                {goals.map(goal => {
                  const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
                  return (
                    <option key={goal.id} value={goal.id}>
                      {goal.title} ({progress}%)
                    </option>
                  );
                })}
              </select>
              {linkedGoalId && (
                <div style={{
                  marginTop: "8px",
                  padding: "10px 12px",
                  background: "#eff6ff",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#3b82f6",
                }}>
                  💡 Auto +1 to goal on completion
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "28px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "14px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                background: "white",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "600",
                color: "#6b7280",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 2,
                padding: "14px",
                border: "none",
                borderRadius: "12px",
                background: submitting ? "#9ca3af" : "#8B5CF6",
                color: "white",
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: "600",
                transition: "all 0.2s",
                boxShadow: submitting ? "none" : "0 4px 12px rgba(139, 92, 246, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!submitting) e.currentTarget.style.background = "#7c3aed";
              }}
              onMouseLeave={(e) => {
                if (!submitting) e.currentTarget.style.background = "#8B5CF6";
              }}
            >
              {submitting ? "Saving..." : habit ? "✓ Update Habit" : "✓ Create Habit"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
