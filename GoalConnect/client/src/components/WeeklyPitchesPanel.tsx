import { useQuery, useMutation } from "@tanstack/react-query";
import { celebrateXpEarned } from "@/lib/celebrate";
import { XP_CONFIG } from "@shared/xp-config";
import type { Todo } from "@shared/schema";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";

const gradeLabels = {
  easy: "5.6",
  medium: "5.9",
  hard: "5.12"
};

export function WeeklyPitchesPanel() {
  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday

  // Generate 7 days starting from Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const toggleTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/todos/${id}/complete`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      celebrateXpEarned(XP_CONFIG.todo, "Task completed");
    },
  });

  // Group todos by day
  const todosByDay = useMemo(() => {
    const grouped = new Map<string, Todo[]>();

    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped.set(dayKey, []);
    });

    todos.forEach(todo => {
      if (todo.completed) return;

      if (todo.dueDate) {
        const dueDate = parseISO(todo.dueDate);
        const dayKey = format(dueDate, 'yyyy-MM-dd');

        // Only show if it's within this week
        const weekDayKeys = weekDays.map(d => format(d, 'yyyy-MM-dd'));
        if (weekDayKeys.includes(dayKey)) {
          const existing = grouped.get(dayKey) || [];
          grouped.set(dayKey, [...existing, todo]);
        }
      }
    });

    return grouped;
  }, [todos, weekDays]);

  const handleToggle = (todoId: number) => {
    toggleTodoMutation.mutate(todoId);
  };

  const getTotalPitches = () => {
    let total = 0;
    todosByDay.forEach(pitches => {
      total += pitches.length;
    });
    return total;
  };

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-6 relative overflow-hidden">
      {/* Soft gradient overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at bottom left, hsl(var(--secondary) / 0.3), transparent 70%)`
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-2xl font-bold flex items-center gap-2"
            style={{
              background: `linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            📅 This Week's Pitches
          </h2>
          <p className="text-xs text-foreground/50 mt-1">
            {getTotalPitches()} pitch{getTotalPitches() !== 1 ? 'es' : ''} scheduled
          </p>
        </div>
        <a
          href="/todos"
          className="px-4 py-2 rounded-xl text-white transition-all text-sm font-bold shadow-lg hover:scale-105 hover:shadow-xl"
          style={{
            background: `linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))`
          }}
        >
          View All
        </a>
      </div>

      {/* Week Calendar Grid */}
      <div className="relative z-10 grid grid-cols-7 gap-3">
        {weekDays.map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const pitches = todosByDay.get(dayKey) || [];
          const isToday = isSameDay(day, today);
          const isPast = day < today && !isToday;

          return (
            <motion.div
              key={dayKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-background/30 backdrop-blur-sm border border-foreground/10 rounded-2xl p-4 transition-all min-h-[160px] shadow-lg hover:shadow-xl relative overflow-hidden"
              style={{
                boxShadow: isToday ? '0 4px 20px hsl(var(--primary) / 0.2)' : undefined
              }}
            >
              {/* Soft overlay for today */}
              {isToday && (
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, hsl(var(--primary) / 0.4), transparent 70%)`
                  }}
                />
              )}

              {/* Day header */}
              <div className="text-center mb-3 relative z-10">
                <div
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: isToday ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.5)' }}
                >
                  {format(day, 'EEE')}
                </div>
                <div
                  className="text-2xl font-black"
                  style={{
                    color: isToday
                      ? 'hsl(var(--primary))'
                      : isPast
                      ? 'hsl(var(--foreground) / 0.3)'
                      : pitches.length > 0
                      ? 'hsl(var(--foreground))'
                      : 'hsl(var(--foreground) / 0.4)'
                  }}
                >
                  {format(day, 'd')}
                </div>
              </div>

              {/* Pitches for this day */}
              <div className="space-y-2">
                {pitches.length === 0 ? (
                  <div className="text-center py-2">
                    <div className="w-8 h-8 mx-auto rounded-full border-2 border-dashed border-foreground/20" />
                  </div>
                ) : (
                  pitches.slice(0, 3).map((todo) => {
                    const grade = todo.difficulty ? gradeLabels[todo.difficulty as keyof typeof gradeLabels] : "5.9";

                    return (
                      <motion.button
                        key={todo.id}
                        onClick={() => handleToggle(todo.id)}
                        className="w-full p-2.5 rounded-xl bg-background/30 backdrop-blur-sm hover:bg-background/40 border border-foreground/10 hover:border-foreground/20 transition-all text-left shadow-md hover:shadow-lg relative overflow-hidden"
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Subtle overlay */}
                        <div
                          className="absolute inset-0 opacity-5 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at center, hsl(var(--accent) / 0.3), transparent 70%)`
                          }}
                        />

                        <div className="flex items-center gap-2 relative z-10">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0 shadow-md"
                            style={{
                              background: todo.difficulty === 'hard'
                                ? `linear-gradient(135deg, hsl(var(--accent) / 0.8), hsl(var(--accent)))`
                                : todo.difficulty === 'medium'
                                ? `linear-gradient(135deg, hsl(var(--secondary) / 0.8), hsl(var(--secondary)))`
                                : `linear-gradient(135deg, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.8))`
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground line-clamp-1">
                              {todo.title}
                            </p>
                          </div>
                          <span
                            className="text-[10px] font-black px-1.5 py-0.5 rounded-md text-white flex-shrink-0"
                            style={{
                              background: todo.difficulty === 'hard'
                                ? `linear-gradient(135deg, hsl(var(--accent) / 0.8), hsl(var(--accent)))`
                                : todo.difficulty === 'medium'
                                ? `linear-gradient(135deg, hsl(var(--secondary) / 0.8), hsl(var(--secondary)))`
                                : `linear-gradient(135deg, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.8))`
                            }}
                          >
                            {grade}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })
                )}

                {/* Show "+X more" if there are more than 3 */}
                {pitches.length > 3 && (
                  <div className="text-center">
                    <a
                      href="/todos"
                      className="text-[10px] hover:underline transition-colors"
                      style={{ color: 'hsl(var(--primary))' }}
                    >
                      +{pitches.length - 3} more
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {getTotalPitches() === 0 && (
        <div className="relative z-10 text-center py-8 mt-4">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--foreground) / 0.3)' }} />
          <p className="text-foreground/50 text-sm mb-4">No pitches scheduled this week</p>
          <a
            href="/todos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl transition text-sm font-medium text-white shadow-lg hover:scale-105 hover:shadow-xl"
            style={{
              background: `linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))`
            }}
          >
            <Plus className="w-4 h-4" />
            Add Your First Pitch
          </a>
        </div>
      )}
    </div>
  );
}
