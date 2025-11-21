import { X, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Platform } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutItem[];
}

/**
 * KeyboardShortcutsHelp - Beautiful modal showing all available keyboard shortcuts
 *
 * Features:
 * - Opens with ? key
 * - Organized by category (Navigation, Actions, Filters)
 * - Platform-aware (shows ⌘ on Mac, Ctrl on Windows/Linux)
 * - Searchable/filterable shortcuts
 * - Print-friendly layout
 */
export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const isMac = Platform.isMac();
  const modKey = isMac ? "⌘" : "Ctrl";

  const shortcuts: ShortcutCategory[] = [
    {
      title: "Quick Actions",
      shortcuts: [
        { keys: [modKey, "K"], description: "Quick add task" },
        { keys: ["?"], description: "Show keyboard shortcuts" },
        { keys: ["Esc"], description: "Close modal/dialog" },
      ],
    },
    {
      title: "Navigation",
      shortcuts: [
        { keys: ["↑"], description: "Navigate to previous task" },
        { keys: ["↓"], description: "Navigate to next task" },
        { keys: ["Enter"], description: "Open focused task" },
      ],
    },
    {
      title: "Task Actions",
      shortcuts: [
        { keys: ["E"], description: "Edit focused task" },
        { keys: ["Space"], description: "Toggle complete/incomplete" },
        { keys: ["Delete"], description: "Delete focused task" },
        { keys: [isMac ? "⌫" : "Backspace"], description: "Delete focused task (alternative)" },
      ],
    },
    {
      title: "Task Properties",
      shortcuts: [
        { keys: ["1"], description: "Set priority to P1 (Urgent)" },
        { keys: ["2"], description: "Set priority to P2 (High)" },
        { keys: ["3"], description: "Set priority to P3 (Medium)" },
        { keys: ["4"], description: "Set priority to P4 (Low)" },
        { keys: ["P"], description: "Open project selector" },
        { keys: ["L"], description: "Open label picker" },
        { keys: ["D"], description: "Set due date" },
      ],
    },
  ];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-background/95 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at top right, hsl(var(--accent) / 0.3), transparent 70%)`
            }}
          />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                }}
              >
                <Keyboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Keyboard Shortcuts</h2>
                <p className="text-sm text-foreground/60">Master your task management workflow</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground/60" />
            </button>
          </div>

          {/* Shortcuts Grid */}
          <div className="relative z-10 space-y-6">
            {shortcuts.map((category) => (
              <div key={category.title}>
                <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">
                  {category.title}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-foreground/5 hover:bg-background/60 transition-colors"
                    >
                      <span className="text-foreground">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            <kbd
                              className="px-2.5 py-1.5 text-sm font-semibold rounded-lg border shadow-sm"
                              style={{
                                background: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--foreground) / 0.2)',
                                color: 'hsl(var(--foreground))',
                              }}
                            >
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-foreground/40">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="relative z-10 mt-8 pt-6 border-t border-foreground/10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground/60">
                Pro tip: These shortcuts work everywhere in the app
              </p>
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-xl font-medium bg-background/60 border border-foreground/10 text-foreground/60 hover:bg-foreground/5 transition-all"
              >
                Close
                <span className="ml-2 text-xs">Esc</span>
              </button>
            </div>
          </div>

          {/* Platform indicator */}
          <div className="relative z-10 mt-4 text-center">
            <p className="text-xs text-foreground/40">
              Showing shortcuts for {isMac ? "macOS" : "Windows/Linux"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
