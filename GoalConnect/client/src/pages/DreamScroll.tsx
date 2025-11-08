import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sparkles, Plus, Trash2, Edit, Check, X, ChevronDown } from "lucide-react";
import type { DreamScrollItem } from "@shared/schema";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "do", label: "To Do", emoji: "✨", color: "from-purple-500 to-pink-500", bgColor: "bg-purple-500/20", borderColor: "border-purple-400/50" },
  { value: "buy", label: "To Buy", emoji: "🛍️", color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500/20", borderColor: "border-blue-400/50" },
  { value: "see", label: "To See", emoji: "👀", color: "from-green-500 to-emerald-500", bgColor: "bg-green-500/20", borderColor: "border-green-400/50" },
  { value: "visit", label: "To Visit", emoji: "🗺️", color: "from-orange-500 to-yellow-500", bgColor: "bg-orange-500/20", borderColor: "border-orange-400/50" },
  { value: "learn", label: "To Learn", emoji: "📚", color: "from-indigo-500 to-purple-500", bgColor: "bg-indigo-500/20", borderColor: "border-indigo-400/50" },
  { value: "experience", label: "To Experience", emoji: "🎭", color: "from-pink-500 to-rose-500", bgColor: "bg-pink-500/20", borderColor: "border-pink-400/50" },
] as const;

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
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [editingItem, setEditingItem] = useState<DreamScrollItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
  const [editCost, setEditCost] = useState<"free" | "$" | "$$" | "$$$" | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState<string>("do");

  // Fetch all dream scroll items
  const { data: allItems = [], isLoading } = useQuery<DreamScrollItem[]>({
    queryKey: ["/api/dream-scroll"],
  });

  const createMutation = useMutation({
    mutationFn: async (item: { title: string; description?: string; category: string; priority: string; cost?: string }) => {
      return apiRequest("/api/dream-scroll", "POST", item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dream-scroll"] });
      setIsAdding(false);
      setEditTitle("");
      setEditDescription("");
      setEditPriority("medium");
      setEditCost(null);
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

  const handleEdit = (item: DreamScrollItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditPriority(item.priority);
    setEditCost(item.cost || null);
  };

  const handleSaveEdit = () => {
    if (editingItem && editTitle.trim()) {
      updateMutation.mutate({
        id: editingItem.id,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        priority: editPriority,
        cost: editCost || undefined,
      });
    }
  };

  const handleAdd = () => {
    if (editTitle.trim()) {
      createMutation.mutate({
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        category: newItemCategory,
        priority: editPriority,
        cost: editCost || undefined,
      });
    }
  };

  const filteredItems = selectedCategory === "all"
    ? allItems
    : allItems.filter(item => item.category === selectedCategory);

  const activeItems = filteredItems.filter(item => !item.completed);
  const completedItems = filteredItems.filter(item => item.completed);

  const stats = CATEGORIES.map(cat => ({
    ...cat,
    count: allItems.filter(item => item.category === cat.value && !item.completed).length,
  }));

  return (
    <div className="min-h-screen p-6 pb-24 max-w-7xl mx-auto relative z-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-purple-400" />
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "'Comfortaa', cursive" }}>
            Dream Scroll
          </h1>
        </div>
        <p className="text-teal-200">Your magical wishlist of dreams and aspirations</p>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={cn(
              "p-4 rounded-lg border-2 transition-all",
              selectedCategory === cat.value
                ? `${cat.bgColor} ${cat.borderColor}`
                : "bg-white/5 border-white/20 hover:bg-white/10"
            )}
          >
            <div className="text-3xl mb-1">{cat.emoji}</div>
            <div className="text-sm text-white/70">{cat.label}</div>
            <div className="text-2xl font-bold text-white">{cat.count}</div>
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all",
            selectedCategory === "all"
              ? "bg-purple-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          )}
        >
          All Dreams ({allItems.length})
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all hidden md:block",
              selectedCategory === cat.value
                ? "bg-purple-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            )}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Add New Item */}
      {isAdding ? (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Add New Dream</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Category</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value} className="bg-gray-900">
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="What's your dream?"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Description (optional)</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add more details..."
                rows={2}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {PRIORITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-gray-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Cost (optional)</label>
                <select
                  value={editCost || ""}
                  onChange={(e) => setEditCost(e.target.value as any || null)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="bg-gray-900">Not specified</option>
                  {COST_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-gray-900">
                      {opt.emoji} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!editTitle.trim() || createMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Add Dream
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditTitle("");
                  setEditDescription("");
                  setEditPriority("medium");
                  setEditCost(null);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full mb-6 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border-2 border-dashed border-purple-400/50 rounded-lg text-purple-200 font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Dream
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
                  <div key={item.id} className="glass-card rounded-xl p-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={updateMutation.isPending}
                        className="flex-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className={cn(
                    "glass-card rounded-xl p-4 border-2",
                    category?.borderColor || "border-white/20"
                  )}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <button
                      onClick={() => toggleMutation.mutate(item.id)}
                      disabled={toggleMutation.isPending}
                      className="mt-0.5 w-6 h-6 rounded border-2 border-white/40 hover:border-purple-400 transition-colors flex items-center justify-center text-white/0 hover:text-white"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{category?.emoji}</span>
                        <span className="text-xs text-white/60">{category?.label}</span>
                      </div>
                      <h3 className="text-white font-semibold">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-white/70 mt-1">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn("text-xs", PRIORITY_OPTIONS.find(p => p.value === item.priority)?.color)}>
                          {item.priority}
                        </span>
                        {item.cost && (
                          <span className="text-xs text-white/60">
                            {COST_OPTIONS.find(c => c.value === item.cost)?.emoji}
                          </span>
                        )}
                      </div>
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
