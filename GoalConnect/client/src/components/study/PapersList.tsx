import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileText, Check, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudyPaper } from "@shared/types/study";

interface PapersListProps {
  papers: StudyPaper[];
  onCreatePaper: (
    data: { title: string; url?: string },
    options?: { onSuccess?: () => void }
  ) => void;
  onTogglePaper: (paperId: number) => void;
  onDeletePaper: (paperId: number) => void;
}

export function PapersList({
  papers,
  onCreatePaper,
  onTogglePaper,
  onDeletePaper,
}: PapersListProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleCreate = () => {
    onCreatePaper(
      { title: newTitle, url: newUrl || undefined },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          setNewTitle("");
          setNewUrl("");
        },
      }
    );
  };

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="font-heading text-lg text-forest-cream">Papers</span>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <button className="p-1.5 text-[var(--text-muted)] hover:text-forest-cream transition-colors rounded-lg hover:bg-white/5">
              <Plus className="w-4 h-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[rgba(13,24,21,0.95)] border border-white/10 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-forest-cream font-heading">Add Paper</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Paper title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-white/5 border-white/10 text-forest-cream placeholder:text-[var(--text-muted)]"
              />
              <Input
                placeholder="URL (optional)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="bg-white/5 border-white/10 text-forest-cream placeholder:text-[var(--text-muted)]"
              />
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(212, 165, 154, 0.15)',
                  border: '1px solid rgba(212, 165, 154, 0.3)',
                  color: '#d4a59a',
                }}
              >
                Add Paper
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Papers List */}
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {papers.map((paper) => (
          <div key={paper.id} className="flex items-center gap-2 py-2 group">
            <button
              onClick={() => onTogglePaper(paper.id)}
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0",
                paper.completed
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10"
              )}
            >
              {paper.completed && <Check className="w-3 h-3" />}
            </button>
            <span
              className={cn(
                "text-sm flex-1",
                paper.completed
                  ? "text-[var(--text-muted)] line-through"
                  : "text-forest-cream/80"
              )}
            >
              {paper.title}
            </span>
            {paper.url && (
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-muted)] hover:text-forest-coral transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={() => {
                if (confirm("Delete this paper?")) {
                  onDeletePaper(paper.id);
                }
              }}
              className="text-[var(--text-muted)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {papers.length === 0 && (
          <p className="text-[var(--text-muted)] text-sm text-center py-4">
            No papers yet
          </p>
        )}
      </div>
    </div>
  );
}
