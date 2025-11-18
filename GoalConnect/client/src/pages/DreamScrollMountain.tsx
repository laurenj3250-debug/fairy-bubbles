import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mountain, Plus, Trash2, Edit, Check, X, Tag, Target, TrendingUp } from "lucide-react";
import type { DreamScrollItem, DreamScrollTag } from "@shared/schema";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "summits", label: "Peaks to Climb", emoji: "⛰️", bgColor: "bg-slate-600/30", borderColor: "border-slate-500/50" },
  { value: "gear", label: "Gear Wishlist", emoji: "🎒", bgColor: "bg-blue-600/30", borderColor: "border-blue-500/50" },
  { value: "skills", label: "Skills to Master", emoji: "🧗", bgColor: "bg-cyan-600/30", borderColor: "border-cyan-500/50" },
  { value: "locations", label: "Ranges to Explore", emoji: "🗺️", bgColor: "bg-teal-600/30", borderColor: "border-teal-500/50" },
  { value: "expeditions", label: "Views to Witness", emoji: "🏔️", bgColor: "bg-sky-600/30", borderColor: "border-sky-500/50" },
  { value: "training", label: "Alpine Adventures", emoji: "⚡", bgColor: "bg-indigo-600/30", borderColor: "border-indigo-500/50" },
] as const;

const TAG_COLORS = [
  "bg-slate-500/30 text-slate-300 border-slate-500/50",
  "bg-blue-500/30 text-blue-300 border-blue-500/50",
  "bg-cyan-500/30 text-cyan-300 border-cyan-500/50",
  "bg-teal-500/30 text-teal-300 border-teal-500/50",
  "bg-sky-500/30 text-sky-300 border-sky-500/50",
  "bg-indigo-500/30 text-indigo-300 border-indigo-500/50",
  "bg-stone-500/30 text-stone-300 border-stone-500/50",
  "bg-gray-500/30 text-gray-300 border-gray-500/50",
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low Priority", color: "text-slate-400" },
  { value: "medium", label: "Medium Priority", color: "text-blue-400" },
  { value: "high", label: "High Priority", color: "text-cyan-400" },
] as const;

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Beginner", emoji: "⛰️" },
  { value: "moderate", label: "Intermediate", emoji: "🏔️" },
  { value: "hard", label: "Advanced", emoji: "⛰️" },
  { value: "extreme", label: "Expert", emoji: "🗻" },
] as const;

