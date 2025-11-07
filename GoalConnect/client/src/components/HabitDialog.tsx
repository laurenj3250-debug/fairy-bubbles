import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Habit } from "@shared/schema";

interface HabitDialogProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit;
}

export function HabitDialog({ open, onClose, habit }: HabitDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(habit?.title || "");
  const [description, setDescription] = useState(habit?.description || "");
  const [cadence, setCadence] = useState<"daily" | "weekly">(habit?.cadence || "daily");
  const [targetPerWeek, setTargetPerWeek] = useState(habit?.targetPerWeek || null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        userId: 1,
        title,
        description: description || "",
        icon: "Sparkles",
        color: "#8B5CF6",
        cadence,
        targetPerWeek: cadence === "weekly" ? targetPerWeek : null,
      };

      console.log("Submitting habit data:", data);

      if (habit) {
        await apiRequest(`/api/habits/${habit.id}`, "PATCH", data);
        toast({ title: "Updated!", description: "Habit updated successfully" });
      } else {
        const result = await apiRequest("/api/habits", "POST", data);
        console.log("Habit created:", result);
        toast({ title: "Created!", description: "Habit created successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setTitle("");
      setDescription("");
      setCadence("daily");
      setTargetPerWeek(null);
      onClose();
    } catch (error: any) {
      console.error("Error saving habit:", error);
      const errorMsg = error?.message || "Failed to save habit";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
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
