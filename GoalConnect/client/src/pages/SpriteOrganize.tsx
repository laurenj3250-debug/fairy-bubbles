import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SpriteFile {
  filename: string;
  path: string;
}

interface CategorizedSprite {
  filename: string;
  category: 'creature' | 'biome' | 'biome-background' | 'biome-platform' | 'biome-obstacle' | 'item' | 'egg' | 'ui' | 'uncategorized';
  name?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic';
}

export default function SpriteOrganize() {
  const queryClient = useQueryClient();
  const [sprites, setSprites] = useState<Map<string, CategorizedSprite>>(new Map());
  const [selectedSprites, setSelectedSprites] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  // Fetch uploaded sprites
  const { data: files = [], isLoading } = useQuery<SpriteFile[]>({
    queryKey: ['/api/sprites/list'],
  });

  // Initialize sprites map when files load
  useEffect(() => {
    if (files.length > 0 && sprites.size === 0) {
      const newSprites = new Map<string, CategorizedSprite>();
      files.forEach(file => {
        newSprites.set(file.filename, {
          filename: file.filename,
          category: 'uncategorized',
        });
      });
      setSprites(newSprites);
    }
  }, [files]);

  const updateCategory = (filename: string, category: CategorizedSprite['category']) => {
    setSprites(prev => {
      const newMap = new Map(prev);
      const sprite = newMap.get(filename);
      if (sprite) {
        newMap.set(filename, { ...sprite, category });
      }
      return newMap;
    });
  };

  const updateName = (filename: string, name: string) => {
    setSprites(prev => {
      const newMap = new Map(prev);
      const sprite = newMap.get(filename);
      if (sprite) {
        newMap.set(filename, { ...sprite, name });
      }
      return newMap;
    });
  };

  const updateRarity = (filename: string, rarity: CategorizedSprite['rarity']) => {
    setSprites(prev => {
      const newMap = new Map(prev);
      const sprite = newMap.get(filename);
      if (sprite) {
        newMap.set(filename, { ...sprite, rarity });
      }
      return newMap;
    });
  };

  const handleSpriteClick = (filename: string, index: number, event: React.MouseEvent) => {
    if (event.shiftKey && lastClickedIndex !== null) {
      // Shift-click: select range
      const allFiles = Array.from(sprites.values()).map(s => s.filename);
      const startIndex = Math.min(lastClickedIndex, index);
      const endIndex = Math.max(lastClickedIndex, index);
      const rangeFiles = allFiles.slice(startIndex, endIndex + 1);

      setSelectedSprites(prev => {
        const newSet = new Set(prev);
        rangeFiles.forEach(f => newSet.add(f));
        return newSet;
      });
    } else {
      // Normal click: toggle individual
      setSelectedSprites(prev => {
        const newSet = new Set(prev);
        if (newSet.has(filename)) {
          newSet.delete(filename);
        } else {
          newSet.add(filename);
        }
        return newSet;
      });
      setLastClickedIndex(index);
    }
  };

  const selectAll = () => {
    // Only select uncategorized sprites (safest default)
    const uncategorizedFiles = Array.from(sprites.values())
      .filter(s => s.category === 'uncategorized')
      .map(s => s.filename);
    setSelectedSprites(new Set(uncategorizedFiles));
  };

  const clearSelection = () => {
    setSelectedSprites(new Set());
  };

  const deleteMutation = useMutation({
    mutationFn: async (filenames: string[]) => {
      const response = await fetch('/api/sprites/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames }),
      });
      if (!response.ok) throw new Error('Failed to delete sprites');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprites/list'] });
      setSelectedSprites(new Set());
      // Remove deleted sprites from state
      setSprites(prev => {
        const newMap = new Map(prev);
        selectedSprites.forEach(filename => newMap.delete(filename));
        return newMap;
      });
    },
  });

  const handleDeleteSelected = () => {
    if (selectedSprites.size === 0) return;

    // Count by category for better confirmation message
    const selectedByCategory: Record<string, number> = {
      creature: 0,
      biome: 0,
      'biome-background': 0,
      'biome-platform': 0,
      'biome-obstacle': 0,
      item: 0,
      egg: 0,
      ui: 0,
      uncategorized: 0,
    };

    selectedSprites.forEach(filename => {
      const sprite = sprites.get(filename);
      if (sprite) {
        selectedByCategory[sprite.category]++;
      }
    });

    const categorySummary = Object.entries(selectedByCategory)
      .filter(([_, count]) => count > 0)
      .map(([cat, count]) => `${count} ${cat}`)
      .join(', ');

    if (confirm(`⚠️ DELETE ${selectedSprites.size} sprites?\n\n${categorySummary}\n\nThis cannot be undone!`)) {
      deleteMutation.mutate(Array.from(selectedSprites));
    }
  };

  const batchUpdateCategory = (category: CategorizedSprite['category']) => {
    setSprites(prev => {
      const newMap = new Map(prev);
      selectedSprites.forEach(filename => {
        const sprite = newMap.get(filename);
        if (sprite) {
          newMap.set(filename, { ...sprite, category });
        }
      });
      return newMap;
    });
    setSelectedSprites(new Set()); // Clear selection after categorizing
    setLastClickedIndex(null); // Reset shift-click reference
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const categorized = Array.from(sprites.values());
      const response = await fetch('/api/sprites/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprites: categorized }),
      });
      if (!response.ok) throw new Error('Failed to save organization');
      return response.json();
    },
    onSuccess: () => {
      alert('Sprites organized successfully!');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 pb-24 flex items-center justify-center">
        <div className="text-white text-xl">Loading sprites...</div>
      </div>
    );
  }

  const categorized = Array.from(sprites.values());
  const byCategory = {
    creature: categorized.filter(s => s.category === 'creature'),
    biome: categorized.filter(s => s.category === 'biome'),
    'biome-background': categorized.filter(s => s.category === 'biome-background'),
    'biome-platform': categorized.filter(s => s.category === 'biome-platform'),
    'biome-obstacle': categorized.filter(s => s.category === 'biome-obstacle'),
    item: categorized.filter(s => s.category === 'item'),
    egg: categorized.filter(s => s.category === 'egg'),
    ui: categorized.filter(s => s.category === 'ui'),
    uncategorized: categorized.filter(s => s.category === 'uncategorized'),
  };

  return (
    <div className="min-h-screen p-8 pb-24 max-w-7xl mx-auto relative z-10">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Organize Sprites</h1>
            <p className="text-teal-200">Categorize your sprites and set up creatures for the game</p>
          </div>
          <button
            onClick={() => window.location.href = '/game/admin'}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-lg"
          >
            🎮 Create Game Data →
          </button>
        </div>
      </div>

      {/* Selection Toolbar */}
      {files.length > 0 && (
        <div className="mb-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-white font-medium">
              {selectedSprites.size > 0 ? `${selectedSprites.size} selected` : 'Select sprites to categorize'}
            </span>
            <button
              onClick={selectAll}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Select All Uncategorized
            </button>
            {selectedSprites.size > 0 && (
              <>
                <button
                  onClick={clearSelection}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleteMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors ml-auto"
                >
                  {deleteMutation.isPending ? 'Deleting...' : `Delete ${selectedSprites.size}`}
                </button>
              </>
            )}
          </div>

          {selectedSprites.size > 0 && (
            <div className="pt-3 border-t border-white/20 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-white/80 mr-2">Assign to category:</span>
                <button
                  onClick={() => batchUpdateCategory('creature')}
                  className="bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/50 text-purple-200 px-3 py-1 rounded text-sm font-semibold transition-colors"
                >
                  🐉 Creature
                </button>
                <button
                  onClick={() => batchUpdateCategory('egg')}
                  className="bg-pink-500/20 hover:bg-pink-500/40 border border-pink-400/50 text-pink-200 px-3 py-1 rounded text-sm font-semibold transition-colors"
                >
                  🥚 Egg
                </button>
                <button
                  onClick={() => batchUpdateCategory('item')}
                  className="bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-400/50 text-yellow-200 px-3 py-1 rounded text-sm font-semibold transition-colors"
                >
                  💎 Item
                </button>
                <button
                  onClick={() => batchUpdateCategory('ui')}
                  className="bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 px-3 py-1 rounded text-sm font-semibold transition-colors"
                >
                  🎨 UI
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-white/80 mr-2">Biome parts:</span>
                <button
                  onClick={() => batchUpdateCategory('biome')}
                  className="bg-green-500/20 hover:bg-green-500/40 border border-green-400/50 text-green-200 px-3 py-1 rounded text-sm font-semibold transition-colors"
                >
                  🌲 Full Biome
                </button>
                <button
                  onClick={() => batchUpdateCategory('biome-background')}
                  className="bg-teal-500/20 hover:bg-teal-500/40 border border-teal-400/50 text-teal-200 px-3 py-1 rounded text-sm font-semibold transition-colors"
                >
                  🏔️ Background
                </button>
                <button
                  onClick={() => batchUpdateCategory('biome-platform')}
                  className="bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-200 px-3 py-1 rounded text-sm font-semibold transition-colors"
                >
                  🟪 Platform
                </button>
                <button
                  onClick={() => batchUpdateCategory('biome-obstacle')}
                  className="bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/50 text-emerald-200 px-3 py-1 rounded text-sm font-semibold transition-colors"
                >
                  🪨 Obstacle
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{byCategory.creature.length}</div>
          <div className="text-sm text-purple-200">Creatures</div>
        </div>
        <div className="bg-pink-500/20 border border-pink-400/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{byCategory.egg.length}</div>
          <div className="text-sm text-pink-200">Eggs</div>
        </div>
        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{byCategory.item.length}</div>
          <div className="text-sm text-yellow-200">Items</div>
        </div>
        <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">
            {byCategory.biome.length + byCategory['biome-background'].length + byCategory['biome-platform'].length + byCategory['biome-obstacle'].length}
          </div>
          <div className="text-sm text-green-200">Biome Assets</div>
        </div>
        <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{byCategory.ui.length}</div>
          <div className="text-sm text-blue-200">UI</div>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{byCategory.uncategorized.length}</div>
          <div className="text-sm text-white/60">Uncategorized</div>
        </div>
      </div>

      {/* Uncategorized Sprites */}
      {byCategory.uncategorized.length > 0 && (
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Uncategorized Sprites ({byCategory.uncategorized.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {byCategory.uncategorized.map((sprite, idx) => {
              const allSprites = Array.from(sprites.values());
              const globalIndex = allSprites.findIndex(s => s.filename === sprite.filename);
              return (
                <div
                  key={sprite.filename}
                  data-sprite-card={sprite.filename}
                  onClick={(e) => handleSpriteClick(sprite.filename, globalIndex, e)}
                  className={`bg-white/5 rounded-lg p-3 border transition-colors cursor-pointer hover:bg-white/10 ${
                    selectedSprites.has(sprite.filename)
                      ? 'border-red-400 bg-red-500/20'
                      : 'border-white/20'
                  }`}
                >
                <div className="flex items-start justify-between mb-2">
                  <input
                    type="checkbox"
                    checked={selectedSprites.has(sprite.filename)}
                    onChange={(e) => e.stopPropagation()}
                    className="w-4 h-4 cursor-pointer pointer-events-none"
                  />
                </div>
                <div className="aspect-square bg-white/10 rounded mb-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={`/api/sprites/file/${sprite.filename}`}
                    alt={sprite.filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="text-xs text-white/60 mb-2 truncate" title={sprite.filename}>
                  {sprite.filename}
                </div>
                <select
                  value={sprite.category}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateCategory(sprite.filename, e.target.value as any);
                  }}
                  className="w-full bg-white/10 text-white text-xs rounded p-1 border border-white/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="uncategorized">Select category...</option>
                  <option value="creature">🐉 Creature</option>
                  <option value="egg">🥚 Egg</option>
                  <option value="item">💎 Item</option>
                  <option value="ui">🎨 UI</option>
                  <option disabled>──────────</option>
                  <option value="biome">🌲 Full Biome</option>
                  <option value="biome-background">🏔️ Biome Background</option>
                  <option value="biome-platform">🟪 Biome Platform</option>
                  <option value="biome-obstacle">🪨 Biome Obstacle</option>
                </select>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categorized Sections */}
      {(['creature', 'egg', 'item', 'ui', 'biome', 'biome-background', 'biome-platform', 'biome-obstacle'] as const).map((category) => {
        const items = byCategory[category];
        if (items.length === 0) return null;

        const categoryLabels = {
          'creature': 'Creatures',
          'egg': 'Eggs',
          'item': 'Items',
          'ui': 'UI Elements',
          'biome': 'Full Biomes',
          'biome-background': 'Biome Backgrounds',
          'biome-platform': 'Biome Platforms',
          'biome-obstacle': 'Biome Obstacles',
        };

        return (
          <div key={category} className="mb-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              {categoryLabels[category]} ({items.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((sprite, idx) => {
                const allSprites = Array.from(sprites.values());
                const globalIndex = allSprites.findIndex(s => s.filename === sprite.filename);
                return (
                  <div
                    key={sprite.filename}
                    data-sprite-card={sprite.filename}
                    onClick={(e) => handleSpriteClick(sprite.filename, globalIndex, e)}
                    className={`bg-white/5 rounded-lg p-3 border transition-colors cursor-pointer hover:bg-white/10 ${
                      selectedSprites.has(sprite.filename)
                        ? 'border-red-400 bg-red-500/20'
                        : 'border-teal-400/50'
                    }`}
                  >
                  <div className="flex items-start justify-between mb-2">
                    <input
                      type="checkbox"
                      checked={selectedSprites.has(sprite.filename)}
                      onChange={(e) => e.stopPropagation()}
                      className="w-4 h-4 cursor-pointer pointer-events-none"
                    />
                    {sprite.rarity && (
                      <span className={`text-xs px-1 rounded ${
                        sprite.rarity === 'epic' ? 'bg-orange-500/30 text-orange-200' :
                        sprite.rarity === 'rare' ? 'bg-purple-500/30 text-purple-200' :
                        sprite.rarity === 'uncommon' ? 'bg-blue-500/30 text-blue-200' :
                        'bg-gray-500/30 text-gray-200'
                      }`}>
                        {sprite.rarity.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="aspect-square bg-white/10 rounded mb-2 flex items-center justify-center overflow-hidden">
                    <img
                      src={`/api/sprites/file/${sprite.filename}`}
                      alt={sprite.filename}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  {category === 'creature' && (
                    <input
                      type="text"
                      placeholder="Creature name..."
                      value={sprite.name || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateName(sprite.filename, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white/10 text-white text-xs rounded p-1 mb-1 border border-white/20"
                    />
                  )}
                  {(category === 'creature' || category === 'egg') && (
                    <select
                      value={sprite.rarity || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateRarity(sprite.filename, e.target.value as any);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white/10 text-white text-xs rounded p-1 mb-1 border border-white/20"
                    >
                      <option value="">Select rarity...</option>
                      <option value="common">Common</option>
                      <option value="uncommon">Uncommon</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                    </select>
                  )}
                  <div className="text-xs text-white/60 mb-2 truncate" title={sprite.filename}>
                    {sprite.filename}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCategory(sprite.filename, 'uncategorized');
                    }}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded p-1"
                  >
                    Remove
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Save Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-7xl mx-auto flex gap-4">
          <button
            onClick={() => window.location.href = '/sprites/upload'}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-white/20"
          >
            ← Back to Upload
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || byCategory.uncategorized.length === files.length}
            className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Organization'}
          </button>
        </div>
      </div>
    </div>
  );
}
