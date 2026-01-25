/**
 * AdventureModal Component
 * Modal for creating and editing outdoor adventures with photo upload
 */

import { useState, useRef, useEffect } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { Adventure, AdventureInput } from "@/hooks/useAdventures";

interface AdventureModalProps {
  adventure: Adventure | null;
  onClose: () => void;
  onSubmit: (input: AdventureInput) => Promise<void>;
  isSubmitting: boolean;
}

export function AdventureModal({
  adventure,
  onClose,
  onSubmit,
  isSubmitting,
}: AdventureModalProps) {
  const [date, setDate] = useState(adventure?.date || format(new Date(), "yyyy-MM-dd"));
  const [activity, setActivity] = useState(adventure?.activity || "");
  const [location, setLocation] = useState(adventure?.location || "");
  const [notes, setNotes] = useState(adventure?.notes || "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(adventure?.thumbPath || null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup Object URL on unmount or when localPreview changes
  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  // Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke old URL before creating new one
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
      const newUrl = URL.createObjectURL(file);
      setLocalPreview(newUrl);
      setPreview(newUrl);
      setPhoto(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) return;

    await onSubmit({
      date,
      activity: activity.trim(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      photo: photo || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="glass-card frost-accent w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {adventure ? "Edit Adventure" : "New Adventure"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo upload */}
          <div>
            <label className="text-sm text-[var(--text-muted)] mb-2 block">Photo</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video bg-white/5 border border-dashed border-white/20 rounded-lg overflow-hidden cursor-pointer hover:border-peach-500/50 transition-colors flex items-center justify-center"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center py-8">
                  <Camera className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                  <span className="text-sm text-[var(--text-muted)]">Click to add photo</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-sm text-[var(--text-muted)] mb-2 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--text-primary)] focus:border-peach-500/50 focus:outline-none"
            />
          </div>

          {/* Activity */}
          <div>
            <label className="text-sm text-[var(--text-muted)] mb-2 block">Activity *</label>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="Hiking, Birding, Climbing..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-peach-500/50 focus:outline-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-sm text-[var(--text-muted)] mb-2 block">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Smith Rock, OR"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-peach-500/50 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-[var(--text-muted)] mb-2 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-peach-500/50 focus:outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!activity.trim() || isSubmitting}
            className="w-full py-2.5 bg-peach-500 hover:bg-peach-600 disabled:bg-peach-500/50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              adventure ? "Update Adventure" : "Add Adventure"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdventureModal;
