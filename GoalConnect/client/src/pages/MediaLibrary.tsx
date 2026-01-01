import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Tv,
  Film,
  AudioLines,
  Podcast,
  Plus,
  Star,
  Trash2,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import {
  useMediaLibrary,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_BG_COLORS,
  MEDIA_TYPE_LABELS,
  type MediaItem,
  type MediaType,
  type MediaStatus,
  type MediaItemInput,
} from "@/hooks/useMediaLibrary";

// Media type icons
const MEDIA_ICONS: Record<MediaType, LucideIcon> = {
  book: BookOpen,
  tv_show: Tv,
  movie: Film,
  audiobook: AudioLines,
  podcast: Podcast,
};

// Status cycle order for click-to-cycle
const STATUS_CYCLE: MediaStatus[] = ["want", "current", "paused", "done", "abandoned"];

export default function MediaLibrary() {
  const [activeTab, setActiveTab] = useState<MediaType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MediaStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "title" | "year">("recent");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<MediaType>("book");
  const [formStatus, setFormStatus] = useState<MediaStatus>("want");
  const [formAuthor, setFormAuthor] = useState("");
  const [formYear, setFormYear] = useState("");
  const [formProgress, setFormProgress] = useState("");
  const [formTotalProgress, setFormTotalProgress] = useState("");
  const [formRating, setFormRating] = useState<number>(0);
  const [formNotes, setFormNotes] = useState("");

  const {
    items,
    isLoading,
    error,
    createItem,
    updateItem,
    updateStatus,
    deleteItem,
    isCreating,
    isUpdating,
    isDeleting,
  } = useMediaLibrary({
    type: activeTab !== "all" ? activeTab : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sort: sortBy,
  });

  const resetForm = () => {
    setFormTitle("");
    setFormType("book");
    setFormStatus("want");
    setFormAuthor("");
    setFormYear("");
    setFormProgress("");
    setFormTotalProgress("");
    setFormRating(0);
    setFormNotes("");
  };

  const handleAdd = async () => {
    if (!formTitle.trim()) return;

    const input: MediaItemInput = {
      title: formTitle.trim(),
      mediaType: formType,
      status: formStatus,
      author: formAuthor.trim() || undefined,
      year: formYear ? parseInt(formYear) : undefined,
      currentProgress: formProgress.trim() || undefined,
      totalProgress: formTotalProgress.trim() || undefined,
      rating: formRating || undefined,
      notes: formNotes.trim() || undefined,
    };

    await createItem(input);
    resetForm();
    setIsAdding(false);
  };

  const handleEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormType(item.mediaType);
    setFormStatus(item.status);
    setFormAuthor(item.author || "");
    setFormYear(item.year?.toString() || "");
    setFormProgress(item.currentProgress || "");
    setFormTotalProgress(item.totalProgress || "");
    setFormRating(item.rating || 0);
    setFormNotes(item.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !formTitle.trim()) return;

    await updateItem({
      id: editingId,
      title: formTitle.trim(),
      mediaType: formType,
      status: formStatus,
      author: formAuthor.trim() || undefined,
      year: formYear ? parseInt(formYear) : undefined,
      currentProgress: formProgress.trim() || undefined,
      totalProgress: formTotalProgress.trim() || undefined,
      rating: formRating || undefined,
      notes: formNotes.trim() || undefined,
    });
    resetForm();
    setEditingId(null);
  };

  const handleCycleStatus = async (item: MediaItem) => {
    const currentIdx = STATUS_CYCLE.indexOf(item.status);
    const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length;
    await updateStatus({ id: item.id, status: STATUS_CYCLE[nextIdx] });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this item?")) {
      await deleteItem(id);
    }
  };

  // Tabs for media types
  const tabs: Array<{ key: MediaType | "all"; label: string; icon?: LucideIcon }> = [
    { key: "all", label: "All" },
    { key: "book", label: "Books", icon: BookOpen },
    { key: "tv_show", label: "Shows", icon: Tv },
    { key: "movie", label: "Movies", icon: Film },
    { key: "audiobook", label: "Audio", icon: AudioLines },
    { key: "podcast", label: "Podcasts", icon: Podcast },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <div className="animate-pulse text-lg text-foreground">Loading Media Library...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <div className="text-red-400">Error loading media library</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-6">
        <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
          Media Library
        </h1>
        <button
          onClick={() => {
            resetForm();
            setIsAdding(true);
            setEditingId(null);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-peach-400/20 text-peach-400 hover:bg-peach-400/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors",
                activeTab === tab.key
                  ? "bg-peach-400/20 text-peach-400"
                  : "text-[var(--text-muted)] hover:bg-white/5"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MediaStatus | "all")}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-peach-400/50"
        >
          <option value="all">All Status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-peach-400/50"
        >
          <option value="recent">Recent</option>
          <option value="rating">Rating</option>
          <option value="title">Title A-Z</option>
          <option value="year">Year</option>
        </select>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="glass-card frost-accent mb-6 p-4">
          <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-4">
            {editingId ? "Edit Item" : "Add New Item"}
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <input
              type="text"
              placeholder="Title *"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-peach-400/50"
            />

            {/* Type & Status row */}
            <div className="flex gap-3">
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as MediaType)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-peach-400/50"
              >
                {Object.entries(MEDIA_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as MediaStatus)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-peach-400/50"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Author & Year row */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Author/Creator"
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-peach-400/50"
              />
              <input
                type="number"
                placeholder="Year"
                value={formYear}
                onChange={(e) => setFormYear(e.target.value)}
                className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-peach-400/50"
              />
            </div>

            {/* Progress row */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Current (e.g., S2E5, pg 145)"
                value={formProgress}
                onChange={(e) => setFormProgress(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-peach-400/50"
              />
              <input
                type="text"
                placeholder="Total (e.g., 8 seasons)"
                value={formTotalProgress}
                onChange={(e) => setFormTotalProgress(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-peach-400/50"
              />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormRating(star === formRating ? 0 : star)}
                    className="p-1 transition-colors"
                  >
                    <Star
                      className={cn(
                        "w-5 h-5",
                        star <= formRating ? "text-amber-400 fill-amber-400" : "text-white/20"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <textarea
              placeholder="Notes (optional)"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-peach-400/50 resize-none"
            />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  resetForm();
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 rounded-lg text-[var(--text-muted)] hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleSaveEdit : handleAdd}
                disabled={!formTitle.trim() || isCreating || isUpdating}
                className="px-4 py-2 rounded-lg bg-peach-400/20 text-peach-400 hover:bg-peach-400/30 transition-colors disabled:opacity-50"
              >
                {isCreating || isUpdating ? "Saving..." : editingId ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-[var(--text-muted)]/40 mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No items yet. Add something you're watching or reading!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = MEDIA_ICONS[item.mediaType];
            return (
              <div
                key={item.id}
                className="glass-card frost-accent p-3 flex items-start gap-3 group"
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-medium text-[var(--text-primary)] truncate">
                        {item.title}
                      </h4>
                      {(item.author || item.year) && (
                        <p className="text-xs text-[var(--text-muted)]">
                          {item.author}
                          {item.author && item.year && " · "}
                          {item.year}
                        </p>
                      )}
                    </div>

                    {/* Rating stars */}
                    {item.rating && (
                      <div className="flex gap-0.5 flex-shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "w-3 h-3",
                              star <= item.rating! ? "text-amber-400 fill-amber-400" : "text-white/10"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Progress & Status row */}
                  <div className="flex items-center gap-2 mt-1.5">
                    {item.currentProgress && (
                      <span className="text-xs text-[var(--text-muted)] tabular-nums">
                        {item.currentProgress}
                        {item.totalProgress && ` / ${item.totalProgress}`}
                      </span>
                    )}
                    <button
                      onClick={() => handleCycleStatus(item)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                        STATUS_BG_COLORS[item.status],
                        STATUS_COLORS[item.status]
                      )}
                    >
                      {STATUS_LABELS[item.status]}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 rounded hover:bg-white/10 text-[var(--text-muted)] transition-colors"
                    title="Edit"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeleting}
                    className="p-1.5 rounded hover:bg-rose-400/20 text-rose-400/60 hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
