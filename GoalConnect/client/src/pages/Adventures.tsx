/**
 * Adventures Page
 * Photo-centric tracking for outdoor adventures and bird life list
 */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  Mountain,
  Bird,
  Plus,
  Camera,
  MapPin,
  Calendar,
  Search,
  Edit2,
  Trash2,
  X,
  ImageOff,
  ChevronDown,
  Loader2,
  Clock,
} from "lucide-react";
import { AdventureTimeline } from "@/components/adventures";
import { useAdventures, type Adventure, type AdventureInput } from "@/hooks/useAdventures";
import { useBirds, type BirdSighting, type BirdInput, type BirdSort } from "@/hooks/useBirds";
import { format } from "date-fns";

type Tab = "adventures" | "timeline" | "birds";

export default function Adventures() {
  const [activeTab, setActiveTab] = useState<Tab>("adventures");
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Outdoor Adventures
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("adventures")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "adventures"
                ? "bg-peach-500/20 text-peach-400 border border-peach-500/30"
                : "bg-white/5 text-[var(--text-muted)] border border-white/10 hover:bg-white/10"
            )}
          >
            <Mountain className="w-4 h-4" />
            Adventures
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "timeline"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-white/5 text-[var(--text-muted)] border border-white/10 hover:bg-white/10"
            )}
          >
            <Clock className="w-4 h-4" />
            Memory Lane
          </button>
          <button
            onClick={() => setActiveTab("birds")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "birds"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                : "bg-white/5 text-[var(--text-muted)] border border-white/10 hover:bg-white/10"
            )}
          >
            <Bird className="w-4 h-4" />
            Life List
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "adventures" && <AdventuresTab year={currentYear} />}
        {activeTab === "timeline" && <TimelineTab year={currentYear} />}
        {activeTab === "birds" && <BirdsTab year={currentYear} />}
      </div>
    </div>
  );
}

// =============================================================================
// ADVENTURES TAB
// =============================================================================

