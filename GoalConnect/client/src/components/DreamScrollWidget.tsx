import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sparkles, Plus, Check, ChevronDown, Mountain, CalendarPlus } from "lucide-react";
import type { DreamScrollItem } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "do", label: "Things to Do", emoji: "✅" },
  { value: "buy", label: "Things to Buy", emoji: "🛒" },
  { value: "see", label: "Things to See", emoji: "👀" },
  { value: "visit", label: "Places to Visit", emoji: "📍" },
  { value: "learn", label: "Things to Learn", emoji: "📚" },
  { value: "experience", label: "Experiences", emoji: "⭐" },
] as const;

export function DreamScrollWidget() {
  const [selectedCategory, setSelectedCategory] = useState<string>("do");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [calendarItemId, setCalendarItemId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { toast } = useToast();
  const selectedCat = CATEGORIES.find(c => c.value === selectedCategory) || CATEGORIES[0];

  // Fetch items for selected category
  const { data: items = [], isLoading } = useQuery<DreamScrollItem[]>({
    queryKey: ["/api/dream-scroll/category", selectedCategory],
    queryFn: () => apiRequest(`/api/dream-scroll/category/${selectedCategory}`, "GET"),
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
      queryClient.invalidateQueries({ queryKey: ["/api/dream-scroll/category", selectedCategory] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/dream-scroll/category", selectedCategory] });
    },
  });

  const createTodoMutation = useMutation({
    mutationFn: async ({ title, dueDate }: { title: string; dueDate: string }) => {
      return apiRequest("/api/todos", "POST", {
        title,
        dueDate,
        priority: 4,
      });
    },
    onSuccess: (_, { dueDate }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos-with-metadata"] });
      setCalendarItemId(null);
      setSelectedDate(undefined);
      toast({
        title: "Added to schedule",
        description: `Task scheduled for ${format(new Date(dueDate), 'MMM d')}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to schedule",
        description: error.message,
        variant: "destructive",
      });
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
    <div className="glass-card interactive-glow p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Summit Journal
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your dreams & aspirations
          </p>
        </div>

        {/* Category selector */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all text-foreground text-sm font-medium border border-border"
          >
            <span>{selectedCat.emoji}</span>
            <span className="hidden sm:inline">{selectedCat.label}</span>
            <ChevronDown className={cn(
              "w-3.5 h-3.5 transition-transform",
              showCategoryMenu && "rotate-180"
            )} />
          </button>

          {showCategoryMenu && (
            <div className="absolute right-0 top-full mt-2 bg-card border border-card-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[180px]">
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
                      ? "bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))]"
                      : "text-foreground hover:bg-muted/50"
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
      <div className="mb-4 relative z-10">
        {isAdding ? (
          <form onSubmit={handleAddItem} className="space-y-2">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="What's your dream?"
              autoFocus
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newItemTitle.trim() || createMutation.isPending}
                className="flex-1 px-3 py-2 bg-[hsl(var(--accent))]/20 hover:bg-[hsl(var(--accent))]/30 disabled:bg-muted/30 disabled:text-muted-foreground text-[hsl(var(--accent))] border border-[hsl(var(--accent))]/40 hover:border-[hsl(var(--accent))] rounded-lg text-sm font-medium transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewItemTitle("");
                }}
                className="px-3 py-2 bg-muted/30 hover:bg-muted/50 text-foreground border border-border rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full px-3 py-2 bg-muted/20 hover:bg-muted/30 border-2 border-dashed border-border hover:border-[hsl(var(--accent))]/40 rounded-lg text-muted-foreground hover:text-foreground text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        )}
      </div>

      {/* Items list */}
      <div className="space-y-2 flex-1 overflow-y-auto relative z-10">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-pulse space-y-2">
              <div className="h-12 bg-muted/20 rounded-lg"></div>
              <div className="h-12 bg-muted/20 rounded-lg"></div>
            </div>
          </div>
        ) : activeItems.length === 0 && completedItems.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              No entries yet!
              <br />
              Add your first summit goal above.
            </p>
          </div>
        ) : (
          <>
            {activeItems.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/10 hover:border-[hsl(var(--accent))]/40 transition-all duration-300"
              >
                <button
                  onClick={() => toggleMutation.mutate(item.id)}
                  disabled={toggleMutation.isPending}
                  className="mt-0.5 flex-shrink-0"
                >
                  <Check className={cn(
                    "w-5 h-5 transition-colors",
                    "text-muted-foreground hover:text-[hsl(var(--accent))]"
                  )} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground font-semibold line-clamp-2">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</div>
                  )}
                </div>

                {/* Pull to Calendar Button */}
                <Popover open={calendarItemId === item.id} onOpenChange={(open) => {
                  if (open) {
                    setCalendarItemId(item.id);
                    setSelectedDate(new Date());
                  } else {
                    setCalendarItemId(null);
                  }
                }}>
                  <PopoverTrigger asChild>
                    <button
                      className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-[hsl(var(--accent))] transition-colors"
                      title="Add to schedule"
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          createTodoMutation.mutate({
                            title: item.title,
                            dueDate: format(date, 'yyyy-MM-dd'),
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            ))}

            {completedItems.length > 0 && (
              <>
                <div className="text-xs text-muted-foreground font-medium mt-4 mb-2 px-1">Completed</div>
                {completedItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border/30 bg-muted/5 opacity-60"
                  >
                    <button
                      onClick={() => toggleMutation.mutate(item.id)}
                      disabled={toggleMutation.isPending}
                      className="mt-0.5 flex-shrink-0"
                    >
                      <Check className="w-5 h-5 text-[hsl(var(--accent))]" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-muted-foreground font-medium line-through line-clamp-2">
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
      {(activeItems.length > 0 || completedItems.length > 0) && (
        <div className="mt-4 pt-4 border-t border-card-border relative z-10">
          <Link href="/dream-scroll">
            <a className="text-sm text-[hsl(var(--accent))] hover:underline font-medium">
              View full journal →
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}
