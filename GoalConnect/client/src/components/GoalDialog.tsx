import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { X, Target, TrendingUp, AlertCircle, Calendar, Zap, CalendarDays, CalendarRange } from "lucide-react";
import { format, endOfMonth, endOfWeek, getISOWeek, getYear } from "date-fns";
import type { Goal } from "@shared/schema";

type GoalType = "regular" | "monthly" | "weekly";

interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  goal?: Goal;
  defaultGoalType?: GoalType;
  monthlyGoals?: Goal[]; // For linking weekly goals to monthly goals
}

const formatDateInput = (date: Date) => {
  return date.toISOString().split("T")[0];
};

// Quick goal templates
const GOAL_TEMPLATES = [
  { title: "Read 12 Books", target: 12, unit: "books", category: "Learning", difficulty: "medium" as const, priority: "medium" as const },
  { title: "Exercise 20 Times", target: 20, unit: "sessions", category: "Fitness", difficulty: "hard" as const, priority: "high" as const },
  { title: "Complete Course", target: 100, unit: "% done", category: "Learning", difficulty: "hard" as const, priority: "high" as const },
  { title: "Save $1000", target: 1000, unit: "dollars", category: "Finance", difficulty: "medium" as const, priority: "medium" as const },
  { title: "Write 10 Articles", target: 10, unit: "articles", category: "Creative", difficulty: "medium" as const, priority: "medium" as const },
  { title: "Learn 100 Words", target: 100, unit: "words", category: "Learning", difficulty: "easy" as const, priority: "medium" as const },
];

