import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { MoodLog } from '@shared/schema';

const MOOD_EMOJIS = ['😊', '😌', '😐', '😔', '😤'] as const;

const DEFAULT_TAGS = ['work', 'climbing', 'study', 'social', 'tired', 'energized'];

interface MoodButtonProps {
  isMobile?: boolean;
}

export function MoodButton({ isMobile = false }: MoodButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-50 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-primary to-primary/80",
          "shadow-lg shadow-primary/30 hover:shadow-primary/50",
          "transition-shadow",
          isMobile ? "bottom-20 right-4 w-12 h-12" : "bottom-6 right-6 w-14 h-14"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Log your mood"
      >
        <span className={cn("text-xl", isMobile ? "text-lg" : "text-2xl")}>😊</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && <MoodPicker onClose={() => setIsOpen(false)} isMobile={isMobile} />}
      </AnimatePresence>
    </>
  );
}

interface MoodPickerProps {
  onClose: () => void;
  isMobile?: boolean;
}

function MoodPicker({ onClose, isMobile = false }: MoodPickerProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [customTag, setCustomTag] = useState('');
  const [note, setNote] = useState('');
  const { toast } = useToast();

  // Fetch user's saved tags
  const { data: savedTags = [] } = useQuery<string[]>({
    queryKey: ['/api/mood-logs/tags'],
  });

  // Combine default and saved tags, deduplicated
  const allTags = [...new Set([...DEFAULT_TAGS, ...savedTags])];

  const createMoodMutation = useMutation({
    mutationFn: async (data: { emoji: string; tag?: string; note?: string }) => {
      return await apiRequest('/api/mood-logs', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mood-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mood-logs/tags'] });
      toast({
        title: 'Mood logged! 🎉',
        description: 'Keep tracking how you feel.',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Failed to log mood',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedEmoji) return;

    createMoodMutation.mutate({
      emoji: selectedEmoji,
      tag: customTag || selectedTag || undefined,
      note: note || undefined,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={cn(
          "fixed z-50 glass-card p-5",
          isMobile
            ? "bottom-20 left-4 right-4"
            : "bottom-24 right-6 w-80"
        )}
      >
        <p className="font-semibold text-foreground mb-3">How are you feeling?</p>

        {/* Emoji Selection */}
        <div className="flex gap-2 mb-4 justify-between">
          {MOOD_EMOJIS.map(emoji => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedEmoji(emoji)}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all",
                selectedEmoji === emoji
                  ? "bg-primary/20 border-2 border-primary"
                  : "bg-muted border-2 border-transparent hover:border-border"
              )}
            >
              {emoji}
            </motion.button>
          ))}
        </div>

        {/* Tag Selection */}
        <p className="text-xs text-muted-foreground mb-2">Tag (optional)</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {allTags.slice(0, 8).map(tag => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTag(selectedTag === tag ? null : tag);
                setCustomTag('');
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                selectedTag === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Custom Tag Input */}
        <input
          type="text"
          placeholder="Or type custom tag..."
          value={customTag}
          onChange={(e) => {
            setCustomTag(e.target.value);
            setSelectedTag(null);
          }}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg text-sm mb-3",
            "bg-muted border border-border",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
        />

        {/* Note Input */}
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg text-sm mb-4",
            "bg-muted border border-border",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
        />

        {/* Submit Button */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedEmoji || createMoodMutation.isPending}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl font-medium transition-all",
              selectedEmoji
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {createMoodMutation.isPending ? 'Logging...' : 'Log Mood'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// Display component for showing today's moods (for End of Day popup)
interface MoodDisplayProps {
  moods: MoodLog[];
}

export function MoodDisplay({ moods }: MoodDisplayProps) {
  if (moods.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No moods logged today</p>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {moods.map((mood, i) => (
        <div
          key={mood.id || i}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted"
          title={mood.tag || undefined}
        >
          <span className="text-lg">{mood.emoji}</span>
          {mood.tag && (
            <span className="text-xs text-muted-foreground">{mood.tag}</span>
          )}
        </div>
      ))}
    </div>
  );
}
