import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Habit, HabitLog } from '@shared/schema';
import { format, parseISO } from 'date-fns';
import { X, Pencil, Check, Calendar } from 'lucide-react';

interface HabitDetailDialogProps {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HabitDetailDialog({
  habit,
  open,
  onOpenChange,
}: HabitDetailDialogProps) {
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState('');

  // Fetch logs for this habit
  const { data: logs = [] } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs', { habitId: habit?.id }],
    queryFn: async () => {
      if (!habit) return [];
      const res = await fetch(`/api/habit-logs?habitId=${habit.id}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    },
    enabled: open && !!habit,
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ logId, note }: { logId: number; note: string }) => {
      return apiRequest(`/api/habit-logs/${logId}`, 'PATCH', { note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habits-with-data'] });
      setEditingLogId(null);
      setEditNote('');
    },
  });

  if (!habit) return null;

  // Sort logs by date, most recent first
  const sortedLogs = [...logs]
    .filter(log => log.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleStartEdit = (log: HabitLog) => {
    setEditingLogId(log.id);
    setEditNote(log.note || '');
  };

  const handleSaveNote = () => {
    if (editingLogId === null) return;
    updateNoteMutation.mutate({ logId: editingLogId, note: editNote.trim() });
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setEditNote('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 bg-slate-900/95 backdrop-blur-xl max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-heading text-white flex items-center gap-3">
            <span className="text-3xl">{habit.icon}</span>
            <div>
              <div>{habit.title}</div>
              <div className="text-sm font-normal text-slate-400">
                {sortedLogs.length} completion{sortedLogs.length !== 1 ? 's' : ''}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2">
          {sortedLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No completions yet</p>
              <p className="text-sm mt-1">Complete this habit to see your history here</p>
            </div>
          ) : (
            sortedLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {format(parseISO(log.date), 'EEEE, MMM d, yyyy')}
                  </span>
                  {editingLogId !== log.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(log)}
                      className="text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {editingLogId === log.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder={habit.notePlaceholder || "Add a note..."}
                      className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-peach-400/50 focus:ring-peach-400/20 resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="text-slate-400 hover:text-white hover:bg-white/10"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveNote}
                        disabled={updateNoteMutation.isPending}
                        className="bg-peach-500 hover:bg-peach-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {updateNoteMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">
                    {log.note || (
                      <span className="text-slate-500 italic">No note added</span>
                    )}
                  </p>
                )}

                {log.durationMinutes && (
                  <div className="mt-2 text-xs text-slate-500">
                    {log.durationMinutes} minutes
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 pt-4 border-t border-white/10 mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