export function GoalDialog({ open, onClose, goal, defaultGoalType = "regular", monthlyGoals = [] }: GoalDialogProps) {
  const { user } = useAuth();
  const isEdit = !!goal;

  const [goalType, setGoalType] = useState<GoalType>(defaultGoalType);
  const [title, setTitle] = useState(goal?.title || "");
  const [description, setDescription] = useState(goal?.description || "");
  const [targetValue, setTargetValue] = useState(goal?.targetValue || 100);
  const [currentValue, setCurrentValue] = useState(goal?.currentValue || 0);
  const [unit, setUnit] = useState(goal?.unit || "");
  const [deadline, setDeadline] = useState(
    goal?.deadline || formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  );
  const [category, setCategory] = useState(goal?.category || "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    (goal?.difficulty as "easy" | "medium" | "hard") || "medium"
  );
  const [priority, setPriority] = useState<"high" | "medium" | "low">(
    (goal?.priority as "high" | "medium" | "low") || "medium"
  );
  const [parentGoalId, setParentGoalId] = useState<number | null>(
    (goal as any)?.parentGoalId || null
  );
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

  // Apply template
  const applyTemplate = (template: typeof GOAL_TEMPLATES[0]) => {
    setTitle(template.title);
    setTargetValue(template.target);
    setUnit(template.unit);
    setCategory(template.category);
    setDifficulty(template.difficulty);
    setPriority(template.priority);
  };

  // Quick deadline setters
  const setDeadlineRelative = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setDeadline(formatDateInput(date));
  };

  const setDeadlineEndOfMonth = () => {
    const date = new Date();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    setDeadline(formatDateInput(lastDay));
  };

  // Handle goal type change - auto-set deadline
  const handleGoalTypeChange = (newType: GoalType) => {
    setGoalType(newType);
    const now = new Date();
    if (newType === "monthly") {
      // Set deadline to end of current month
      setDeadline(formatDateInput(endOfMonth(now)));
    } else if (newType === "weekly") {
      // Set deadline to end of current week (Sunday)
      setDeadline(formatDateInput(endOfWeek(now, { weekStartsOn: 1 })));
    }
  };

  // Get current month/week strings for display
  const currentMonth = format(new Date(), "yyyy-MM");
  const currentWeekNum = getISOWeek(new Date());
  const currentYear = getYear(new Date());
  const currentWeek = `${currentYear}-W${String(currentWeekNum).padStart(2, '0')}`;

  // Calculate potential points with current settings
  const calculatePotentialPoints = () => {
    const basePoints = 5; // per milestone
    const priorityMult = priority === "high" ? 1.5 : priority === "low" ? 0.75 : 1.0;

    // Calculate days until deadline
    const daysUntil = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let urgencyMult = 1.0;
    if (daysUntil <= 3) urgencyMult = 2.5;
    else if (daysUntil <= 7) urgencyMult = 2.0;
    else if (daysUntil <= 14) urgencyMult = 1.5;

    const pointsPerMilestone = Math.round(basePoints * priorityMult * urgencyMult);
    const totalMilestones = 10; // 10%, 20%, ... 100%
    const totalPoints = pointsPerMilestone * totalMilestones;

    return { pointsPerMilestone, totalPoints, urgencyMult, priorityMult, daysUntil };
  };

  const potentialPoints = calculatePotentialPoints();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const data = {
        userId: user.id,
        title,
        description,
        targetValue,
        currentValue,
        unit,
        deadline,
        category,
        difficulty,
        priority,
        // Add month/week based on goalType
        month: goalType === "monthly" ? currentMonth : null,
        week: goalType === "weekly" ? currentWeek : null,
        // Link weekly goals to monthly goals
        parentGoalId: goalType === "weekly" ? parentGoalId : null,
      };

      if (isEdit) {
        await apiRequest(`/api/goals/${goal?.id}`, "PATCH", data);
      } else {
        await apiRequest("/api/goals", "POST", data);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/goals"], exact: false });
      onClose();
    } catch (error: any) {
      alert("Failed to save goal: " + (error?.message || "Unknown error"));
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 999998,
        }}
      />

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#000" }}>
            {isEdit ? "Edit Goal" : "Create New Goal"}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderRadius: "8px",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <X style={{ width: "20px", height: "20px", color: "#666" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Goal Type Selector */}
          {!isEdit && (
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "600", color: "#666", letterSpacing: "0.5px" }}>
                GOAL TYPE
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                {([
                  { type: "regular" as GoalType, label: "Regular", icon: Target, desc: "Anytime goal" },
                  { type: "monthly" as GoalType, label: "Monthly", icon: CalendarDays, desc: format(new Date(), "MMMM") },
                  { type: "weekly" as GoalType, label: "Weekly", icon: CalendarRange, desc: `Week ${currentWeekNum}` },
                ]).map(({ type, label, icon: Icon, desc }) => {
                  const selected = goalType === type;
                  const bgColor = type === "monthly" ? "#dbeafe" : type === "weekly" ? "#fef3c7" : "#f3f4f6";
                  const borderColor = type === "monthly" ? "#3b82f6" : type === "weekly" ? "#f59e0b" : "#8B5CF6";
                  const textColor = type === "monthly" ? "#1d4ed8" : type === "weekly" ? "#b45309" : "#6b21a8";

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleGoalTypeChange(type)}
                      style={{
                        padding: "12px 8px",
                        border: `2px solid ${selected ? borderColor : "#e5e7eb"}`,
                        borderRadius: "12px",
                        background: selected ? bgColor : "white",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "center",
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) {
                          e.currentTarget.style.borderColor = borderColor;
                          e.currentTarget.style.background = bgColor;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) {
                          e.currentTarget.style.borderColor = "#e5e7eb";
                          e.currentTarget.style.background = "white";
                        }
                      }}
                    >
                      <Icon style={{ width: "20px", height: "20px", margin: "0 auto 4px", color: selected ? textColor : "#666" }} />
                      <div style={{ fontSize: "13px", fontWeight: selected ? "700" : "500", color: selected ? textColor : "#000" }}>
                        {label}
                      </div>
                      <div style={{ fontSize: "11px", color: selected ? textColor : "#999" }}>
                        {desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Parent Goal Selector (for weekly goals) */}
          {!isEdit && goalType === "weekly" && monthlyGoals.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "600", color: "#666", letterSpacing: "0.5px" }}>
                LINKS TO MONTHLY GOAL
              </label>
              <select
                value={parentGoalId || ""}
                onChange={(e) => setParentGoalId(e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  outline: "none",
                  background: "white",
                  cursor: "pointer",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f59e0b")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              >
                <option value="">No parent goal (standalone)</option>
                {monthlyGoals.map((mg) => (
                  <option key={mg.id} value={mg.id}>
                    {mg.title} ({mg.currentValue}/{mg.targetValue} {mg.unit})
                  </option>
                ))}
              </select>
              <p style={{ marginTop: "4px", fontSize: "11px", color: "#666" }}>
                Link this weekly checkpoint to a monthly goal for better tracking
              </p>
            </div>
          )}

          {/* Quick Templates */}
          {!isEdit && (
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "600", color: "#666", letterSpacing: "0.5px" }}>
                QUICK START
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {GOAL_TEMPLATES.map((template) => (
                  <button
                    key={template.title}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    style={{
                      padding: "10px 8px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "center",
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
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#000", marginBottom: "2px" }}>
                      {template.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      {template.target} {template.unit}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Goal Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Read 12 Books This Year"
              required
              autoFocus
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "16px",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Read at least one book per month"
              rows={2}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "16px",
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
            />
          </div>

          {/* Current & Target Values */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                Current Value
              </label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(parseFloat(e.target.value))}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                Target Value
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(parseFloat(e.target.value))}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
          </div>

          {/* Unit & Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="books, sessions, % done, pages..."
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Learning"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
          </div>

          {/* Deadline */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Deadline
            </label>

            {/* Quick deadline buttons */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setDeadlineRelative(7)}
                style={{
                  padding: "6px 12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "white",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#666",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#f59e0b";
                  e.currentTarget.style.background = "#fffbeb";
                  e.currentTarget.style.color = "#f59e0b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#666";
                }}
              >
                🔥 1 Week (2.0x)
              </button>
              <button
                type="button"
                onClick={() => setDeadlineRelative(14)}
                style={{
                  padding: "6px 12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "white",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#666",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.background = "#eff6ff";
                  e.currentTarget.style.color = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#666";
                }}
              >
                ⚡ 2 Weeks (1.5x)
              </button>
              <button
                type="button"
                onClick={() => setDeadlineRelative(30)}
                style={{
                  padding: "6px 12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "white",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#666",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#8B5CF6";
                  e.currentTarget.style.background = "#faf5ff";
                  e.currentTarget.style.color = "#8B5CF6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#666";
                }}
              >
                📅 1 Month
              </button>
              <button
                type="button"
                onClick={setDeadlineEndOfMonth}
                style={{
                  padding: "6px 12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "white",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#666",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#8B5CF6";
                  e.currentTarget.style.background = "#faf5ff";
                  e.currentTarget.style.color = "#8B5CF6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#666";
                }}
              >
                🎯 End of Month
              </button>
            </div>

            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "16px",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
            />
            <div style={{ marginTop: "4px", fontSize: "12px", color: "#666" }}>
              {new Date(deadline).toLocaleDateString("en-US", {
                weekday: "short",
                month: "long",
                day: "numeric",
                year: "numeric"
              })} ({potentialPoints.daysUntil} days away)
            </div>
          </div>

          {/* Priority Selector */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Priority (affects point multipliers)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {(["high", "medium", "low"] as const).map((p) => {
                const selected = priority === p;
                const multiplier = p === "high" ? "1.5x" : p === "medium" ? "1.0x" : "0.75x";
                const bgColor = p === "high" ? "#fee2e2" : p === "medium" ? "#e0e7ff" : "#f3f4f6";
                const borderColor = p === "high" ? "#ef4444" : p === "medium" ? "#6366f1" : "#9ca3af";
                const textColor = p === "high" ? "#991b1b" : p === "medium" ? "#3730a3" : "#4b5563";

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      padding: "12px",
                      border: `2px solid ${selected ? borderColor : "#e5e7eb"}`,
                      borderRadius: "12px",
                      background: selected ? bgColor : "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "center",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = borderColor;
                        e.currentTarget.style.background = bgColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        e.currentTarget.style.background = "white";
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: selected ? "700" : "500",
                        textTransform: "capitalize",
                        color: selected ? textColor : "#666",
                        marginBottom: "4px",
                      }}
                    >
                      {p === "high" && <TrendingUp style={{ width: "14px", height: "14px", display: "inline", marginRight: "4px" }} />}
                      {p === "medium" && <Target style={{ width: "14px", height: "14px", display: "inline", marginRight: "4px" }} />}
                      {p === "low" && <AlertCircle style={{ width: "14px", height: "14px", display: "inline", marginRight: "4px" }} />}
                      {p}
                    </div>
                    <div style={{ fontSize: "12px", color: selected ? textColor : "#999" }}>{multiplier} points</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selector */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Difficulty (affects points earned)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {(["easy", "medium", "hard"] as const).map((diff) => {
                const points = diff === "easy" ? 5 : diff === "medium" ? 10 : 15;
                const selected = difficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    style={{
                      padding: "12px",
                      border: `2px solid ${selected ? "#8B5CF6" : "#e5e7eb"}`,
                      borderRadius: "12px",
                      background: selected ? "#f5f3ff" : "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "center",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = "#8B5CF6";
                        e.currentTarget.style.background = "#faf5ff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        e.currentTarget.style.background = "white";
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: selected ? "700" : "500",
                        textTransform: "capitalize",
                        color: selected ? "#6b21a8" : "#666",
                        marginBottom: "4px",
                      }}
                    >
                      {diff}
                    </div>
                    <div style={{ fontSize: "12px", color: selected ? "#7c3aed" : "#999" }}>{points} tokens</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Points & Progress Preview */}
          <div
            style={{
              padding: "16px",
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              borderRadius: "12px",
              marginBottom: "16px",
              border: "2px solid #fbbf24",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Zap style={{ width: "20px", height: "20px", color: "#f59e0b" }} />
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#92400e" }}>Potential Rewards</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div style={{ textAlign: "center", padding: "12px", background: "rgba(255, 255, 255, 0.7)", borderRadius: "8px" }}>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#f59e0b" }}>
                  {potentialPoints.pointsPerMilestone}
                </div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "#92400e" }}>pts per milestone</div>
              </div>
              <div style={{ textAlign: "center", padding: "12px", background: "rgba(255, 255, 255, 0.7)", borderRadius: "8px" }}>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#f59e0b" }}>
                  {potentialPoints.totalPoints}
                </div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "#92400e" }}>total possible pts</div>
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "#92400e", lineHeight: "1.5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Base milestone:</span>
                <span style={{ fontWeight: "600" }}>5 pts</span>
              </div>
              {potentialPoints.priorityMult !== 1.0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Priority multiplier:</span>
                  <span style={{ fontWeight: "600" }}>{potentialPoints.priorityMult}×</span>
                </div>
              )}
              {potentialPoints.urgencyMult > 1.0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Urgency bonus:</span>
                  <span style={{ fontWeight: "600" }}>
                    {potentialPoints.urgencyMult}× {potentialPoints.urgencyMult === 2.5 ? "🔥" : potentialPoints.urgencyMult === 2.0 ? "⚡" : "⏰"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Preview */}
          <div
            style={{
              padding: "16px",
              background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
              borderRadius: "12px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: "500", color: "#666" }}>Progress Preview</span>
              <span style={{ fontSize: "18px", fontWeight: "700", color: "#000" }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "#d1d5db", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #8B5CF6 0%, #6366f1 100%)",
                  width: `${Math.min(progress, 100)}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
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
                fontSize: "16px",
                fontWeight: "600",
                color: "#666",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#9ca3af";
                e.currentTarget.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#666";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: "14px",
                border: "none",
                borderRadius: "12px",
                background: submitting ? "#9ca3af" : "linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)",
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "600",
                color: "white",
                transition: "all 0.2s",
                opacity: submitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {submitting ? "Saving..." : isEdit ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
