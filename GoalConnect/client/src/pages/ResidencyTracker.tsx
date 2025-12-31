import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Plus, X, TrendingUp, BarChart3 } from 'lucide-react';
import type { ResidencyEntry, ResidencyActivity, ResidencyConfounder } from '@shared/schema';

const MOOD_EMOJIS = [
  { value: 1, emoji: '😞' },
  { value: 2, emoji: '😕' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😊' },
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
  const { toast } = useToast();

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
    <div className="min-h-screen bg-background text-foreground p-4 max-w-lg mx-auto pb-24">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Check-in</h1>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setView('log')}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-medium transition-colors",
              view === 'log' ? "bg-background shadow" : "text-muted-foreground"
            )}
          >
            Log
          </button>
          <button
            onClick={() => setView('analytics')}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-medium transition-colors",
              view === 'analytics' ? "bg-background shadow" : "text-muted-foreground"
            )}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('history')}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-medium transition-colors",
              view === 'history' ? "bg-background shadow" : "text-muted-foreground"
            )}
          >
            History
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'log' && <LogView key="log" />}
        {view === 'analytics' && <AnalyticsView key="analytics" />}
        {view === 'history' && <HistoryView key="history" />}
      </AnimatePresence>
    </div>
  );
}

function LogView() {
  const [mood, setMood] = useState<number | null>(null);
  const [decision, setDecision] = useState<'quit' | 'stay' | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [activityRating, setActivityRating] = useState<number | null>(null);
  const [newActivity, setNewActivity] = useState('');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newConfounder, setNewConfounder] = useState('');
  const [showAddConfounder, setShowAddConfounder] = useState(false);
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
      toast({ title: 'Logged!' });
      // Reset form
      setMood(null);
      setDecision(null);
      setSelectedActivity(null);
      setActivityRating(null);
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

  const addConfounderMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest('/api/residency/confounders', 'POST', { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residency/confounders'] });
      setNewConfounder('');
      setShowAddConfounder(false);
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5"
    >
      {/* Current date/time */}
      <p className="text-muted-foreground text-sm text-center">
        {new Date().toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>

      <div className="glass-card p-5 space-y-6">
        {/* Mood */}
        <div>
          <p className="text-sm font-medium mb-3">How are you feeling?</p>
          <div className="flex justify-between">
            {MOOD_EMOJIS.map(m => (
              <motion.button
                key={m.value}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMood(m.value)}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all",
                  mood === m.value
                    ? "bg-primary/20 ring-2 ring-primary"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {m.emoji}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Decision */}
        <div>
          <p className="text-sm font-medium mb-3">Right now, you want to...</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDecision('quit')}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium transition-all",
                decision === 'quit'
                  ? "bg-red-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Quit
            </button>
            <button
              onClick={() => setDecision('stay')}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium transition-all",
                decision === 'stay'
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Stay
            </button>
          </div>
        </div>

        {/* Activity */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium">Just did something?</p>
            <button
              onClick={() => setShowAddActivity(!showAddActivity)}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {showAddActivity && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newActivity.trim() && addActivityMutation.mutate(newActivity.trim())}
                placeholder="New activity..."
                className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm outline-none focus:ring-2 ring-primary/50"
                autoFocus
              />
              <button
                onClick={() => newActivity.trim() && addActivityMutation.mutate(newActivity.trim())}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                Add
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {activities.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedActivity(selectedActivity === a.name ? null : a.name)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  selectedActivity === a.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Rating (only if activity selected) */}
        <AnimatePresence>
          {selectedActivity && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-sm font-medium mb-3">How was {selectedActivity} specifically?</p>
              <div className="flex justify-between">
                {MOOD_EMOJIS.map(m => (
                  <motion.button
                    key={m.value}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActivityRating(m.value)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all",
                      activityRating === m.value
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    {m.emoji}
                  </motion.button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Can be different from your overall mood!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confounders */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium">Today (sticky)</p>
            <button
              onClick={() => setShowAddConfounder(!showAddConfounder)}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {showAddConfounder && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newConfounder}
                onChange={(e) => setNewConfounder(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newConfounder.trim() && addConfounderMutation.mutate(newConfounder.trim())}
                placeholder="New confounder..."
                className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm outline-none focus:ring-2 ring-primary/50"
                autoFocus
              />
              <button
                onClick={() => newConfounder.trim() && addConfounderMutation.mutate(newConfounder.trim())}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                Add
              </button>
            </div>
          )}

          <div className="space-y-2">
            {confounders.map(c => (
              <label key={c.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeConfounders.includes(c.name)}
                  onChange={() => toggleConfounder(c.name)}
                  className="w-5 h-5 rounded bg-muted border-none accent-primary"
                />
                <span className="text-sm">{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || createEntryMutation.isPending}
          className={cn(
            "w-full py-3 rounded-xl font-medium transition-all",
            canSubmit
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {createEntryMutation.isPending ? 'Logging...' : 'Log Entry'}
        </button>
      </div>
    </motion.div>
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
        <p className="text-muted-foreground">Loading analytics...</p>
      </motion.div>
    );
  }

  if (!analytics || analytics.totalEntries === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center"
      >
        <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No data yet. Start logging to see insights!</p>
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
      className="space-y-4"
    >
      {/* Overview */}
      <div className="glass-card p-4">
        <h2 className="font-semibold mb-3">Overview</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl">{getMoodEmoji(analytics.overallMoodAvg || 3)}</p>
            <p className="text-xs text-muted-foreground">Avg Mood</p>
            <p className="text-sm font-medium">{analytics.overallMoodAvg?.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl">{analytics.overallQuitRate! > 50 ? '🚪' : '💪'}</p>
            <p className="text-xs text-muted-foreground">Quit Rate</p>
            <p className="text-sm font-medium">{analytics.overallQuitRate?.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-2xl">📊</p>
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="text-sm font-medium">{analytics.totalEntries}</p>
          </div>
        </div>
      </div>

      {/* Trends */}
      {(analytics.trends.last7Days || analytics.trends.last30Days) && (
        <div className="glass-card p-4">
          <h2 className="font-semibold mb-3">Trends</h2>
          <div className="space-y-2">
            {analytics.trends.last7Days && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm">Last 7 days</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{getMoodEmoji(analytics.trends.last7Days.avgMood)} {analytics.trends.last7Days.avgMood.toFixed(1)}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    analytics.trends.last7Days.quitRate > 50 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                  )}>
                    {analytics.trends.last7Days.quitRate.toFixed(0)}% quit
                  </span>
                </div>
              </div>
            )}
            {analytics.trends.last30Days && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Last 30 days</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{getMoodEmoji(analytics.trends.last30Days.avgMood)} {analytics.trends.last30Days.avgMood.toFixed(1)}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    analytics.trends.last30Days.quitRate > 50 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
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
        <div className="glass-card p-4">
          <h2 className="font-semibold mb-3">Activities</h2>
          <div className="space-y-3">
            {analytics.activityStats.map(stat => (
              <div key={stat.activity} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{stat.activity}</p>
                  <p className="text-xs text-muted-foreground">{stat.count} entries</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {stat.avgRating !== null ? `${getMoodEmoji(stat.avgRating)} ${stat.avgRating.toFixed(1)}` : `${getMoodEmoji(stat.avgMood)} ${stat.avgMood.toFixed(1)}`}
                  </p>
                  <p className={cn(
                    "text-xs",
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
        <div className="glass-card p-4">
          <h2 className="font-semibold mb-3">Confounders Impact</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Baseline mood (no confounders): {analytics.baselineMood?.toFixed(1) || 'N/A'}
          </p>
          <div className="space-y-3">
            {analytics.confounderStats.map(stat => (
              <div key={stat.confounder} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{stat.confounder}</p>
                  <p className="text-xs text-muted-foreground">{stat.count} entries</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-medium",
                    stat.moodImpact < -0.5 ? "text-red-400" : stat.moodImpact > 0.5 ? "text-emerald-400" : "text-muted-foreground"
                  )}>
                    {stat.moodImpact > 0 ? '+' : ''}{stat.moodImpact.toFixed(1)} mood
                  </p>
                  <p className={cn(
                    "text-xs",
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
        <p className="text-muted-foreground">Loading history...</p>
      </motion.div>
    );
  }

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center"
      >
        <p className="text-muted-foreground">No entries yet. Start logging!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3"
    >
      {entries.map(entry => (
        <motion.div
          key={entry.id}
          layout
          className="glass-card p-4"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                entry.decision === 'quit'
                  ? "bg-red-500/20 text-red-400"
                  : "bg-emerald-500/20 text-emerald-400"
              )}>
                {entry.decision}
              </span>
            </div>
            <button
              onClick={() => deleteEntryMutation.mutate(entry.id)}
              className="text-muted-foreground hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {entry.activity && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{entry.activity}</span>
              {entry.activityRating && (
                <span className="text-sm">{getMoodEmoji(entry.activityRating)}</span>
              )}
            </div>
          )}

          {(entry.confounders as string[]).length > 0 && (
            <p className="text-xs text-muted-foreground mb-1">
              {(entry.confounders as string[]).join(', ')}
            </p>
          )}

          <p className="text-xs text-muted-foreground">{formatDate(entry.timestamp as unknown as string)}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
