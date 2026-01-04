/**
 * AddBookDialog - Simple dialog for adding a new study book
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Check } from "lucide-react";

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; abbreviation?: string }) => void;
  isSubmitting?: boolean;
}

export function AddBookDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: AddBookDialogProps) {
  const [title, setTitle] = useState("");
  const [abbreviation, setAbbreviation] = useState("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setAbbreviation("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      abbreviation: abbreviation.trim() || undefined,
    });

    setTitle("");
    setAbbreviation("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Add Book
          </DialogTitle>
          <DialogDescription>
            Add a new book to your study planner
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., de Lahunta's Veterinary Neuroanatomy"
              required
              autoFocus
            />
          </div>

          {/* Abbreviation */}
          <div className="space-y-2">
            <Label htmlFor="abbreviation">Abbreviation (optional)</Label>
            <Input
              id="abbreviation"
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              placeholder="e.g., de Lahunta"
            />
            <p className="text-xs text-muted-foreground">
              Short name to display in compact views
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? (
                "Adding..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Add Book
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddBookDialog;
