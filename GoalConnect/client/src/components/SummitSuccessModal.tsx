import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mountain, Trophy, Coins, TrendingUp, Plus, Check, X } from "lucide-react";

interface SummitSuccessModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    mountain: {
      name: string;
      elevation: number;
    };
    rewards: {
      xp: number;
      tokens: number;
      levelUp: boolean;
    };
    stats: {
      totalSummits: number;
      climbingLevel: number;
      totalXp: number;
    };
  };
}

interface PieceItem {
  id: string;
  title: string;
  completed: boolean;
}

export default function SummitSuccessModal({ open, onClose, data }: SummitSuccessModalProps) {
  const [pieces, setPieces] = useState<PieceItem[]>([]);
  const [newPiece, setNewPiece] = useState("");
  const [isAddingPiece, setIsAddingPiece] = useState(false);

  const handleAddPiece = () => {
    if (newPiece.trim()) {
      setPieces([...pieces, { id: Date.now().toString(), title: newPiece.trim(), completed: false }]);
      setNewPiece("");
      setIsAddingPiece(false);
    }
  };

  const handleTogglePiece = (id: string) => {
    setPieces(pieces.map(p => p.id === id ? { ...p, completed: !p.completed } : p));
  };

  const handleRemovePiece = (id: string) => {
    setPieces(pieces.filter(p => p.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <div className="text-center py-6">
          {/* Mountain Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center animate-bounce">
              <Mountain className="w-14 h-14 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-4xl font-bold text-foreground mb-2">🏔️ SUMMIT!</h2>
          <p className="text-xl text-muted-foreground mb-6">
            {data.mountain.name}
          </p>
          <p className="text-lg text-muted-foreground mb-6">
            {data.mountain.elevation.toLocaleString()}m
          </p>

          {/* Rewards */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between bg-primary/10 rounded-lg px-4 py-3 border border-primary/20">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-medium">Experience</span>
              </div>
              <span className="text-xl font-bold text-primary">+{data.rewards.xp} XP</span>
            </div>

            <div className="flex items-center justify-between bg-yellow-500/10 rounded-lg px-4 py-3 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">Tokens</span>
              </div>
              <span className="text-xl font-bold text-yellow-500">+{data.rewards.tokens}</span>
            </div>

            {data.rewards.levelUp && (
              <div className="flex items-center justify-between bg-green-500/10 rounded-lg px-4 py-3 border border-green-500/20 animate-pulse">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Level Up!</span>
                </div>
                <span className="text-xl font-bold text-green-500">Level {data.stats.climbingLevel}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-muted/20 rounded-lg p-4 mb-6 border border-border">
            <div className="text-sm text-muted-foreground mb-2">Total Summits</div>
            <div className="text-3xl font-bold text-foreground">{data.stats.totalSummits}</div>
          </div>

          {/* Pieces to Play Checklist */}
          <div className="bg-muted/20 rounded-lg p-4 mb-6 border border-border text-left">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">Pieces to Play 🎹</h3>
              <button
                onClick={() => setIsAddingPiece(true)}
                className="p-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                title="Add piece"
              >
                <Plus className="w-4 h-4 text-primary" />
              </button>
            </div>

            {/* Add new piece input */}
            {isAddingPiece && (
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={newPiece}
                  onChange={(e) => setNewPiece(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPiece()}
                  placeholder="Enter piece name..."
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <button
                  onClick={handleAddPiece}
                  className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsAddingPiece(false);
                    setNewPiece("");
                  }}
                  className="p-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Pieces list */}
            {pieces.length === 0 && !isAddingPiece ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Add pieces you want to learn or practice
              </p>
            ) : (
              <div className="space-y-2">
                {pieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <button
                      onClick={() => handleTogglePiece(piece.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        piece.completed
                          ? "bg-primary border-primary"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {piece.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        piece.completed
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {piece.title}
                    </span>
                    <button
                      onClick={() => handleRemovePiece(piece.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 transition-all"
                    >
                      <X className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full" size="lg">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
