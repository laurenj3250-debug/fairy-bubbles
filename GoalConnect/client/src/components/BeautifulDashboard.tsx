import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Plus, Mountain, Target, Calendar } from "lucide-react";
import { ClimbingHoldSVG } from "./ClimbingHoldSVG";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Mountain-themed colors
const habitColors = [
  { bg: "linear-gradient(135deg, #475569 0%, #334155 100%)", name: "Stone Peak", border: "#64748b" },
  { bg: "linear-gradient(135deg, #64748b 0%, #475569 100%)", name: "Granite Ridge", border: "#94a3b8" },
  { bg: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", name: "Forest Base", border: "#14b8a6" },
  { bg: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)", name: "Glacier Ice", border: "#3b82f6" },
  { bg: "linear-gradient(135deg, #0e7490 0%, #155e75 100%)", name: "Deep Ice", border: "#06b6d4" },
  { bg: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)", name: "Sky Ridge", border: "#3b82f6" },
  { bg: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", name: "Snowmelt Stream", border: "#22d3ee" },
  { bg: "linear-gradient(135deg, #78716c 0%, #57534e 100%)", name: "Rocky Cliff", border: "#a8a29e" },
];

const getHabitColor = (id: number) => habitColors[id % habitColors.length];

interface Habit {
  id: number;
  title: string;
  description?: string;
  icon?: string;
  category?: string;
}

interface HabitLog {
  id: number;
  habitId: number;
  completed: boolean;
}

interface Goal {
  id: number;
  title: string;
  currentValue: number;
  targetValue: number;
  deadline: string;
}

interface Todo {
  id: number;
  title: string;
  dueDate: string | null;
  completed: boolean;
  difficulty: "easy" | "medium" | "hard";
}

export function BeautifulDashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ["/api/habits"] });
  const { data: habitLogs = [] } = useQuery<HabitLog[]>({ queryKey: [`/api/habit-logs/${today}`] });
  const { data: goals = [] } = useQuery<Goal[]>({ queryKey: ["/api/goals"] });
  const { data: todos = [] } = useQuery<Todo[]>({ queryKey: ["/api/todos"] });

  const toggleHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", { habitId, date: today });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/habit-logs/${today}`] });
    },
  });

  const isCompleted = (habitId: number) => {
    return habitLogs.find(l => l.habitId === habitId)?.completed || false;
  };

  const habitsWithStatus = habits.map(h => ({ ...h, completed: isCompleted(h.id) }));
  const completedHabits = habitsWithStatus.filter(h => h.completed).length;
  const activeGoals = goals.filter(g => g.currentValue < g.targetValue);
  const todaysTodos = todos.filter(t => !t.completed && (t.dueDate === today || !t.dueDate)).slice(0, 3);

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{format(new Date(), 'EEEE, MMMM d')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {completedHabits}/{habits.length} holds sent today
            </p>
          </div>
          <a
            href="/habits"
            className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition text-sm font-medium"
          >
            Manage Holds
          </a>
        </div>

        {/* Climbing Wall - Main Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Mountain className="w-5 h-5 text-primary" />
            Today's Climbing Wall
          </h2>

          {habits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No holds on your wall yet</p>
              <a
                href="/habits"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition"
              >
                <Plus className="w-4 h-4" />
                Add Your First Hold
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {habitsWithStatus.map((habit, index) => {
                const color = getHabitColor(habit.id);
                const completed = habit.completed;

                return (
                  <motion.button
                    key={habit.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => toggleHabitMutation.mutate(habit.id)}
                    className="relative flex flex-col items-center gap-2 group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Climbing Hold */}
                    <div className="relative w-20 h-20">
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={completed ? {
                          filter: `brightness(1.2) saturate(1.5) drop-shadow(0 2px 8px ${color.border})`
                        } : {
                          filter: "brightness(0.7) saturate(0.6) grayscale(0.3)"
                        }}
                      >
                        <ClimbingHoldSVG
                          variant={index % 3}
                          size={80}
                          gradient={color.bg}
                          borderColor={color.border}
                        />
                      </motion.div>

                      {/* Chalk mark when completed */}
                      {completed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm" />
                        </motion.div>
                      )}

                      {/* Check mark */}
                      {completed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </div>

                    {/* Habit name */}
                    <span className={`text-sm font-medium text-center max-w-[90px] line-clamp-2 ${completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {habit.title}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Routes (Goals) */}
        {activeGoals.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Active Routes ({activeGoals.length})
              </h2>
              <a
                href="/goals"
                className="text-sm text-primary hover:underline"
              >
                View All
              </a>
            </div>

            <div className="space-y-3">
              {activeGoals.slice(0, 3).map(goal => {
                const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
                const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                return (
                  <div key={goal.id} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">{goal.title}</h3>
                      <span className="text-sm text-primary font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Pitches */}
        {todaysTodos.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Today's Pitches ({todaysTodos.length})
              </h2>
              <a
                href="/todos"
                className="text-sm text-primary hover:underline"
              >
                View All
              </a>
            </div>

            <div className="space-y-2">
              {todaysTodos.map(todo => (
                <div key={todo.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition">
                  <div className="w-5 h-5 rounded-full border-2 border-card-border flex-shrink-0" />
                  <span className="text-sm text-foreground">{todo.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {todo.difficulty === 'easy' ? '5.6' : todo.difficulty === 'medium' ? '5.9' : '5.12'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