export default function DreamScrollMountain() {
  const [selectedCategory, setSelectedCategory] = useState<string>("summits");
  const [editingItem, setEditingItem] = useState<DreamScrollItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState<number[]>([]);
  const [editPriority, setEditPriority] = useState<string>("medium");
  const [editCost, setEditCost] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // Fetch all dream scroll items
  const { data: allItems = [], isLoading, isError, error } = useQuery<DreamScrollItem[]>({
    queryKey: ["/api/dream-scroll"],
  });

  // Log when data changes (replaces onSuccess/onError)
  useEffect(() => {
    if (allItems && !isLoading) {
      console.log('[DreamScrollMountain] Successfully loaded', allItems.length, 'items');
    }
  }, [allItems, isLoading]);

  useEffect(() => {
    if (isError && error) {
      console.error('[DreamScrollMountain] Failed to load:', error);
    }
  }, [isError, error]);

  console.log('[DreamScrollMountain] Query state:', { isLoading, isError, itemCount: allItems?.length });

  // Fetch tags for current category
  const { data: categoryTags = [] } = useQuery<DreamScrollTag[]>({
    queryKey: [`/api/dream-scroll/tags/${selectedCategory}`],
    enabled: selectedCategory !== "all",
  });

  const createMutation = useMutation({
    mutationFn: async (item: { title: string; description?: string; category: string; priority: string; cost?: string; tags?: string }) => {
      return apiRequest("/api/dream-scroll", "POST", item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dream-scroll"] });
      setIsAdding(false);
      setEditTitle("");
      setEditDescription("");
      setEditPriority("medium");
      setEditCost(null);
      setEditTags([]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DreamScrollItem> & { id: number }) => {
      return apiRequest(`/api/dream-scroll/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dream-scroll"] });
      setEditingItem(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/dream-scroll/${id}/toggle`, "POST");
    },
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

  const createTagMutation = useMutation({
    mutationFn: async (tag: { category: string; name: string; color: string }) => {
      return apiRequest("/api/dream-scroll/tags", "POST", tag);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/dream-scroll/tags/${selectedCategory}`] });
      setIsCreatingTag(false);
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0]);
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/dream-scroll/tags/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/dream-scroll/tags/${selectedCategory}`] });
    },
  });

  const handleEdit = (item: DreamScrollItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditTags(item.tags ? JSON.parse(item.tags) : []);
    setEditPriority(item.priority || "medium");
    setEditCost(item.cost || null);
  };

  const toggleTag = (tagId: number) => {
    setEditTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSaveEdit = () => {
    if (editingItem && editTitle.trim()) {
      updateMutation.mutate({
        id: editingItem.id,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        tags: editTags.length > 0 ? JSON.stringify(editTags) : undefined,
        priority: editPriority as any,
        cost: editCost as any,
      });
    }
  };

  const handleAddItem = () => {
    if (editTitle.trim()) {
      createMutation.mutate({
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        category: selectedCategory as any,
        priority: editPriority as any,
        cost: editCost as any,
        tags: editTags.length > 0 ? JSON.stringify(editTags) : undefined,
      });
    }
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTagMutation.mutate({
        category: selectedCategory,
        name: newTagName.trim(),
        color: newTagColor,
      });
    }
  };

  // Filter items by category
  const categoryItems = allItems.filter(item => item.category === selectedCategory);
  const completedItems = categoryItems.filter(item => item.completed);
  const activeItems = categoryItems.filter(item => !item.completed);

  const completionRate = categoryItems.length > 0
    ? Math.round((completedItems.length / categoryItems.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <div className="animate-pulse text-lg text-foreground">Loading Notes & Ideas...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <div className="text-center space-y-4">
          <div className="text-lg text-destructive">Failed to load Notes & Ideas</div>
          <div className="text-sm text-muted-foreground">{error?.message || "Unknown error"}</div>
        </div>
      </div>
    );
  }

  const currentCategory = CATEGORIES.find(c => c.value === selectedCategory);

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-8 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at top left, hsl(var(--primary) / 0.3), transparent 60%)`
            }}
          />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <Target className="w-9 h-9" style={{ color: 'hsl(var(--accent))' }} />
            <h1
              className="text-4xl font-bold"
              style={{
                background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Notes & Ideas
            </h1>
          </div>
          <p className="text-foreground/60 relative z-10">
            Capture your thoughts, dreams, and plans
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map(category => {
            // TODO: Fix category type mismatch between CATEGORIES and DreamScrollItem
            const itemCount = allItems.filter((i: any) => i.category === category.value).length;
            const completedCount = allItems.filter((i: any) => i.category === category.value && i.completed).length;
            const isSelected = selectedCategory === category.value;

            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={cn(
                  "px-5 py-3 rounded-xl font-semibold transition-all duration-300 backdrop-blur-xl border shadow-lg hover:scale-105",
                  isSelected
                    ? "text-white"
                    : "bg-background/30 border-foreground/10 hover:bg-background/40"
                )}
                style={isSelected ? {
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  borderColor: 'hsl(var(--primary) / 0.4)'
                } : {}}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.emoji}</span>
                  <span className={isSelected ? "text-white" : "text-foreground"}>{category.label}</span>
                  {itemCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: isSelected ? 'rgba(255,255,255,0.2)' : 'hsl(var(--foreground) / 0.1)',
                      color: isSelected ? 'white' : 'hsl(var(--foreground) / 0.7)'
                    }}>
                      {completedCount}/{itemCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stats Bar */}
        {categoryItems.length > 0 && (
          <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-4 border border-foreground/10 shadow-lg relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                background: `radial-gradient(circle at left, hsl(var(--accent) / 0.3), transparent 70%)`
              }}
            />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-sm text-foreground/70">Progress</span>
              <span className="text-sm font-bold text-foreground">{completionRate}%</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden relative z-10" style={{ background: 'hsl(var(--foreground) / 0.08)' }}>
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${completionRate}%`,
                  background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  boxShadow: '0 0 10px hsl(var(--accent) / 0.4)'
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-foreground/60 relative z-10">
              <span>{completedItems.length} completed</span>
              <span>{activeItems.length} remaining</span>
            </div>
          </div>
        )}

        {/* Tag Management */}
        <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-4 border border-foreground/10 shadow-lg relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              background: `radial-gradient(circle at right, hsl(var(--secondary) / 0.3), transparent 70%)`
            }}
          />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags for {currentCategory?.label}
            </h3>
            <button
              onClick={() => setIsCreatingTag(!isCreatingTag)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105 border"
              style={{
                background: 'hsl(var(--accent) / 0.15)',
                color: 'hsl(var(--accent))',
                borderColor: 'hsl(var(--accent) / 0.3)'
              }}
            >
              <Plus className="w-3 h-3 inline mr-1" />
              New Tag
            </button>
          </div>

          {isCreatingTag && (
            <div className="flex gap-2 mb-3 relative z-10">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name..."
                className="flex-1 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 border"
                style={{
                  background: 'hsl(var(--foreground) / 0.05)',
                  borderColor: 'hsl(var(--foreground) / 0.1)',
                  focusRingColor: 'hsl(var(--primary))'
                }}
              />
              <select
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 border"
                style={{
                  background: 'hsl(var(--foreground) / 0.05)',
                  borderColor: 'hsl(var(--foreground) / 0.1)'
                }}
              >
                {TAG_COLORS.map((color, i) => (
                  <option key={i} value={color}>{`Color ${i + 1}`}</option>
                ))}
              </select>
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || createTagMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm transition-all hover:scale-105"
                style={{
                  background: !newTagName.trim() || createTagMutation.isPending
                    ? 'hsl(var(--foreground) / 0.1)'
                    : `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  color: 'white'
                }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsCreatingTag(false);
                  setNewTagName("");
                }}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: 'hsl(var(--foreground) / 0.05)',
                  color: 'hsl(var(--foreground))'
                }}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 relative z-10">
            {categoryTags.length === 0 ? (
              <p className="text-xs text-foreground/60">No tags yet. Create one to organize your goals!</p>
            ) : (
              categoryTags.map(tag => (
                <div key={tag.id} className="flex items-center gap-1">
                  <span className={cn("px-3 py-1 rounded-lg text-xs font-medium border", tag.color)}>
                    {tag.name}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete tag "${tag.name}"?`)) {
                        deleteTagMutation.mutate(tag.id);
                      }
                    }}
                    className="transition-colors"
                    style={{
                      color: 'hsl(var(--destructive) / 0.6)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'hsl(var(--destructive))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'hsl(var(--destructive) / 0.6)';
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add New Item */}
        {isAdding ? (
          <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-5 border border-foreground/10 shadow-lg relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                background: `radial-gradient(circle at top, hsl(var(--primary) / 0.3), transparent 70%)`
              }}
            />
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 relative z-10">
              <Plus className="w-5 h-5" />
              Add to {currentCategory?.label}
            </h3>
            <div className="space-y-3 relative z-10">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title..."
                className="w-full rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 border"
                style={{
                  background: 'hsl(var(--foreground) / 0.05)',
                  borderColor: 'hsl(var(--foreground) / 0.1)'
                }}
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)..."
                rows={2}
                className="w-full rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 border"
                style={{
                  background: 'hsl(var(--foreground) / 0.05)',
                  borderColor: 'hsl(var(--foreground) / 0.1)'
                }}
              />
              {categoryTags.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          editTags.includes(tag.id)
                            ? tag.color
                            : "bg-muted/30 text-muted-foreground border-border"
                        )}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-foreground/70 block mb-2">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 border"
                    style={{
                      background: 'hsl(var(--foreground) / 0.05)',
                      borderColor: 'hsl(var(--foreground) / 0.1)'
                    }}
                  >
                    {PRIORITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-foreground/70 block mb-2">Difficulty</label>
                  <select
                    value={editCost || "easy"}
                    onChange={(e) => setEditCost(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 border"
                    style={{
                      background: 'hsl(var(--foreground) / 0.05)',
                      borderColor: 'hsl(var(--foreground) / 0.1)'
                    }}
                  >
                    {DIFFICULTY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.emoji} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddItem}
                  disabled={!editTitle.trim() || createMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all hover:scale-105"
                  style={{
                    background: !editTitle.trim() || createMutation.isPending
                      ? 'hsl(var(--foreground) / 0.1)'
                      : `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                    color: 'white'
                  }}
                >
                  Add Goal
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditTitle("");
                    setEditDescription("");
                    setEditTags([]);
                    setEditPriority("medium");
                    setEditCost(null);
                  }}
                  className="px-4 py-2.5 rounded-lg transition-colors"
                  style={{
                    background: 'hsl(var(--foreground) / 0.05)',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-4 border-2 border-dashed rounded-2xl font-semibold transition-all hover:scale-[1.02]"
            style={{
              background: 'hsl(var(--foreground) / 0.03)',
              borderColor: 'hsl(var(--foreground) / 0.1)',
              color: 'hsl(var(--accent))'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(var(--foreground) / 0.05)';
              e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'hsl(var(--foreground) / 0.03)';
              e.currentTarget.style.borderColor = 'hsl(var(--foreground) / 0.1)';
            }}
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add New Goal
          </button>
        )}

        {/* Items List */}
        <div className="space-y-3">
          {activeItems.length === 0 && completedItems.length === 0 ? (
            <div className="bg-background/40 backdrop-blur-xl rounded-3xl p-12 text-center border border-foreground/10 shadow-xl relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, hsl(var(--accent) / 0.3), transparent 70%)`
                }}
              />
              <div className="relative z-10">
                <Mountain className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--foreground) / 0.4)' }} />
                <p className="text-foreground/60">No goals yet. Add your first objective!</p>
              </div>
            </div>
          ) : (
            <>
              {/* Active Items */}
              {activeItems.map(item => (
                <DreamItem
                  key={item.id}
                  item={item}
                  tags={categoryTags}
                  onEdit={() => handleEdit(item)}
                  onToggle={() => toggleMutation.mutate(item.id)}
                  onDelete={() => {
                    if (confirm("Delete this goal?")) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                  editingItem={editingItem}
                  editTitle={editTitle}
                  editDescription={editDescription}
                  editTags={editTags}
                  editPriority={editPriority}
                  editCost={editCost}
                  setEditTitle={setEditTitle}
                  setEditDescription={setEditDescription}
                  setEditPriority={setEditPriority}
                  setEditCost={setEditCost}
                  toggleTag={toggleTag}
                  handleSaveEdit={handleSaveEdit}
                  setEditingItem={setEditingItem}
                />
              ))}

              {/* Completed Items */}
              {completedItems.length > 0 && (
                <details className="bg-background/40 backdrop-blur-xl rounded-2xl border border-foreground/10 overflow-hidden shadow-lg relative">
                  <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at bottom, hsl(var(--primary) / 0.2), transparent 70%)`
                    }}
                  />
                  <summary className="p-4 cursor-pointer hover:bg-foreground/5 transition-colors flex items-center gap-2 relative z-10" style={{ color: 'hsl(var(--foreground) / 0.7)' }}>
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">Completed ({completedItems.length})</span>
                  </summary>
                  <div className="p-4 pt-0 space-y-2">
                    {completedItems.map(item => (
                      <DreamItem
                        key={item.id}
                        item={item}
                        tags={categoryTags}
                        onEdit={() => handleEdit(item)}
                        onToggle={() => toggleMutation.mutate(item.id)}
                        onDelete={() => {
                          if (confirm("Delete this goal?")) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        editingItem={editingItem}
                        editTitle={editTitle}
                        editDescription={editDescription}
                        editTags={editTags}
                        editPriority={editPriority}
                        editCost={editCost}
                        setEditTitle={setEditTitle}
                        setEditDescription={setEditDescription}
                        setEditPriority={setEditPriority}
                        setEditCost={setEditCost}
                        toggleTag={toggleTag}
                        handleSaveEdit={handleSaveEdit}
                        setEditingItem={setEditingItem}
                      />
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Individual Goal Item Component
function DreamItem({ item, tags, onEdit, onToggle, onDelete, editingItem, editTitle, editDescription, editTags, editPriority, editCost, setEditTitle, setEditDescription, setEditPriority, setEditCost, toggleTag, handleSaveEdit, setEditingItem }: any) {
  const isEditing = editingItem?.id === item.id;
  const itemTags = item.tags ? JSON.parse(item.tags) : [];
  const itemTagObjects = tags.filter((t: any) => itemTags.includes(t.id));

  if (isEditing) {
    return (
      <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-4 border shadow-lg relative overflow-hidden" style={{ borderColor: 'hsl(var(--accent) / 0.5)' }}>
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: `radial-gradient(circle at top, hsl(var(--accent) / 0.3), transparent 70%)`
          }}
        />
        <div className="space-y-3 relative z-10">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 border"
            style={{
              background: 'hsl(var(--foreground) / 0.05)',
              borderColor: 'hsl(var(--foreground) / 0.1)'
            }}
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 border"
            style={{
              background: 'hsl(var(--foreground) / 0.05)',
              borderColor: 'hsl(var(--foreground) / 0.1)'
            }}
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: any) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium border",
                    editTags.includes(tag.id) ? tag.color : "bg-muted/30 text-muted-foreground border-border"
                  )}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 rounded-lg transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                color: 'white'
              }}
            >
              Save
            </button>
            <button
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                background: 'hsl(var(--foreground) / 0.05)',
                color: 'hsl(var(--foreground))'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-background/40 backdrop-blur-xl rounded-2xl p-4 border transition-all shadow-lg relative overflow-hidden hover:shadow-xl",
      item.completed ? "" : ""
    )}
      style={{
        borderColor: item.completed ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--foreground) / 0.1)'
      }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: item.completed
            ? `radial-gradient(circle at top right, hsl(var(--primary) / 0.3), transparent 70%)`
            : `radial-gradient(circle at top right, hsl(var(--accent) / 0.2), transparent 70%)`
        }}
      />
      <div className="flex items-start gap-3 relative z-10">
        <button
          onClick={onToggle}
          className={cn(
            "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5"
          )}
          style={{
            background: item.completed ? 'hsl(var(--primary))' : 'transparent',
            borderColor: item.completed ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.2)'
          }}
        >
          {item.completed && <Check className="w-4 h-4 text-white" />}
        </button>
        <div className="flex-1">
          <h4 className={cn(
            "font-semibold mb-1",
            item.completed ? "line-through" : "text-foreground"
          )}
            style={item.completed ? { color: 'hsl(var(--foreground) / 0.5)' } : {}}
          >
            {item.title}
          </h4>
          {item.description && (
            <p className="text-sm mb-2" style={{ color: 'hsl(var(--foreground) / 0.6)' }}>{item.description}</p>
          )}
          {itemTagObjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {itemTagObjects.map((tag: any) => (
                <span key={tag.id} className={cn("px-2 py-0.5 rounded text-xs font-medium border", tag.color)}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs" style={{ color: 'hsl(var(--foreground) / 0.6)' }}>
            {item.priority && (
              <span className={PRIORITY_OPTIONS.find(p => p.value === item.priority)?.color}>
                {PRIORITY_OPTIONS.find(p => p.value === item.priority)?.label}
              </span>
            )}
            {item.cost && (
              <span>
                {DIFFICULTY_OPTIONS.find(d => d.value === item.cost)?.emoji} {DIFFICULTY_OPTIONS.find(d => d.value === item.cost)?.label}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-2 transition-colors hover:bg-foreground/5 rounded-lg"
            style={{ color: 'hsl(var(--foreground) / 0.5)' }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 transition-colors hover:bg-foreground/5 rounded-lg"
            style={{ color: 'hsl(var(--foreground) / 0.5)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'hsl(var(--destructive))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'hsl(var(--foreground) / 0.5)';
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
