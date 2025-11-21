import { useState, useEffect } from "react";
import { parseTaskInput, ParsedTask } from "@/lib/nlp/taskParser";
import { Calendar, Tag, Hash, Flag, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

interface SmartTaskInputProps {
  value: string;
  onChange: (value: string) => void;
  onParsedChange?: (parsed: ParsedTask) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SmartTaskInput({
  value,
  onChange,
  onParsedChange,
  placeholder = "e.g., Fix bug tomorrow 3pm #backend @urgent p1",
  autoFocus = false,
}: SmartTaskInputProps) {
  const [parsed, setParsed] = useState<ParsedTask | null>(null);

  useEffect(() => {
    if (value.trim()) {
      const result = parseTaskInput(value);
      setParsed(result);
      onParsedChange?.(result);
    } else {
      setParsed(null);
      onParsedChange?.({
        title: "",
        dueDate: null,
        dueTime: null,
        projectName: null,
        labelNames: [],
        priority: null,
        notes: null,
      });
    }
  }, [value, onParsedChange]);

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return date;
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case 2:
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case 3:
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case 4:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  const hasMetadata =
    parsed &&
    (parsed.dueDate ||
      parsed.projectName ||
      parsed.labelNames.length > 0 ||
      parsed.priority ||
      parsed.notes);

  return (
    <div className="space-y-3">
      {/* Main Input */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-4 py-3 border border-foreground/20 rounded-xl bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Parsed Preview */}
      {hasMetadata && (
        <div className="space-y-2 px-1">
          <div className="text-xs font-medium text-foreground/60">
            Detected:
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Due Date */}
            {parsed.dueDate && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground font-medium">
                  {formatDate(parsed.dueDate)}
                </span>
              </div>
            )}

            {/* Due Time */}
            {parsed.dueTime && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground font-medium">
                  {formatTime(parsed.dueTime)}
                </span>
              </div>
            )}

            {/* Project */}
            {parsed.projectName && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm">
                <Hash className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-foreground font-medium">
                  {parsed.projectName}
                </span>
              </div>
            )}

            {/* Labels */}
            {parsed.labelNames.map((label) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-sm"
              >
                <Tag className="w-3.5 h-3.5 text-green-500" />
                <span className="text-foreground font-medium">{label}</span>
              </div>
            ))}

            {/* Priority */}
            {parsed.priority && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${getPriorityColor(
                  parsed.priority
                )}`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="font-medium">P{parsed.priority}</span>
              </div>
            )}

            {/* Notes */}
            {parsed.notes && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-foreground font-medium text-xs max-w-[200px] truncate">
                  {parsed.notes}
                </span>
              </div>
            )}
          </div>

          {/* Task Title Preview */}
          {parsed.title && (
            <div className="text-sm text-foreground/70">
              <span className="font-medium">Title:</span> {parsed.title}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-foreground/50 px-1">
        Try: "tomorrow 3pm", "#project", "@label", "p1-p4", "// notes"
      </div>
    </div>
  );
}
