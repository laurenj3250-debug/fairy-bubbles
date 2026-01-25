import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

// Use the same enriched habit type that IcyDash uses
interface HabitWithData {
  id: number;
  title: string;
  requiresNote?: boolean;
  history: Array<{ date: string; completed: boolean }>;
}

interface GlowingOrbHabitsProps {
  onToggle?: (habitId: number) => void;
}

export function GlowingOrbHabits({ onToggle }: GlowingOrbHabitsProps) {
  const today = new Date().toISOString().split('T')[0];

  // Use the SAME query key as IcyDash - this way data stays in sync
  const { data: habits = [] } = useQuery<HabitWithData[]>({
    queryKey: ['/api/habits-with-data'],
  });

  // Check completion from the shared enriched data
  const isCompleted = (habit: HabitWithData) => {
    return habit.history?.some(h => h.date === today && h.completed) ?? false;
  };

  const getShortName = (title: string) => {
    return title.substring(0, 3).toUpperCase();
  };

  return (
    <div className="flex gap-2">
      {habits.slice(0, 5).map((habit, index) => {
        const completed = isCompleted(habit);

        return (
          <motion.button
            key={habit.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onToggle?.(habit.id)}
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
