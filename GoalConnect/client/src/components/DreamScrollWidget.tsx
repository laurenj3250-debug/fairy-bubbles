import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sparkles, Plus, Check, ChevronDown } from "lucide-react";
import type { DreamScrollItem } from "@shared/schema";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "do", label: "To Do", emoji: "✨", color: "from-cyan-500 to-teal-500" },
  { value: "buy", label: "To Buy", emoji: "🛍️", color: "from-blue-500 to-cyan-500" },
  { value: "see", label: "To See", emoji: "👀", color: "from-green-500 to-emerald-500" },
  { value: "visit", label: "To Visit", emoji: "🗺️", color: "from-cyan-500 to-teal-500" },
  { value: "learn", label: "To Learn", emoji: "📚", color: "from-indigo-500 to-cyan-500" },
  { value: "experience", label: "To Experience", emoji: "🎭", color: "from-teal-500 to-teal-500" },
] as const;

export function DreamScrollWidget() {
  const [selectedCategory, setSelectedCategory] = useState<string>("do");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const selectedCat = CATEGORIES.find(c => c.value === selectedCategory) || CATEGORIES[0];

  // Fetch items for selected category
  const { data: items = [], isLoading } = useQuery<DreamScrollItem[]>({
    queryKey: ["/api/dream-scroll/category", selectedCategory],
    queryFn: () => apiRequest(`/api/dream-scroll/category/${selectedCategory}`),
  });

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      return apiRequest("/api/dream-scroll", "POST", {
        title,
        category: selectedCategory,
        priority: "medium",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dream-scroll"] });
      setNewItemTitle("");
      setIsAdding(false);
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

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemTitle.trim()) {
      createMutation.mutate(newItemTitle.trim());
    }
  };

  const activeItems = items.filter(item => !item.completed);
  const completedItems = items.filter(item => item.completed);

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden z-10">
      {/* Magical gradient header */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
          selectedCat.color
        )}
      />

      {/* Header with category selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-300" />
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Comfortaa', cursive" }}>
            Dream Scroll
          </h3>
        </div>

        {/* Category selector */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white text-sm font-medium border border-white/20"
          >
            <span>{selectedCat.emoji}</span>
            <span>{selectedCat.label}</span>
            <ChevronDown className={cn(
              "w-3.5 h-3.5 transition-transform",
              showCategoryMenu && "rotate-180"
            )} />
          </button>

          {showCategoryMenu && (
            <div className="absolute right-0 top-full mt-2 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg overflow-hidden z-50 min-w-[160px]">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setSelectedCategory(cat.value);
                    setShowCategoryMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    cat.value === selectedCategory
                      ? "bg-cyan-500/20 text-cyan-200"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add new item */}
      {isAdding ? (
        <form onSubmit={handleAddItem} className="mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="What's your dream?"
              autoFocus
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={!newItemTitle.trim() || createMutation.isPending}
              className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewItemTitle("");
              }}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full mb-3 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border-2 border-dashed border-cyan-400/50 rounded-lg text-cyan-200 text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Dream
        </button>
      )}

      {/* Items list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-white/60 text-sm py-4">Loading...</div>
        ) : activeItems.length === 0 && completedItems.length === 0 ? (
          <div className="text-center text-white/60 text-sm py-6">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-white/40" />
            <p>No dreams yet!</p>
            <p className="text-xs mt-1">Add your first dream to get started</p>
          </div>
        ) : (
          <>
            {activeItems.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
              >
                <button
                  onClick={() => toggleMutation.mutate(item.id)}
                  disabled={toggleMutation.isPending}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-white/40 hover:border-cyan-400 transition-colors flex items-center justify-center text-white/0 hover:text-white group-hover:border-cyan-400"
                >
                  <Check className="w-3 h-3" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-white/60 truncate">{item.description}</div>
                  )}
                </div>
              </div>
            ))}

            {completedItems.length > 0 && (
              <>
                <div className="text-xs text-white/50 font-medium mt-3 mb-1">Completed</div>
                {completedItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 p-2 bg-white/5 rounded-lg opacity-60"
                  >
                    <button
                      onClick={() => toggleMutation.mutate(item.id)}
                      disabled={toggleMutation.isPending}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-green-400 bg-green-500/30 transition-colors flex items-center justify-center text-green-200"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/70 font-medium line-through truncate">
                        {item.title}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <a
          href="/dream-scroll"
          className="text-xs text-cyan-300 hover:text-cyan-200 transition-colors flex items-center gap-1 justify-center"
        >
          View All Dreams
          <span>→</span>
        </a>
      </div>
    </div>
  );
}
