import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

interface UserPoints {
  available: number;
  total: number;
  spent: number;
}

interface FloatingNumber {
  id: number;
  amount: number;
}

export function TokenCounter() {
  const [, navigate] = useLocation();
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>();
  const previousBalance = useRef<number>(0);
  const floatingIdCounter = useRef(0);

  const { data: points } = useQuery<UserPoints>({
    queryKey: ["/api/points"],
    refetchInterval: 2000, // Refetch every 2 seconds to catch updates
  });

  const currentBalance = points?.available ?? 0;

  // Detect balance changes and trigger animations
  useEffect(() => {
    if (previousBalance.current !== 0 && currentBalance > previousBalance.current) {
      const diff = currentBalance - previousBalance.current;

      // Add floating number
      const newFloating: FloatingNumber = {
        id: floatingIdCounter.current++,
        amount: diff,
      };

      setFloatingNumbers((prev) => [...(prev || []), newFloating]);

      // Remove after animation completes
      setTimeout(() => {
        setFloatingNumbers((prev) => prev?.filter((f) => f.id !== newFloating.id));
      }, 1000);
    }

    previousBalance.current = currentBalance;
  }, [currentBalance]);

  // Check if near purchase threshold (within 50 tokens of gear cost)
  // For now we'll use 100 tokens as threshold example
  const nearThreshold = currentBalance >= 50 && currentBalance < 100;

  const handleClick = () => {
    navigate("/alpine-shop");
  };

  return (
    <motion.button
      onClick={handleClick}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Glow effect when near threshold */}
      {nearThreshold && (
        <motion.div
          className="absolute inset-0 rounded-full bg-amber-400/30"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Coin icon with bounce on change */}
      <motion.div
        key={`coin-${currentBalance}`}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.3 }}
      >
        <Coins className="w-5 h-5 text-amber-400" />
      </motion.div>

      {/* Animated counter */}
      <motion.span
        key={`count-${currentBalance}`}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.3 }}
        className="font-bold text-amber-400 text-sm relative z-10"
      >
        {currentBalance.toLocaleString()}
      </motion.span>

      {/* Floating +X numbers */}
      <AnimatePresence>
        {floatingNumbers?.map((floating) => (
          <motion.div
            key={floating.id}
            initial={{ y: 0, opacity: 1, x: 0 }}
            animate={{ y: -30, opacity: 0, x: 10 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm pointer-events-none whitespace-nowrap"
          >
            +{floating.amount}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.button>
  );
}
