import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["g", "h"], description: "Go to Habits" },
      { keys: ["g", "d"], description: "Go to Dashboard" },
      { keys: ["g", "g"], description: "Go to Goals" },
      { keys: ["g", "t"], description: "Go to Todos" },
      { keys: ["g", "s"], description: "Go to Settings" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["n"], description: "New habit/todo (context-aware)" },
      { keys: ["c"], description: "Quick complete today's habit" },
      { keys: ["/"], description: "Focus search" },
      { keys: ["?"], description: "Show this help" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["Esc"], description: "Close modal/dialog" },
      { keys: ["Enter"], description: "Confirm action" },
      { keys: ["Tab"], description: "Next field" },
      { keys: ["Shift", "Tab"], description: "Previous field" },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Keyboard Shortcuts Help Modal
 *
 * Triggered by pressing "?" anywhere in the app.
 * Shows available keyboard shortcuts for power users.
 *
 * Inspired by Linear's excellent keyboard-first UX.
 */
export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium text-foreground/70 mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-foreground/80">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, index) => (
                        <span key={index}>
                          <kbd className="px-2 py-1 text-xs font-mono bg-foreground/10 border border-foreground/20 rounded">
                            {key}
                          </kbd>
                          {index < shortcut.keys.length - 1 && (
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

        <div className="text-xs text-foreground/50 text-center pt-2 border-t border-foreground/10">
          Press <kbd className="px-1.5 py-0.5 font-mono bg-foreground/10 rounded">?</kbd> anywhere to show this help
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default KeyboardShortcutsModal;
