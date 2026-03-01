import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Pencil, Check, Sparkles, ChevronDown } from "lucide-react";
import type { DreamScrollItem } from "@shared/schema";
import { WELLNESS_CUPS, parseCups, cupScore } from "@shared/wellness-cups";
import { cn } from "@/lib/utils";

// ─── Cup picker (inline) ─────────────────────────────────────────────
function CupPicker({ selected, onToggle, size = "sm" }: {
  selected: number[];
  onToggle: (idx: number) => void;
  size?: "sm" | "md";
}) {
  const px = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  return (
    <div className="flex gap-1.5 items-center">
      {WELLNESS_CUPS.map((cup) => {
        const active = selected.includes(cup.index);
        return (
          <button
            key={cup.index}
            type="button"
            onClick={() => onToggle(cup.index)}
            aria-label={cup.name}
            aria-pressed={active}
            className={cn(
              px, "rounded-full border-2 transition-all flex-shrink-0",
              active ? "scale-110" : "opacity-50 hover:opacity-80"
            )}
            style={{
              backgroundColor: active ? cup.color : "transparent",
              borderColor: cup.color,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Cup pills (display only) ────────────────────────────────────────
function CupPills({ cups }: { cups: number[] }) {
  if (!cups || cups.length === 0) return null;
  return (
    <div className="flex gap-1 flex-wrap">
      {cups.map((idx) => {
        const cup = WELLNESS_CUPS[idx];
        if (!cup) return null;
        return (
          <span
            key={idx}
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
            style={{
              backgroundColor: cup.color + "25",
              color: cup.color,
            }}
          >
            {cup.short}
          </span>
        );
      })}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────
export default function DreamScrollMountain() {
  const [filterCup, setFilterCup] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCups, setEditCups] = useState<number[]>([]);
  const [pendingToggleId, setPendingToggleId] = useState<number | null>(null);

  // Add item state
  const [addTitle, setAddTitle] = useState("");
  const [addCups, setAddCups] = useState<number[]>([]);
  const addInputRef = useRef<HTMLInputElement>(null);

  // ─── Data fetching ─────────────────────────────────────────────
  const { data: allItems = [], isLoading } = useQuery<DreamScrollItem[]>({
    queryKey: ["/api/dream-scroll"],
  });

  const { data: wheelState } = useQuery<{
    cupLevels: number[];
    checkedToday: string;
  }>({
    queryKey: ["/api/wellness-wheel/state"],
  });

  const cupLevels = wheelState?.cupLevels || [3, 3, 3, 3, 3, 3];

  // ─── Mutations ─────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (item: { title: string; cups: number[] }) => {
      return apiRequest("/api/dream-scroll", "POST", {
        title: item.title,
        category: "do",
        priority: "medium",
        cups: item.cups,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dream-scroll"] });
      setAddTitle("");
      setAddCups([]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DreamScrollItem> & { id: number }) => {
      return apiRequest(`/api/dream-scroll/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dream-scroll"] });
      setEditingId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/dream-scroll/${id}/toggle`, "POST");
    },
    onMutate: (id) => setPendingToggleId(id),
    onSettled: () => setPendingToggleId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dream-scroll"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/dream-scroll/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dream-scroll"] });
    },
  });

  // ─── Derived data ──────────────────────────────────────────────
  const activeItems = useMemo(() => allItems.filter((i) => !i.completed), [allItems]);
  const completedItems = useMemo(() => allItems.filter((i) => i.completed), [allItems]);

  const { tagged, untagged } = useMemo(() => {
    const tagged: DreamScrollItem[] = [];
    const untagged: DreamScrollItem[] = [];
    for (const item of activeItems) {
      const cups = parseCups(item.cups);
      if (cups.length === 0) untagged.push(item);
      else tagged.push(item);
    }
    return { tagged, untagged };
  }, [activeItems]);

  // Sort tagged by composite score (descending), then alphabetical
  const sortedTagged = useMemo(() => {
    return [...tagged].sort((a, b) => {
      const sa = cupScore(parseCups(a.cups), cupLevels);
      const sb = cupScore(parseCups(b.cups), cupLevels);
      if (sb !== sa) return sb - sa;
      return a.title.localeCompare(b.title);
    });
  }, [tagged, cupLevels]);

  // Filter by cup if active
  const displayItems = filterCup !== null
    ? sortedTagged.filter((item) => parseCups(item.cups).includes(filterCup))
    : sortedTagged;

  // Cup item counts (for filter strip)
  const cupItemCounts = useMemo(() => {
    const counts = new Array(WELLNESS_CUPS.length).fill(0);
    for (const item of activeItems) {
      const cups = parseCups(item.cups);
      for (const idx of cups) {
        counts[idx]++;
      }
    }
    return counts;
  }, [activeItems]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleAdd = () => {
    if (addTitle.trim()) {
      createMutation.mutate({ title: addTitle.trim(), cups: addCups });
    }
  };

  const startEdit = (item: DreamScrollItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditCups(parseCups(item.cups));
    setExpandedId(item.id);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateMutation.mutate({
        id: editingId,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        cups: editCups,
      });
    }
  };

  const toggleEditCup = (idx: number) => {
    setEditCups((prev) =>
      prev.includes(idx) ? prev.filter((c) => c !== idx) : [...prev, idx]
    );
  };

  const toggleAddCup = (idx: number) => {
    setAddCups((prev) =>
      prev.includes(idx) ? prev.filter((c) => c !== idx) : [...prev, idx]
    );
  };

  // ─── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <div className="animate-pulse text-lg text-foreground/60">Loading wishlist...</div>
      </div>
    );
  }

  // ─── Empty state ───────────────────────────────────────────────
  if (allItems.length === 0) {
    const prompts = [
      { cup: 0, q: "What gets your heart pounding?" },
      { cup: 1, q: "What scares you in a good way?" },
      { cup: 2, q: "What have you never tried?" },
      { cup: 3, q: "What makes time dissolve?" },
      { cup: 4, q: "Who haven't you called in a while?" },
      { cup: 5, q: "What are you getting better at?" },
    ];
    return (
      <div className="min-h-screen pb-24">
        <div className="max-w-3xl mx-auto p-6 space-y-8">
          <div className="text-center pt-12 pb-4">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-foreground/30" />
            <h1 className="text-3xl font-bold text-foreground mb-2">What would fill your cups?</h1>
            <p className="text-foreground/50 text-sm">Tap a prompt to get started</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prompts.map(({ cup, q }) => {
              const c = WELLNESS_CUPS[cup];
              return (
                <button
                  key={cup}
                  onClick={() => {
                    setAddCups([cup]);
                    addInputRef.current?.focus();
                  }}
                  className="p-4 rounded-xl border text-left transition-all hover:scale-[1.02] group"
                  style={{
                    borderColor: c.color + "40",
                    background: c.color + "08",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-xs font-semibold" style={{ color: c.color }}>{c.name}</span>
                  </div>
                  <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">{q}</span>
                </button>
              );
            })}
          </div>
          {/* Add input even in empty state */}
          <div className="flex items-center gap-3 bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-xl p-3">
            <Plus className="w-5 h-5 text-foreground/40 flex-shrink-0" />
            <input
              ref={addInputRef}
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Type something you want to try..."
              className="flex-1 bg-transparent text-foreground placeholder-foreground/30 text-sm focus:outline-none"
            />
            <CupPicker selected={addCups} onToggle={toggleAddCup} />
            <button
              onClick={handleAdd}
              disabled={!addTitle.trim() || createMutation.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
              style={{
                background: "hsl(var(--accent))",
                color: "white",
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 pt-2 pb-1">
          <Sparkles className="w-7 h-7 text-foreground/60" />
          <h1 className="text-2xl font-bold text-foreground">Wishlist</h1>
          <span className="text-sm text-foreground/40 ml-auto">
            {activeItems.length} active
          </span>
        </div>

        {/* Cup filter strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {WELLNESS_CUPS.map((cup) => {
            const level = cupLevels[cup.index] ?? 3;
            const count = cupItemCounts[cup.index];
            const isActive = filterCup === cup.index;
            // Low cups = vivid, high cups = softer
            const opacity = level <= 2 ? 1 : level <= 3 ? 0.7 : 0.45;

            return (
              <button
                key={cup.index}
                onClick={() => setFilterCup(isActive ? null : cup.index)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isActive ? "" : "hover:bg-foreground/5"
                )}
                style={{
                  opacity,
                  ...(isActive ? { background: cup.color + "15", boxShadow: `0 0 0 2px ${cup.color}` } : {}),
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cup.color }}
                />
                <span className="text-foreground/80">{cup.short}</span>
                <span className="text-foreground/40">{level}</span>
                {count > 0 && (
                  <span className="text-foreground/30 ml-auto">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add item bar */}
        <div className="flex items-center gap-3 bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-xl p-3">
          <Plus className="w-5 h-5 text-foreground/40 flex-shrink-0" />
          <input
            type="text"
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Type something you want to try..."
            className="flex-1 bg-transparent text-foreground placeholder-foreground/30 text-sm focus:outline-none min-w-0"
          />
          <div className="flex-shrink-0">
            <CupPicker selected={addCups} onToggle={toggleAddCup} />
          </div>
          {addTitle.trim() && (
            <button
              onClick={handleAdd}
              disabled={createMutation.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
              style={{
                background: "hsl(var(--accent))",
                color: "white",
              }}
            >
              Add
            </button>
          )}
        </div>

        {/* Sorted items */}
        {displayItems.length > 0 && (
          <div className="space-y-1">
            {displayItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                cupLevels={cupLevels}
                expanded={expandedId === item.id}
                editing={editingId === item.id}
                editTitle={editTitle}
                editDescription={editDescription}
                editCups={editCups}
                toggleDisabled={pendingToggleId === item.id}
                onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onToggleComplete={() => toggleMutation.mutate(item.id)}
                onDelete={() => {
                  if (confirm("Delete this item?")) deleteMutation.mutate(item.id);
                }}
                onStartEdit={() => startEdit(item)}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditingId(null)}
                setEditTitle={setEditTitle}
                setEditDescription={setEditDescription}
                toggleEditCup={toggleEditCup}
              />
            ))}
          </div>
        )}

        {/* Filter active but no results */}
        {filterCup !== null && displayItems.length === 0 && (
          <div className="text-center py-8 text-foreground/40 text-sm">
            No items tagged with {WELLNESS_CUPS[filterCup]?.name}
          </div>
        )}

        {/* Needs tagging section */}
        {untagged.length > 0 && filterCup === null && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-1 pt-4 pb-2">
              <span className="text-xs font-semibold text-foreground/40">Not yet tagged</span>
              <span className="text-xs text-foreground/25">({untagged.length})</span>
            </div>
            {untagged.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                cupLevels={cupLevels}
                expanded={expandedId === item.id}
                editing={editingId === item.id}
                editTitle={editTitle}
                editDescription={editDescription}
                editCups={editCups}
                toggleDisabled={pendingToggleId === item.id}
                onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onToggleComplete={() => toggleMutation.mutate(item.id)}
                onDelete={() => {
                  if (confirm("Delete this item?")) deleteMutation.mutate(item.id);
                }}
                onStartEdit={() => startEdit(item)}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditingId(null)}
                setEditTitle={setEditTitle}
                setEditDescription={setEditDescription}
                toggleEditCup={toggleEditCup}
                showTagPrompt
              />
            ))}
          </div>
        )}

        {/* Completed toggle */}
        {completedItems.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-xs text-foreground/40 hover:text-foreground/60 transition-colors px-1"
            >
              <ChevronDown className={cn(
                "w-3.5 h-3.5 transition-transform",
                showCompleted && "rotate-180"
              )} />
              Show completed ({completedItems.length})
            </button>
            {showCompleted && (
              <div className="space-y-1 mt-2">
                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foreground/[0.03] transition-colors opacity-50"
                  >
                    <button
                      onClick={() => toggleMutation.mutate(item.id)}
                      disabled={pendingToggleId === item.id}
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "hsl(var(--primary))",
                        borderColor: "hsl(var(--primary))",
                      }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </button>
                    <span className="text-sm text-foreground/50 line-through flex-1">{item.title}</span>
                    <CupPills cups={parseCups(item.cups)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Item Row ────────────────────────────────────────────────────────
function ItemRow({
  item,
  cupLevels,
  expanded,
  editing,
  editTitle,
  editDescription,
  editCups,
  toggleDisabled,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  setEditTitle,
  setEditDescription,
  toggleEditCup,
  showTagPrompt,
}: {
  item: DreamScrollItem;
  cupLevels: number[];
  expanded: boolean;
  editing: boolean;
  editTitle: string;
  editDescription: string;
  editCups: number[];
  toggleDisabled: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  setEditTitle: (v: string) => void;
  setEditDescription: (v: string) => void;
  toggleEditCup: (idx: number) => void;
  showTagPrompt?: boolean;
}) {
  const cups = parseCups(item.cups);
  const score = cupScore(cups, cupLevels);

  return (
    <div
      className={cn(
        "rounded-lg border transition-all group",
        expanded ? "border-foreground/15 bg-foreground/[0.03]" : "border-transparent hover:bg-foreground/[0.03]"
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-3 py-2">
        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          disabled={toggleDisabled}
          className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50"
          style={{ borderColor: "hsl(var(--foreground) / 0.2)" }}
          aria-label={`Mark "${item.title}" complete`}
        >
          {/* empty */}
        </button>

        {/* Title + description preview (clickable to expand) */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onToggleExpand}
        >
          <div className="text-sm font-semibold text-foreground truncate">{item.title}</div>
          {item.description && !expanded && (
            <div className="text-xs text-foreground/40 truncate">{item.description}</div>
          )}
        </div>

        {/* Cup pills or tag prompt */}
        <div className="flex-shrink-0">
          {cups.length > 0 ? (
            <CupPills cups={cups} />
          ) : showTagPrompt ? (
            <button
              onClick={onStartEdit}
              className="flex gap-0.5"
              title="Tag this item"
              aria-label="Tag this item with cups"
            >
              {WELLNESS_CUPS.map((cup) => (
                <div
                  key={cup.index}
                  className="w-3 h-3 rounded-full border opacity-30"
                  style={{ borderColor: cup.color }}
                />
              ))}
            </button>
          ) : null}
        </div>

        {/* Actions (desktop: visible on hover via group) */}
        <div className="hidden sm:flex gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity">
          <button
            onClick={onStartEdit}
            className="p-1.5 rounded text-foreground/30 hover:text-foreground/60 transition-colors"
            aria-label="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded text-foreground/30 hover:text-red-400 transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {editing ? (
            <>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Notes..."
                rows={3}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] resize-none"
              />
              <div>
                <label className="text-xs text-foreground/40 block mb-1.5">Cups</label>
                <CupPicker selected={editCups} onToggle={toggleEditCup} size="md" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onSaveEdit}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: "hsl(var(--accent))", color: "white" }}
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-foreground/60 bg-foreground/5 hover:bg-foreground/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onDelete}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors ml-auto"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <>
              {item.description && (
                <p className="text-sm text-foreground/60">{item.description}</p>
              )}
              {score >= 0 && (
                <div className="text-[10px] text-foreground/25">
                  score {score}
                </div>
              )}
              {/* Mobile actions */}
              <div className="flex gap-2 sm:hidden">
                <button
                  onClick={onStartEdit}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-foreground/50 bg-foreground/5 hover:bg-foreground/10 transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-400/60 bg-red-500/5 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
