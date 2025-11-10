import { TopStatusBar } from "@/components/TopStatusBar";
import { RidgeTraverseWeekCompact } from "@/components/RidgeTraverseWeekCompact";
import { TodaysPitch } from "@/components/TodaysPitch";
import { RoutesPanel } from "@/components/RoutesPanel";
import { useState } from "react";

export default function WeeklyHub() {
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const handleDayClick = (date: string) => {
    setActiveDay(date);
    // Could expand this to show that day's details
    console.log("Selected day:", date);
  };

  return (
    <div className="min-h-screen enchanted-bg pb-20 md:pb-0">
      {/* Mountain canvas background */}
      <div
        id="magicCanvas"
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      />

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
        {/* Top Status Bar */}
        <TopStatusBar />

        {/* Ridge Traverse Week */}
        <RidgeTraverseWeekCompact onDayClick={handleDayClick} />

        {/* Main Content: Today's Pitch + Routes Panel */}
        <div className="mt-4 flex flex-col lg:flex-row gap-4">
          {/* Today's Pitch - Main hero component (65% width on desktop) */}
          <div className="flex-1 lg:w-[65%]">
            <TodaysPitch />
          </div>

          {/* Routes Panel - Sidebar (30% width on desktop, 5% gap) */}
          <div className="lg:w-[30%]">
            <RoutesPanel />
          </div>
        </div>
      </div>

      {/* Add floating particles/snow effect */}
      <style>{`
        @keyframes float-snow {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(20px);
            opacity: 0;
          }
        }

        .float-snow {
          animation: float-snow 8s linear infinite;
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .shimmer-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          background-size: 1000px 100%;
          animation: shimmer 8s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        .alpine-glow {
          animation: alpine-glow 4s ease-in-out infinite;
        }

        @keyframes alpine-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(94, 234, 212, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(94, 234, 212, 0.2);
          }
        }

        .pulse-animation {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 10px rgba(94, 234, 212, 0.5);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(94, 234, 212, 0.8);
          }
        }

        .float-animation {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes pulse-glow-alt {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .pulse-glow {
          animation: pulse-glow-alt 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
