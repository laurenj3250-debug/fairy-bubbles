import { useState } from "react";
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
  const { data: allItems = [], isLoading } = useQuery<DreamScrollItem[]>({
    queryKey: ["/api/dream-scroll"],
  });

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
        priority: editPriority,
        cost: editCost || undefined,
      });
    }
  };

  const handleAddItem = () => {
    if (editTitle.trim()) {
      createMutation.mutate({
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        category: selectedCategory,
        priority: editPriority,
        cost: editCost || undefined,
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
      <div className="min-h-screen flex items-center justify-center pb-24 bg-background">
        <div className="animate-pulse text-lg text-foreground">Loading Expedition Log...</div>
      </div>
    );
  }

  const currentCategory = CATEGORIES.find(c => c.value === selectedCategory);

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern">
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <Target className="w-9 h-9 text-[hsl(var(--accent))]" />
            <h1 className="text-4xl font-bold text-foreground">Expedition Log</h1>
          </div>
          <p className="text-muted-foreground relative z-10">
            Track your mountaineering aspirations and life goals
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map(category => {
            const itemCount = allItems.filter(i => i.category === category.value).length;
            const completedCount = allItems.filter(i => i.category === category.value && i.completed).length;
            const isSelected = selectedCategory === category.value;

            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={cn(
                  "px-5 py-3 rounded-xl font-semibold transition-all duration-300 border-2",
                  isSelected
                    ? `${category.bgColor} ${category.borderColor} shadow-lg`
                    : "bg-card/40 border-card-border hover:bg-card/60"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.emoji}</span>
                  <span className="text-foreground">{category.label}</span>
                  {itemCount > 0 && (
                    <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground">
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
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-card-border shadow-lg topo-pattern">
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-bold text-foreground">{completionRate}%</span>
            </div>
            <div className="w-full h-3 bg-muted/50 rounded-full overflow-hidden relative z-10">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${completionRate}%`,
                  background: 'hsl(var(--accent))'
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground relative z-10">
              <span>{completedItems.length} completed</span>
              <span>{activeItems.length} remaining</span>
            </div>
          </div>
        )}

        {/* Tag Management */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-card-border shadow-lg topo-pattern">
          <div className="flex items-center justify-between mb-3 relative z-10">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags for {currentCategory?.label}
            </h3>
            <button
              onClick={() => setIsCreatingTag(!isCreatingTag)}
              className="text-xs px-3 py-1.5 bg-muted/50 hover:bg-muted text-[hsl(var(--accent))] rounded-lg transition-colors border border-border"
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
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TAG_COLORS.map((color, i) => (
                  <option key={i} value={color} className="bg-muted">{`Color ${i + 1}`}</option>
                ))}
              </select>
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || createTagMutation.isPending}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground rounded-lg text-sm"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsCreatingTag(false);
                  setNewTagName("");
                }}
                className="px-4 py-2 bg-muted/50 hover:bg-muted text-foreground rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 relative z-10">
            {categoryTags.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tags yet. Create one to organize your goals!</p>
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
                    className="text-destructive/60 hover:text-destructive"
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
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-5 border border-card-border shadow-lg topo-pattern">
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
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)..."
                rows={2}
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                  <label className="text-xs text-muted-foreground block mb-2">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {PRIORITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-muted">{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Difficulty</label>
                  <select
                    value={editCost || "easy"}
                    onChange={(e) => setEditCost(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {DIFFICULTY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-muted">
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
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground rounded-lg font-semibold"
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
                  className="px-4 py-2.5 bg-muted/50 hover:bg-muted text-foreground rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-4 bg-muted/20 hover:bg-muted/30 border-2 border-dashed border-border rounded-xl text-[hsl(var(--accent))] font-semibold transition-all"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add New Goal
          </button>
        )}

        {/* Items List */}
        <div className="space-y-3">
          {activeItems.length === 0 && completedItems.length === 0 ? (
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-12 text-center border border-card-border shadow-lg topo-pattern">
              <div className="relative z-10">
                <Mountain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No goals yet. Add your first objective!</p>
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
                <details className="bg-card/40 backdrop-blur-sm rounded-xl border border-card-border overflow-hidden shadow-lg topo-pattern">
                  <summary className="p-4 cursor-pointer text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 relative z-10">
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
      <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-[hsl(var(--accent))]/50 shadow-lg topo-pattern">
        <div className="space-y-3 relative z-10">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            >
              Save
            </button>
            <button
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 bg-muted/50 hover:bg-muted text-foreground rounded-lg"
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
      "bg-card/80 backdrop-blur-sm rounded-xl p-4 border transition-all shadow-lg topo-pattern",
      item.completed ? "border-primary/30 bg-primary/10" : "border-card-border hover:border-border"
    )}>
      <div className="flex items-start gap-3 relative z-10">
        <button
          onClick={onToggle}
          className={cn(
            "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5",
            item.completed
              ? "bg-primary border-primary"
              : "border-border hover:border-border/80"
          )}
        >
          {item.completed && <Check className="w-4 h-4 text-primary-foreground" />}
        </button>
        <div className="flex-1">
          <h4 className={cn(
            "font-semibold mb-1",
            item.completed ? "text-muted-foreground line-through" : "text-foreground"
          )}>
            {item.title}
          </h4>
          {item.description && (
            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
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
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
