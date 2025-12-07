import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface Habit {
  id: number;
  title: string;
}

interface HabitLog {
  id: number;
  habitId: number;
  completed: boolean;
}

export function GlowingOrbHabits() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: allHabits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: habitLogs = [] } = useQuery<HabitLog[]>({
    queryKey: [`/api/habit-logs/${today}`],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ habitId }: { habitId: number }) => {
      const response = await fetch(`/api/habit-logs/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: today }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to toggle habit");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/habit-logs/${today}`] });
      queryClient.invalidateQueries({ predicate: (query) =>
        typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/api/habit-logs')
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
    },
  });

  const isCompleted = (habitId: number) => {
    return habitLogs.some(l => l.habitId === habitId && l.completed);
  };

  // Get first 2-3 letters of habit title to fit in circles
  const getShortName = (title: string) => {
    // Use first 3 chars, uppercase for readability
    return title.substring(0, 3).toUpperCase();
  };

  return (
    <div className="flex gap-2">
      {allHabits.slice(0, 5).map((habit, index) => {
        const completed = isCompleted(habit.id);

        return (
          <motion.button
            key={habit.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => toggleMutation.mutate({ habitId: habit.id })}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[0.5rem] font-medium uppercase tracking-wide transition-all cursor-pointer"
            style={{
              background: completed
                ? "linear-gradient(135deg, #d4a59a 0%, #e8c4bc 100%)"
                : "rgba(61, 90, 80, 0.3)",
              border: completed ? "none" : "1px solid #3d5a50",
              color: completed ? "#080c08" : "#3d5a50",
              boxShadow: completed ? "0 0 20px rgba(212, 165, 154, 0.4)" : "none",
            }}
          >
            {getShortName(habit.title)}
          </motion.button>
        );
      })}
    </div>
  );
}
