import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Flame, Calendar, Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  /** Optional streak count to show loss warning */
  streak?: number;
  /** Optional total log count */
  logCount?: number;
  /** Type of item being deleted */
  itemType?: "habit" | "goal" | "todo";
}

/**
 * Custom delete confirmation dialog with intentional friction.
 *
 * Psychology applied:
 * - Loss Aversion: Shows what user will lose (streak, history)
 * - Intentional Friction: Consequential action should feel consequential
 * - Clear Communication: No ambiguity about what's being deleted
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  itemName,
  streak,
  logCount,
  itemType = "habit",
}: DeleteConfirmDialogProps) {
  const hasSignificantHistory = (streak && streak > 7) || (logCount && logCount > 10);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
          </div>

          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-foreground/70">
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">"{itemName}"</span>?
              </p>

              {/* Show what they'll lose */}
              {hasSignificantHistory && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    You'll lose:
                  </p>
                  <ul className="text-sm text-foreground/70 space-y-1 ml-6">
                    {streak && streak > 0 && (
                      <li className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>
                          Your <strong>{streak}-day streak</strong>
                        </span>
                      </li>
                    )}
                    {logCount && logCount > 0 && (
                      <li className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>
                          <strong>{logCount} logged entries</strong> of history
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <p className="text-sm text-foreground/50">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="mt-0">Keep {itemType}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteConfirmDialog;
