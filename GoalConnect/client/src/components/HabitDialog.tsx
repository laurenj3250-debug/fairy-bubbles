import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Habit } from "@shared/schema";

interface HabitDialogProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit;
}

const ICON_OPTIONS = [
  "💪", "🏃", "📚", "🧘", "💧", "🥗", "😴", "🎨", "✍️", "🎯",
  "🎵", "🎮", "📱", "💻", "☕", "🌱", "🔥", "⭐", "✨", "🌈",
  "🧗", "🏔️", "⛰️", "🇩🇪", "🥨", "🍺", "📖", "🗣️", "🎓", "🌍",
  "🚴", "🏊", "⚽", "🎾", "🏋️", "🥾", "🎒", "🧘‍♀️", "🍎", "🥤"
];

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

export function HabitDialog({ open, onClose, habit }: HabitDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(habit?.title || "");
  const [description, setDescription] = useState(habit?.description || "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    (habit?.difficulty as "easy" | "medium" | "hard") || "medium"
  );
  const [icon, setIcon] = useState(habit?.icon || "⭐");
  const [color, setColor] = useState(habit?.color || COLOR_OPTIONS[0].gradient);
  const [trackMinutes, setTrackMinutes] = useState(false); // TODO: Add to schema
  const [cadence, setCadence] = useState<"daily" | "weekly">(habit?.cadence || "daily");
  const [targetPerWeek, setTargetPerWeek] = useState(habit?.targetPerWeek || null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to create habits");
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        userId: user.id,
        title,
        description: description || "",
        difficulty,
        icon,
        color,
        cadence,
        targetPerWeek: cadence === "weekly" ? targetPerWeek : null,
      };

      if (habit) {
        await apiRequest(`/api/habits/${habit.id}`, "PATCH", data);
      } else {
        await apiRequest("/api/habits", "POST", data);
      }

      window.location.href = "/habits";
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
        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "24px", color: "#000" }}>
          {habit ? "Edit Habit" : "Create New Habit"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Exercise"
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 30 minutes of cardio"
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Icon
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "8px" }}>
              {ICON_OPTIONS.map((emojiIcon) => (
                <button
                  key={emojiIcon}
                  type="button"
                  onClick={() => setIcon(emojiIcon)}
                  style={{
                    padding: "8px",
                    fontSize: "24px",
                    border: icon === emojiIcon ? "3px solid #8B5CF6" : "2px solid #ddd",
                    borderRadius: "8px",
                    background: icon === emojiIcon ? "#f3f4f6" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
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

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            >
              <option value="easy">Easy - 5 coins per completion</option>
              <option value="medium">Medium - 10 coins per completion</option>
              <option value="hard">Hard - 15 coins per completion</option>
            </select>
            <p style={{ fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
              Coins are multiplied by your streak! (3+ days: 1.2x, 7+: 1.5x, 14+: 2x, 30+: 3x)
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={trackMinutes}
                onChange={(e) => setTrackMinutes(e.target.checked)}
                style={{ marginRight: "8px", width: "18px", height: "18px", cursor: "pointer" }}
              />
              <span style={{ fontWeight: "500", color: "#000" }}>Track minutes for this habit</span>
            </label>
            <p style={{ fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
              Enable a minute counter that you can adjust when completing this habit
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Cadence
            </label>
            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as "daily" | "weekly")}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {cadence === "weekly" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                Times per week
              </label>
              <select
                value={targetPerWeek || ""}
                onChange={(e) => setTargetPerWeek(e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
              >
                <option value="">No target</option>
                <option value="1">1 time per week</option>
                <option value="2">2 times per week</option>
                <option value="3">3 times per week</option>
                <option value="4">4 times per week</option>
                <option value="5">5 times per week</option>
                <option value="6">6 times per week</option>
                <option value="7">7 times per week</option>
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "32px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 24px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                background: "white",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 24px",
                border: "none",
                borderRadius: "8px",
                background: "#8B5CF6",
                color: "white",
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "500",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Saving..." : habit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
