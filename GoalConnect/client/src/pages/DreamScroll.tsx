import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sparkles, Plus, Trash2, Edit, Check, X, Tag } from "lucide-react";
import type { DreamScrollItem, DreamScrollTag } from "@shared/schema";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "do", label: "To Do", emoji: "✨", bgColor: "bg-purple-500/20", borderColor: "border-purple-400/50" },
  { value: "buy", label: "To Buy", emoji: "🛍️", bgColor: "bg-blue-500/20", borderColor: "border-blue-400/50" },
  { value: "see", label: "To See", emoji: "👀", bgColor: "bg-green-500/20", borderColor: "border-green-400/50" },
  { value: "visit", label: "To Visit", emoji: "🗺️", bgColor: "bg-orange-500/20", borderColor: "border-orange-400/50" },
  { value: "learn", label: "To Learn", emoji: "📚", bgColor: "bg-indigo-500/20", borderColor: "border-indigo-400/50" },
  { value: "experience", label: "To Experience", emoji: "🎭", bgColor: "bg-pink-500/20", borderColor: "border-pink-400/50" },
  { value: "music", label: "Music", emoji: "🎹", bgColor: "bg-violet-500/20", borderColor: "border-violet-400/50" },
] as const;

const TAG_COLORS = [
  "bg-amber-500/20 text-amber-300",
  "bg-cyan-500/20 text-cyan-300",
  "bg-pink-500/20 text-pink-300",
  "bg-purple-500/20 text-purple-300",
  "bg-green-500/20 text-green-300",
  "bg-red-500/20 text-red-300",
  "bg-orange-500/20 text-orange-300",
  "bg-indigo-500/20 text-indigo-300",
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "text-gray-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "high", label: "High", color: "text-red-400" },
] as const;

const COST_OPTIONS = [
  { value: "free", label: "Free", emoji: "💚" },
  { value: "$", label: "$", emoji: "💵" },
  { value: "$$", label: "$$", emoji: "💰" },
  { value: "$$$", label: "$$$", emoji: "💎" },
] as const;

export default function DreamScroll() {
  const [selectedCategory, setSelectedCategory] = useState<string>("music");
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
      });
    }
  };

  const handleAdd = () => {
    if (editTitle.trim()) {
      createMutation.mutate({
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        category: selectedCategory,
        priority: "medium",
        tags: editTags.length > 0 ? JSON.stringify(editTags) : undefined,
      });
    }
  };

  const handleCreateTag = () => {
    if (newTagName.trim() && selectedCategory) {
      createTagMutation.mutate({
        category: selectedCategory,
        name: newTagName.trim(),
        color: newTagColor,
      });
    }
  };

  const filteredItems = allItems.filter(item => item.category === selectedCategory);
  const activeItems = filteredItems.filter(item => !item.completed);
  const completedItems = filteredItems.filter(item => item.completed);

  return (
    <div className="min-h-screen p-6 pb-24 max-w-4xl mx-auto relative z-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Dream Scroll</h1>
        <p className="text-white/60">Track your dreams and goals by category</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              selectedCategory === cat.value
                ? "bg-purple-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            )}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Tag Management */}
      <div className="glass-card rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white/80">Tags for {CATEGORIES.find(c => c.value === selectedCategory)?.label}</h3>
          <button
            onClick={() => setIsCreatingTag(!isCreatingTag)}
            className="text-xs px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded transition-colors"
          >
            <Plus className="w-3 h-3 inline mr-1" />
            New Tag
          </button>
        </div>

        {isCreatingTag && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name..."
              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {TAG_COLORS.map((color, i) => (
                <option key={i} value={color} className="bg-gray-900">{`Color ${i + 1}`}</option>
              ))}
            </select>
            <button
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || createTagMutation.isPending}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded text-sm"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsCreatingTag(false);
                setNewTagName("");
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {categoryTags.length === 0 ? (
            <p className="text-xs text-white/50">No tags yet. Create one to organize your dreams!</p>
          ) : (
            categoryTags.map(tag => (
              <div key={tag.id} className="flex items-center gap-1">
                <span className={cn("px-2 py-1 rounded text-xs font-medium", tag.color)}>
                  {tag.name}
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Delete tag "${tag.name}"?`)) {
                      deleteTagMutation.mutate(tag.id);
                    }
                  }}
                  className="text-red-400/60 hover:text-red-400"
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
        <div className="glass-card rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-white mb-3">Add to {CATEGORIES.find(c => c.value === selectedCategory)?.label}</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title..."
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {categoryTags.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {categoryTags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium border transition-all",
                        editTags.includes(tag.id)
                          ? `${tag.color} border-white/30`
                          : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!editTitle.trim() || createMutation.isPending}
                className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white rounded font-medium transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditTitle("");
                  setEditDescription("");
                  setEditTags([]);
                }}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 border border-dashed border-white/30 rounded text-white/70 font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      )}

      {/* Active Items */}
      {activeItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Active Dreams</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeItems.map(item => {
              const category = CATEGORIES.find(c => c.value === item.category);
              const isEditing = editingItem?.id === item.id;

              if (isEditing) {
                return (
                  <div key={item.id} className="glass-card rounded-lg p-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {categoryTags.length > 0 && (
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-white/60 mb-1">Tags</label>
                        <div className="flex flex-wrap gap-1.5">
                          {categoryTags.map(tag => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium border transition-all",
                                editTags.includes(tag.id)
                                  ? `${tag.color} border-white/30`
                                  : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                              )}
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={updateMutation.isPending}
                        className="flex-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              const itemTags = item.tags ? JSON.parse(item.tags) as number[] : [];
              const displayTags = itemTags
                .map(tagId => categoryTags.find(t => t.id === tagId))
                .filter(Boolean);

              return (
                <div key={item.id} className="glass-card rounded-lg p-3 border border-white/10">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleMutation.mutate(item.id)}
                      disabled={toggleMutation.isPending}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-white/40 hover:border-purple-400 transition-colors flex items-center justify-center text-white/0 hover:text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-white/60 mt-1">{item.description}</p>
                      )}
                      {displayTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {displayTags.map(tag => (
                            <span key={tag.id} className={cn("px-2 py-0.5 rounded text-xs font-medium", tag.color)}>
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this dream?")) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Completed Dreams ✨</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedItems.map(item => {
              const category = CATEGORIES.find(c => c.value === item.category);

              return (
                <div
                  key={item.id}
                  className="glass-card rounded-xl p-4 opacity-60"
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleMutation.mutate(item.id)}
                      className="mt-0.5 w-6 h-6 rounded border-2 border-green-400 bg-green-500/30 transition-colors flex items-center justify-center text-green-200"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{category?.emoji}</span>
                        <span className="text-xs text-white/60">{category?.label}</span>
                      </div>
                      <h3 className="text-white/70 font-semibold line-through">{item.title}</h3>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Delete this completed dream?")) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="px-2 py-1 text-red-300/60 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && activeItems.length === 0 && completedItems.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-white/40" />
          <h3 className="text-2xl font-bold text-white mb-2">No dreams yet!</h3>
          <p className="text-white/60 mb-4">Start building your wishlist of dreams and aspirations</p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium"
          >
            Add Your First Dream
          </button>
        </div>
      )}
    </div>
  );
}
