import { motion } from "framer-motion";

interface BoltLadderProps {
  completed: number;
  target: number;
  color?: string;
}

export function BoltLadder({ completed, target, color = "#fb923c" }: BoltLadderProps) {
  const bolts = Array.from({ length: target }, (_, i) => i);

  return (
    <div className="relative flex items-center w-full my-3">
      {/* Rope line */}
      <div className="absolute left-0 right-0 h-[2px] bg-white/15 top-1/2 -translate-y-1/2" />

      {/* Bolts */}
      <div className="relative flex justify-between w-full">
        {bolts.map((i) => {
          const isDone = i < completed;
          const isNext = i === completed;
          const isFuture = i > completed;

          return (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
              className={`
                relative flex items-center justify-center w-5 h-5 rounded-full border-2
                backdrop-blur-sm transition-all duration-300
                ${isDone ? "bg-opacity-100 shadow-lg" : "bg-slate-900/40"}
                ${isNext ? "animate-bolt-flash" : ""}
                ${isFuture ? "border-white/20 opacity-50" : ""}
              `}
              style={{
                backgroundColor: isDone ? color : undefined,
                borderColor: isDone || isNext ? color : "rgba(255, 255, 255, 0.2)",
                boxShadow: isDone ? `0 0 12px ${color}` : undefined,
              }}
            >
              {/* Bolt hole */}
              <div className="w-2 h-2 rounded-full bg-white/80" />
            </motion.div>
          );
        })}
      </div>

      {/* Summit flag when all bolts are completed */}
      {completed === target && target > 0 && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
          className="absolute -right-6 top-1/2 -translate-y-1/2"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
        </motion.div>
      )}
    </div>
  );
}
