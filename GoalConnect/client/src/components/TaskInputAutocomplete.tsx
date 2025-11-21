import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hash, Tag } from "lucide-react";

interface AutocompleteItem {
  id: number;
  name: string;
  type: "project" | "label";
}

interface TaskInputAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onParsedChange?: (parsed: any) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function TaskInputAutocomplete({
  value,
  onChange,
  placeholder = "e.g., Fix bug tomorrow 3pm #backend @urgent p1",
  autoFocus = false,
}: TaskInputAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerType, setTriggerType] = useState<"project" | "label" | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch projects
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch labels
  const { data: labels = [] } = useQuery<any[]>({
    queryKey: ["/api/labels"],
  });

  useEffect(() => {
    const input = value;
    const cursorPos = inputRef.current?.selectionStart || input.length;
    const textBeforeCursor = input.substring(0, cursorPos);

    // Check for # (project trigger)
    const projectTriggerMatch = textBeforeCursor.match(/#([\w-]*)$/);
    if (projectTriggerMatch) {
      const query = projectTriggerMatch[1].toLowerCase();
      setSearchQuery(query);
      setTriggerType("project");

      const filteredProjects = projects
        .filter((p) => p.name.toLowerCase().includes(query))
        .map((p) => ({
          id: p.id,
          name: p.name,
          type: "project" as const,
        }));

      setSuggestions(filteredProjects);
      setShowSuggestions(filteredProjects.length > 0);
      setSelectedIndex(0);
      return;
    }

    // Check for @ (label trigger)
    const labelTriggerMatch = textBeforeCursor.match(/@([\w-]*)$/);
    if (labelTriggerMatch) {
      const query = labelTriggerMatch[1].toLowerCase();
      setSearchQuery(query);
      setTriggerType("label");

      const filteredLabels = labels
        .filter((l) => l.name.toLowerCase().includes(query))
        .map((l) => ({
          id: l.id,
          name: l.name,
          type: "label" as const,
        }));

      setSuggestions(filteredLabels);
      setShowSuggestions(filteredLabels.length > 0);
      setSelectedIndex(0);
      return;
    }

    // No trigger found
    setShowSuggestions(false);
    setTriggerType(null);
  }, [value, projects, labels]);

  const insertSuggestion = (item: AutocompleteItem) => {
    const cursorPos = inputRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);

    let newText = "";
    if (item.type === "project") {
      // Replace #query with #name
      const match = textBeforeCursor.match(/(.*?)#[\w-]*$/);
      if (match) {
        newText = match[1] + "#" + item.name + " " + textAfterCursor;
      }
    } else {
      // Replace @query with @name
      const match = textBeforeCursor.match(/(.*?)@[\w-]*$/);
      if (match) {
        newText = match[1] + "@" + item.name + " " + textAfterCursor;
      }
    }

    onChange(newText.trim() + " ");
    setShowSuggestions(false);

    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          insertSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case "Tab":
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          insertSuggestion(suggestions[selectedIndex]);
        }
        break;
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full px-4 py-3 border border-foreground/20 rounded-xl bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-foreground/20 rounded-xl shadow-lg max-h-60 overflow-auto">
          {suggestions.map((item, index) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => insertSuggestion(item)}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-2 transition-colors ${
                index === selectedIndex
                  ? "bg-primary/10 text-foreground"
                  : "hover:bg-foreground/5 text-foreground/80"
              }`}
            >
              {item.type === "project" ? (
                <Hash className="w-4 h-4 text-purple-500" />
              ) : (
                <Tag className="w-4 h-4 text-green-500" />
              )}
              <span className="font-medium">{item.name}</span>
              <span className="ml-auto text-xs text-foreground/50 capitalize">
                {item.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
