import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Plus, X, TrendingUp, BarChart3, Check, ChevronDown } from 'lucide-react';
import type { ResidencyEntry, ResidencyActivity, ResidencyConfounder } from '@shared/schema';

const MOOD_EMOJIS = [
  { value: 1, emoji: '😞', label: 'Awful' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
] as const;

interface Analytics {
  totalEntries: number;
  overallMoodAvg: number | null;
  overallQuitRate: number | null;
  baselineMood: number | null;
  activityStats: Array<{
    activity: string;
    count: number;
    avgRating: number | null;
    avgMood: number;
    quitRate: number;
  }>;
  confounderStats: Array<{
    confounder: string;
    count: number;
    avgMood: number;
    moodImpact: number;
    quitRate: number;
  }>;
  trends: {
    last7Days: { avgMood: number; quitRate: number; count: number } | null;
    last30Days: { avgMood: number; quitRate: number; count: number } | null;
  };
}

export default function ResidencyTracker() {
  const [view, setView] = useState<'log' | 'analytics' | 'history'>('log');

  // Initialize defaults on mount
  const initMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/residency/initialize', 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residency'] });
    },
  });

  useEffect(() => {
    initMutation.mutate();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header with view toggle */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">Check-in</h1>
          <div className="flex gap-1 bg-slate-800/80 rounded-xl p-1">
            <button
              onClick={() => setView('log')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                view === 'log'
                  ? "bg-slate-700 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Log
            </button>
            <button
              onClick={() => setView('analytics')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                view === 'analytics'
                  ? "bg-slate-700 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('history')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                view === 'history'
                  ? "bg-slate-700 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              History
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {view === 'log' && <LogView key="log" />}
          {view === 'analytics' && <AnalyticsView key="analytics" />}
          {view === 'history' && <HistoryView key="history" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LogView() {
  const [mood, setMood] = useState<number | null>(null);
  const [decision, setDecision] = useState<'quit' | 'stay' | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [activityRating, setActivityRating] = useState<number | null>(null);
  const [showConfounderSheet, setShowConfounderSheet] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const { toast } = useToast();

  // Fetch data
  const { data: activities = [] } = useQuery<ResidencyActivity[]>({
    queryKey: ['/api/residency/activities'],
  });

  const { data: confounders = [] } = useQuery<ResidencyConfounder[]>({
    queryKey: ['/api/residency/confounders'],
  });

  const { data: confounderState } = useQuery<{ activeConfounders: string[] }>({
    queryKey: ['/api/residency/confounder-state'],
  });

  const [activeConfounders, setActiveConfounders] = useState<string[]>([]);

  // Sync active confounders from server state
  useEffect(() => {
    if (confounderState?.activeConfounders) {
      setActiveConfounders(confounderState.activeConfounders);
    }
  }, [confounderState]);

  // Mutations
  const createEntryMutation = useMutation({
    mutationFn: async (data: {
      mood: number;
      decision: string;
      activity?: string;
      activityRating?: number;
      confounders: string[];
    }) => {
      return await apiRequest('/api/residency/entries', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residency/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/residency/analytics'] });

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Reset form
        setMood(null);
        setDecision(null);
        setSelectedActivity(null);
        setActivityRating(null);
      }, 1200);
    },
    onError: () => {
      toast({ title: 'Failed to log', variant: 'destructive' });
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest('/api/residency/activities', 'POST', { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residency/activities'] });
      setNewActivity('');
      setShowAddActivity(false);
    },
  });

  const updateConfounderStateMutation = useMutation({
    mutationFn: async (confounders: string[]) => {
      return await apiRequest('/api/residency/confounder-state', 'PUT', { activeConfounders: confounders });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residency/confounder-state'] });
    },
  });

  const toggleConfounder = (name: string) => {
    const newActive = activeConfounders.includes(name)
      ? activeConfounders.filter(c => c !== name)
      : [...activeConfounders, name];
    setActiveConfounders(newActive);
    updateConfounderStateMutation.mutate(newActive);
  };

  const handleSubmit = () => {
    if (mood === null || !decision) return;

    createEntryMutation.mutate({
      mood,
      decision,
      activity: selectedActivity || undefined,
      activityRating: activityRating || undefined,
      confounders: activeConfounders,
    });
  };

  const canSubmit = mood !== null && decision !== null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6 pb-28"
      >
        {/* Mood Selection - Large touch targets */}
        <section className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
          <h2 className="text-center text-slate-300 font-medium mb-5">How are you feeling?</h2>
          <div className="flex justify-between gap-2">
            {MOOD_EMOJIS.map(m => (
              <motion.button
                key={m.value}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMood(m.value)}
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-200",
                  mood === m.value
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-800 scale-110"
                    : "bg-slate-700/50 hover:bg-slate-700 active:scale-95"
                )}
              >
                {m.emoji}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Decision - Quit/Stay */}
        <section className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setDecision('quit')}
            className={cn(
              "w-full h-14 rounded-2xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3",
              decision === 'quit'
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-400"
                : "bg-slate-800/80 text-slate-400 border border-slate-700 hover:border-red-500/50 hover:text-red-400"
            )}
          >
            <span>QUIT</span>
            <span className="text-xl">🚪</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setDecision('stay')}
            className={cn(
              "w-full h-14 rounded-2xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3",
              decision === 'stay'
                ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400"
                : "bg-slate-800/80 text-slate-400 border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-400"
            )}
          >
            <span>STAY</span>
            <span className="text-xl">💪</span>
          </motion.button>
        </section>

        {/* Activity Selection - Horizontal scroll pills */}
        <section className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-slate-300 font-medium">Activity (optional)</h2>
            <button
              onClick={() => setShowAddActivity(!showAddActivity)}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence>
            {showAddActivity && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newActivity.trim() && addActivityMutation.mutate(newActivity.trim())}
                    placeholder="New activity..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 text-sm border border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500"
                    autoFocus
                  />
                  <button
                    onClick={() => newActivity.trim() && addActivityMutation.mutate(newActivity.trim())}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {activities.map(a => (
              <motion.button
                key={a.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (selectedActivity === a.name) {
                    setSelectedActivity(null);
                    setActivityRating(null);
                  } else {
                    setSelectedActivity(a.name);
                  }
                }}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                  selectedActivity === a.name
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                )}
              >
                {a.name}
              </motion.button>
            ))}
          </div>

          {/* Activity Rating (only if activity selected) */}
          <AnimatePresence>
            {selectedActivity && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 pt-5 border-t border-slate-700/50"
              >
                <p className="text-slate-400 text-sm mb-3">Rate {selectedActivity}:</p>
                <div className="flex justify-between gap-2">
                  {MOOD_EMOJIS.map(m => (
                    <motion.button
                      key={m.value}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setActivityRating(m.value)}
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all",
                        activityRating === m.value
                          ? "bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/30 ring-2 ring-violet-400"
                          : "bg-slate-700/30 hover:bg-slate-700"
                      )}
                    >
                      {m.emoji}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Today's Factors - Sticky badges */}
        <section>
          <button
            onClick={() => setShowConfounderSheet(true)}
            className="w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-300 font-medium">Today's factors</h2>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              {activeConfounders.length > 0 ? (
                activeConfounders.map(c => (
                  <span
                    key={c}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-sm">Tap to set factors for today</span>
              )}
            </div>
          </button>
        </section>
      </motion.div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!canSubmit || createEntryMutation.isPending}
            className={cn(
              "w-full h-14 rounded-2xl font-bold text-lg transition-all duration-200",
              canSubmit
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            )}
          >
            {createEntryMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Logging...
              </span>
            ) : (
              'LOG ENTRY'
            )}
          </motion.button>
        </div>
      </div>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/50"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Check className="w-12 h-12 text-white stroke-[3]" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet for Confounders */}
      <BottomSheet
        isOpen={showConfounderSheet}
        onClose={() => setShowConfounderSheet(false)}
        confounders={confounders}
        activeConfounders={activeConfounders}
        onToggle={toggleConfounder}
      />
    </>
  );
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  confounders: ResidencyConfounder[];
  activeConfounders: string[];
  onToggle: (name: string) => void;
}