function AdventuresTab({ year }: { year: string }) {
  const [showModal, setShowModal] = useState(false);
  const [editingAdventure, setEditingAdventure] = useState<Adventure | null>(null);
  const { toast } = useToast();

  const {
    adventures,
    pagination,
    isLoading,
    createAdventure,
    updateAdventure,
    deleteAdventure,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAdventures({ year });

  const handleCreate = async (input: AdventureInput) => {
    try {
      await createAdventure(input);
      setShowModal(false);
      toast({ title: "Adventure added!" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add adventure",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (input: AdventureInput & { id: number }) => {
    try {
      await updateAdventure(input);
      setEditingAdventure(null);
      toast({ title: "Adventure updated!" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update adventure",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this adventure?")) {
      try {
        await deleteAdventure(id);
        toast({ title: "Adventure deleted" });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete adventure",
          variant: "destructive",
        });
      }
    }
  };

  // Count unique dates
  const uniqueDates = new Set(adventures.map(a => a.date)).size;

  return (
    <>
      {/* Stats header */}
      <div className="glass-card frost-accent p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-peach-500/20 flex items-center justify-center">
            <Mountain className="w-5 h-5 text-peach-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-[var(--text-primary)]">
              {uniqueDates} days
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {adventures.length} adventures in {year}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-peach-500 hover:bg-peach-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Adventure
        </button>
      </div>

      {/* Photo Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-peach-400 animate-spin" />
        </div>
      ) : adventures.length === 0 ? (
        <div className="glass-card frost-accent p-12 text-center">
          <Mountain className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            No adventures yet
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Start logging your outdoor days to see them here
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-peach-500/20 text-peach-400 rounded-lg text-sm font-medium hover:bg-peach-500/30 transition-colors"
          >
            Add your first adventure
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {adventures.map((adventure) => (
            <AdventureCard
              key={adventure.id}
              adventure={adventure}
              onEdit={() => setEditingAdventure(adventure)}
              onDelete={() => handleDelete(adventure.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showModal || editingAdventure) && (
        <AdventureModal
          adventure={editingAdventure}
          onClose={() => {
            setShowModal(false);
            setEditingAdventure(null);
          }}
          onSubmit={editingAdventure
            ? (input) => handleUpdate({ ...input, id: editingAdventure.id })
            : handleCreate
          }
          isSubmitting={isCreating || isUpdating}
        />
      )}
    </>
  );
}

function AdventureCard({
  adventure,
  onEdit,
  onDelete,
}: {
  adventure: Adventure;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-peach-500/30 transition-colors cursor-pointer"
      onClick={onEdit}
    >
      {/* Photo or placeholder */}
      {adventure.thumbPath ? (
        <img
          src={adventure.thumbPath}
          alt={adventure.activity}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-peach-500/10 to-orange-500/10">
          <Camera className="w-8 h-8 text-peach-400/50" />
        </div>
      )}

      {/* Overlay with info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="text-xs text-white/70 mb-1">
          {format(new Date(adventure.date), "MMM d")}
        </div>
        <div className="text-sm font-medium text-white truncate">
          {adventure.activity}
        </div>
        {adventure.location && (
          <div className="flex items-center gap-1 text-xs text-white/60 mt-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{adventure.location}</span>
          </div>
        )}
      </div>

      {/* Actions - visible on mobile, hover on desktop */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 bg-black/50 hover:bg-black/70 rounded text-white/80 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 bg-black/50 hover:bg-red-500/50 rounded text-white/80 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AdventureModal({
  adventure,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  adventure: Adventure | null;
  onClose: () => void;
  onSubmit: (input: AdventureInput) => Promise<void>;
  isSubmitting: boolean;
}) {
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

// =============================================================================
// TIMELINE TAB (Memory Lane)
// =============================================================================

function TimelineTab({ year }: { year: string }) {
  const [editingAdventure, setEditingAdventure] = useState<Adventure | null>(null);
  const { toast } = useToast();

  const {
    adventures,
    isLoading,
    error,
    updateAdventure,
    deleteAdventure,
    isUpdating,
  } = useAdventures({ year, limit: 100 }); // Higher limit for timeline

  const handleUpdate = async (input: AdventureInput & { id: number }) => {
    try {
      await updateAdventure(input);
      setEditingAdventure(null);
      toast({ title: "Adventure updated!" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this adventure?")) {
      try {
        await deleteAdventure(id);
        toast({ title: "Adventure deleted" });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete adventure",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card frost-accent p-12 text-center">
        <Mountain className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          Failed to load adventures
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <>
      <AdventureTimeline
        adventures={adventures}
        onEdit={setEditingAdventure}
        onDelete={handleDelete}
      />

      {editingAdventure && (
        <AdventureModal
          adventure={editingAdventure}
          onClose={() => setEditingAdventure(null)}
          onSubmit={(input) => handleUpdate({ ...input, id: editingAdventure.id })}
          isSubmitting={isUpdating}
        />
      )}
    </>
  );
}

// =============================================================================
// BIRDS TAB
// =============================================================================

function BirdsTab({ year }: { year: string }) {
  const [showModal, setShowModal] = useState(false);
  const [editingBird, setEditingBird] = useState<BirdSighting | null>(null);
  const [sort, setSort] = useState<BirdSort>("alphabetical");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const { toast } = useToast();

  const {
    birds,
    total,
    isLoading,
    createBird,
    updateBird,
    deleteBird,
    isCreating,
    isUpdating,
    isDeleting,
  } = useBirds({ sort, search: debouncedSearch || undefined });

  const handleCreate = async (input: BirdInput) => {
    try {
      await createBird(input);
      setShowModal(false);
      toast({ title: "Species added to life list!" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add species",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (input: BirdInput & { id: number }) => {
    try {
      await updateBird(input);
      setEditingBird(null);
      toast({ title: "Species updated!" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update species",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Remove this species from your life list?")) {
      try {
        await deleteBird(id);
        toast({ title: "Species removed from life list" });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to remove species",
          variant: "destructive",
        });
      }
    }
  };

  // Count birds first seen this year
  const thisYearCount = birds.filter(b => b.firstSeenDate.startsWith(year)).length;

  return (
    <>
      {/* Stats header */}
      <div className="glass-card frost-accent p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
            <Bird className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-[var(--text-primary)]">
              {total} species
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {thisYearCount} new in {year}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search species..."
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-sky-500/50 focus:outline-none"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as BirdSort)}
              className="appearance-none px-3 py-2 pr-8 bg-white/5 border border-white/10 rounded-lg text-sm text-[var(--text-primary)] focus:border-sky-500/50 focus:outline-none cursor-pointer"
            >
              <option value="alphabetical">A-Z</option>
              <option value="date_desc">Recent first</option>
              <option value="date_asc">Oldest first</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>

          {/* Add button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Species
          </button>
        </div>
      </div>

      {/* Photo Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        </div>
      ) : birds.length === 0 ? (
        <div className="glass-card frost-accent p-12 text-center">
          <Bird className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            {search ? "No species found" : "Life list empty"}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            {search ? "Try a different search term" : "Start adding birds you've spotted"}
          </p>
          {!search && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-sky-500/20 text-sky-400 rounded-lg text-sm font-medium hover:bg-sky-500/30 transition-colors"
            >
              Add your first species
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {birds.map((bird) => (
            <BirdCard
              key={bird.id}
              bird={bird}
              onEdit={() => setEditingBird(bird)}
              onDelete={() => handleDelete(bird.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showModal || editingBird) && (
        <BirdModal
          bird={editingBird}
          onClose={() => {
            setShowModal(false);
            setEditingBird(null);
          }}
          onSubmit={editingBird
            ? (input) => handleUpdate({ ...input, id: editingBird.id })
            : handleCreate
          }
          isSubmitting={isCreating || isUpdating}
        />
      )}
    </>
  );
}

function BirdCard({
  bird,
  onEdit,
  onDelete,
}: {
  bird: BirdSighting;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-sky-500/30 transition-colors cursor-pointer"
      onClick={onEdit}
    >
      {/* Photo or placeholder */}
      {bird.thumbPath ? (
        <img
          src={bird.thumbPath}
          alt={bird.speciesName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500/10 to-blue-500/10">
          <Bird className="w-8 h-8 text-sky-400/50" />
        </div>
      )}

      {/* Overlay with info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="text-sm font-medium text-white truncate">
          {bird.speciesName}
        </div>
        <div className="text-xs text-white/70 mt-1">
          First seen {format(new Date(bird.firstSeenDate), "MMM d, yyyy")}
        </div>
        {bird.location && (
          <div className="flex items-center gap-1 text-xs text-white/60 mt-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{bird.location}</span>
          </div>
        )}
      </div>

      {/* Actions - visible on mobile, hover on desktop */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 bg-black/50 hover:bg-black/70 rounded text-white/80 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 bg-black/50 hover:bg-red-500/50 rounded text-white/80 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function BirdModal({
  bird,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  bird: BirdSighting | null;
  onClose: () => void;
  onSubmit: (input: BirdInput) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [speciesName, setSpeciesName] = useState(bird?.speciesName || "");
  const [firstSeenDate, setFirstSeenDate] = useState(bird?.firstSeenDate || format(new Date(), "yyyy-MM-dd"));
  const [location, setLocation] = useState(bird?.location || "");
  const [notes, setNotes] = useState(bird?.notes || "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(bird?.thumbPath || null);
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
    if (!speciesName.trim()) return;

    await onSubmit({
      speciesName: speciesName.trim(),
      firstSeenDate,
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
            {bird ? "Edit Species" : "Add Species"}
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
              className="aspect-video bg-white/5 border border-dashed border-white/20 rounded-lg overflow-hidden cursor-pointer hover:border-sky-500/50 transition-colors flex items-center justify-center"
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

          {/* Species name */}
          <div>
            <label className="text-sm text-[var(--text-muted)] mb-2 block">Species Name *</label>
            <input
              type="text"
              value={speciesName}
              onChange={(e) => setSpeciesName(e.target.value)}
              placeholder="Northern Cardinal"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-sky-500/50 focus:outline-none"
            />
          </div>

          {/* First seen date */}
          <div>
            <label className="text-sm text-[var(--text-muted)] mb-2 block">First Spotted</label>
            <input
              type="date"
              value={firstSeenDate}
              onChange={(e) => setFirstSeenDate(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--text-primary)] focus:border-sky-500/50 focus:outline-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-sm text-[var(--text-muted)] mb-2 block">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Malheur NWR, OR"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-sky-500/50 focus:outline-none"
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
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-sky-500/50 focus:outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!speciesName.trim() || isSubmitting}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              bird ? "Update Species" : "Add to Life List"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
