import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  BookOpen,
  Image,
  Layers,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudyBook } from "@shared/types/study";

interface BooksListProps {
  books: StudyBook[];
  onCreateBook: (
    data: { title: string; abbreviation?: string },
    options?: { onSuccess?: () => void }
  ) => void;
  onDeleteBook: (bookId: number) => void;
  onCreateChapter: (
    data: { bookId: number; title: string },
    options?: { onSuccess?: () => void }
  ) => void;
  onDeleteChapter: (chapterId: number) => void;
  onToggleImages: (chapterId: number) => void;
  onToggleCards: (chapterId: number) => void;
}

export function BooksList({
  books,
  onCreateBook,
  onDeleteBook,
  onCreateChapter,
  onDeleteChapter,
  onToggleImages,
  onToggleCards,
}: BooksListProps) {
  const [addBookDialogOpen, setAddBookDialogOpen] = useState(false);
  const [addChapterDialogOpen, setAddChapterDialogOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(new Set());

  // Form states
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAbbreviation, setNewBookAbbreviation] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");

  const toggleBookExpanded = (bookId: number) => {
    const newExpanded = new Set(expandedBooks);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
    }
    setExpandedBooks(newExpanded);
  };

  const handleCreateBook = () => {
    onCreateBook(
      {
        title: newBookTitle,
        abbreviation: newBookAbbreviation || undefined,
      },
      {
        onSuccess: () => {
          setAddBookDialogOpen(false);
          setNewBookTitle("");
          setNewBookAbbreviation("");
        },
      }
    );
  };

  const handleCreateChapter = () => {
    if (selectedBookId) {
      onCreateChapter(
        { bookId: selectedBookId, title: newChapterTitle },
        {
          onSuccess: () => {
            setAddChapterDialogOpen(false);
            setNewChapterTitle("");
            setSelectedBookId(null);
          },
        }
      );
    }
  };

  return (
    <>
      <div className="glass-card p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="font-heading text-lg text-forest-cream">Books</span>
          </div>
          <Dialog open={addBookDialogOpen} onOpenChange={setAddBookDialogOpen}>
            <DialogTrigger asChild>
              <button className="p-1.5 text-[var(--text-muted)] hover:text-forest-cream transition-colors rounded-lg hover:bg-white/5">
                <Plus className="w-4 h-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[rgba(13,24,21,0.95)] border border-white/10 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-forest-cream font-heading">Add Book</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Book title"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  className="bg-white/5 border-white/10 text-forest-cream placeholder:text-[var(--text-muted)]"
                />
                <Input
                  placeholder="Abbreviation (optional)"
                  value={newBookAbbreviation}
                  onChange={(e) => setNewBookAbbreviation(e.target.value)}
                  className="bg-white/5 border-white/10 text-forest-cream placeholder:text-[var(--text-muted)]"
                />
                <button
                  onClick={handleCreateBook}
                  disabled={!newBookTitle.trim()}
                  className="w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{
                    background: 'rgba(212, 165, 154, 0.15)',
                    border: '1px solid rgba(212, 165, 154, 0.3)',
                    color: '#d4a59a',
                  }}
                >
                  Add Book
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Books List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {books.map((book) => (
            <Collapsible
              key={book.id}
              open={expandedBooks.has(book.id)}
              onOpenChange={() => toggleBookExpanded(book.id)}
            >
              <div className="border border-white/5 rounded-lg overflow-hidden">
                <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 text-forest-cream text-sm">
                    {expandedBooks.has(book.id) ? (
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                    <span className="font-medium">
                      {book.abbreviation || book.title}
                    </span>
                    <span className="text-[var(--text-muted)] text-xs">
                      ({book.chapters.filter((c) => c.imagesCompleted && c.cardsCompleted).length}/{book.chapters.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBookId(book.id);
                        setAddChapterDialogOpen(true);
                      }}
                      className="p-1 text-[var(--text-muted)] hover:text-forest-cream transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this book and all its chapters?")) {
                          onDeleteBook(book.id);
                        }
                      }}
                      className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-white/5 px-3 py-2 space-y-1">
                    {book.chapters.length === 0 ? (
                      <p className="text-[var(--text-muted)] text-xs py-2">
                        No chapters yet
                      </p>
                    ) : (
                      book.chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="flex items-center justify-between py-1.5 group"
                        >
                          <span
                            className={cn(
                              "text-sm flex-1",
                              chapter.imagesCompleted && chapter.cardsCompleted
                                ? "text-[var(--text-muted)] line-through"
                                : "text-forest-cream/80"
                            )}
                          >
                            {chapter.title}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onToggleImages(chapter.id)}
                              className={cn(
                                "w-6 h-6 rounded flex items-center justify-center transition-all",
                                chapter.imagesCompleted
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10"
                              )}
                              title="Images extracted"
                            >
                              <Image className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onToggleCards(chapter.id)}
                              className={cn(
                                "w-6 h-6 rounded flex items-center justify-center transition-all",
                                chapter.cardsCompleted
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10"
                              )}
                              title="Cards created"
                            >
                              <Layers className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this chapter?")) {
                                  onDeleteChapter(chapter.id);
                                }
                              }}
                              className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
          {books.length === 0 && (
            <p className="text-[var(--text-muted)] text-sm text-center py-4">
              No books yet
            </p>
          )}
        </div>
      </div>

      {/* Add Chapter Dialog */}
      <Dialog open={addChapterDialogOpen} onOpenChange={setAddChapterDialogOpen}>
        <DialogContent className="bg-[rgba(13,24,21,0.95)] border border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-forest-cream font-heading">Add Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Chapter title"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-forest-cream placeholder:text-[var(--text-muted)]"
            />
            <button
              onClick={handleCreateChapter}
              disabled={!newChapterTitle.trim() || !selectedBookId}
              className="w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: 'rgba(212, 165, 154, 0.15)',
                border: '1px solid rgba(212, 165, 154, 0.3)',
                color: '#d4a59a',
              }}
            >
              Add Chapter
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