function BottomSheet({ isOpen, onClose, confounders, activeConfounders, onToggle }: BottomSheetProps) {
  const [newConfounder, setNewConfounder] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);

  const addConfounderMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest('/api/residency/confounders', 'POST', { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residency/confounders'] });
      setNewConfounder('');
    },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-800 rounded-t-3xl max-h-[80vh] overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-slate-600" />
            </div>

            <div className="px-5 pb-8 overflow-y-auto max-h-[calc(80vh-60px)]">
              <h2 className="text-lg font-bold mb-5">Today's Factors</h2>

              <div className="space-y-2">
                {confounders.map(c => (
                  <motion.button
                    key={c.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onToggle(c.name)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl transition-all",
                      activeConfounders.includes(c.name)
                        ? "bg-amber-500/20 border border-amber-500/30"
                        : "bg-slate-700/50 border border-transparent hover:border-slate-600"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                      activeConfounders.includes(c.name)
                        ? "bg-amber-500 text-white"
                        : "bg-slate-600"
                    )}>
                      {activeConfounders.includes(c.name) && <Check className="w-4 h-4" />}
                    </div>
                    <span className={cn(
                      "font-medium",
                      activeConfounders.includes(c.name) ? "text-amber-200" : "text-slate-300"
                    )}>
                      {c.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Add new confounder */}
              <div className="mt-5 flex gap-2">
                <input
                  type="text"
                  value={newConfounder}
                  onChange={(e) => setNewConfounder(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && newConfounder.trim() && addConfounderMutation.mutate(newConfounder.trim())}
                  placeholder="Add new factor..."
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 text-sm border border-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder:text-slate-500"
                />
                <button
                  onClick={() => newConfounder.trim() && addConfounderMutation.mutate(newConfounder.trim())}
                  disabled={!newConfounder.trim()}
                  className="px-4 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Done button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full mt-6 h-12 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-colors"
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function AnalyticsView() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['/api/residency/analytics'],
  });

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full"
        />
      </motion.div>
    );
  }

  if (!analytics || analytics.totalEntries === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700/50"
      >
        <TrendingUp className="w-16 h-16 mx-auto text-slate-600 mb-4" />
        <p className="text-slate-400 text-lg">No data yet</p>
        <p className="text-slate-500 text-sm mt-1">Start logging to see insights!</p>
      </motion.div>
    );
  }

  const getMoodEmoji = (value: number) => {
    const m = MOOD_EMOJIS.find(e => e.value === Math.round(value));
    return m?.emoji || '😐';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 pb-8"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 text-center border border-slate-700/50">
          <p className="text-3xl mb-1">{getMoodEmoji(analytics.overallMoodAvg || 3)}</p>
          <p className="text-xs text-slate-500">Avg Mood</p>
          <p className="text-lg font-bold text-slate-200">{analytics.overallMoodAvg?.toFixed(1)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 text-center border border-slate-700/50">
          <p className="text-3xl mb-1">{analytics.overallQuitRate! > 50 ? '🚪' : '💪'}</p>
          <p className="text-xs text-slate-500">Quit Rate</p>
          <p className={cn(
            "text-lg font-bold",
            analytics.overallQuitRate! > 50 ? "text-red-400" : "text-emerald-400"
          )}>
            {analytics.overallQuitRate?.toFixed(0)}%
          </p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 text-center border border-slate-700/50">
          <p className="text-3xl mb-1">📊</p>
          <p className="text-xs text-slate-500">Entries</p>
          <p className="text-lg font-bold text-slate-200">{analytics.totalEntries}</p>
        </div>
      </div>

      {/* Trends */}
      {(analytics.trends.last7Days || analytics.trends.last30Days) && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
          <h2 className="font-semibold text-slate-200 mb-4">Trends</h2>
          <div className="space-y-3">
            {analytics.trends.last7Days && (
              <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                <span className="text-slate-400">Last 7 days</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-200">{getMoodEmoji(analytics.trends.last7Days.avgMood)} {analytics.trends.last7Days.avgMood.toFixed(1)}</span>
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium",
                    analytics.trends.last7Days.quitRate > 50
                      ? "bg-red-500/20 text-red-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  )}>
                    {analytics.trends.last7Days.quitRate.toFixed(0)}% quit
                  </span>
                </div>
              </div>
            )}
            {analytics.trends.last30Days && (
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-400">Last 30 days</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-200">{getMoodEmoji(analytics.trends.last30Days.avgMood)} {analytics.trends.last30Days.avgMood.toFixed(1)}</span>
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium",
                    analytics.trends.last30Days.quitRate > 50
                      ? "bg-red-500/20 text-red-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  )}>
                    {analytics.trends.last30Days.quitRate.toFixed(0)}% quit
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Stats */}
      {analytics.activityStats.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
          <h2 className="font-semibold text-slate-200 mb-4">Activities</h2>
          <div className="space-y-3">
            {analytics.activityStats.map(stat => (
              <div key={stat.activity} className="flex justify-between items-center py-3 border-b border-slate-700/50 last:border-0">
                <div>
                  <p className="font-medium text-slate-200">{stat.activity}</p>
                  <p className="text-xs text-slate-500">{stat.count} entries</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-200">
                    {stat.avgRating !== null
                      ? `${getMoodEmoji(stat.avgRating)} ${stat.avgRating.toFixed(1)}`
                      : `${getMoodEmoji(stat.avgMood)} ${stat.avgMood.toFixed(1)}`}
                  </p>
                  <p className={cn(
                    "text-xs font-medium",
                    stat.quitRate > 50 ? "text-red-400" : "text-emerald-400"
                  )}>
                    {stat.quitRate.toFixed(0)}% quit
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confounder Stats */}
      {analytics.confounderStats.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
          <h2 className="font-semibold text-slate-200 mb-2">Confounder Impact</h2>
          <p className="text-xs text-slate-500 mb-4">
            Baseline mood (no factors): {analytics.baselineMood?.toFixed(1) || 'N/A'}
          </p>
          <div className="space-y-3">
            {analytics.confounderStats.map(stat => (
              <div key={stat.confounder} className="flex justify-between items-center py-3 border-b border-slate-700/50 last:border-0">
                <div>
                  <p className="font-medium text-slate-200">{stat.confounder}</p>
                  <p className="text-xs text-slate-500">{stat.count} entries</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-bold",
                    stat.moodImpact < -0.5 ? "text-red-400" : stat.moodImpact > 0.5 ? "text-emerald-400" : "text-slate-400"
                  )}>
                    {stat.moodImpact > 0 ? '+' : ''}{stat.moodImpact.toFixed(1)} mood
                  </p>
                  <p className={cn(
                    "text-xs font-medium",
                    stat.quitRate > 50 ? "text-red-400" : "text-emerald-400"
                  )}>
                    {stat.quitRate.toFixed(0)}% quit
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function HistoryView() {
  const { data: entries = [], isLoading } = useQuery<ResidencyEntry[]>({
    queryKey: ['/api/residency/entries'],
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/residency/entries/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residency/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/residency/analytics'] });
    },
  });

  const getMoodEmoji = (value: number) => {
    const m = MOOD_EMOJIS.find(e => e.value === value);
    return m?.emoji || '😐';
  };

  const formatDate = (timestamp: string) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full"
        />
      </motion.div>
    );
  }

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700/50"
      >
        <p className="text-slate-400">No entries yet. Start logging!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3 pb-8"
    >
      {entries.map(entry => (
        <motion.div
          key={entry.id}
          layout
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getMoodEmoji(entry.mood)}</span>
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-semibold",
                entry.decision === 'quit'
                  ? "bg-red-500/20 text-red-400"
                  : "bg-emerald-500/20 text-emerald-400"
              )}>
                {entry.decision}
              </span>
            </div>
            <button
              onClick={() => deleteEntryMutation.mutate(entry.id)}
              className="text-slate-500 hover:text-red-400 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {entry.activity && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-slate-300">{entry.activity}</span>
              {entry.activityRating && (
                <span className="text-lg">{getMoodEmoji(entry.activityRating)}</span>
              )}
            </div>
          )}

          {(entry.confounders as string[]).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(entry.confounders as string[]).map(c => (
                <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300">
                  {c}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500">{formatDate(entry.timestamp as unknown as string)}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
