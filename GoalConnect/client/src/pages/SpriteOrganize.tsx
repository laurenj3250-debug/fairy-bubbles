import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SpriteFile {
  filename: string;
  path: string;
}

interface CategorizedSprite {
  filename: string;
  category: 'creature' | 'biome' | 'item' | 'ui' | 'uncategorized';
  name?: string;
}

export default function SpriteOrganize() {
  const queryClient = useQueryClient();
  const [sprites, setSprites] = useState<Map<string, CategorizedSprite>>(new Map());
  const [selectedSprites, setSelectedSprites] = useState<Set<string>>(new Set());

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

  const toggleSelection = (filename: string) => {
    setSelectedSprites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filename)) {
        newSet.delete(filename);
      } else {
        newSet.add(filename);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedSprites(new Set(files.map(f => f.filename)));
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
    if (confirm(`Delete ${selectedSprites.size} selected sprite(s)?`)) {
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
    item: categorized.filter(s => s.category === 'item'),
    ui: categorized.filter(s => s.category === 'ui'),
    uncategorized: categorized.filter(s => s.category === 'uncategorized'),
  };

  return (
    <div className="min-h-screen p-8 pb-24 max-w-7xl mx-auto relative z-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Organize Sprites</h1>
        <p className="text-teal-200">Categorize your sprites and set up creatures for the game</p>
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
              Select All
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
            <div className="flex items-center gap-2 pt-3 border-t border-white/20">
              <span className="text-sm text-white/80 mr-2">Assign to category:</span>
              <button
                onClick={() => batchUpdateCategory('creature')}
                className="bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/50 text-purple-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                🐉 Creature
              </button>
              <button
                onClick={() => batchUpdateCategory('biome')}
                className="bg-green-500/20 hover:bg-green-500/40 border border-green-400/50 text-green-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                🌲 Biome
              </button>
              <button
                onClick={() => batchUpdateCategory('item')}
                className="bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-400/50 text-yellow-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                💎 Item
              </button>
              <button
                onClick={() => batchUpdateCategory('ui')}
                className="bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                🎨 UI
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{byCategory.creature.length}</div>
          <div className="text-sm text-purple-200">Creatures</div>
        </div>
        <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{byCategory.biome.length}</div>
          <div className="text-sm text-green-200">Biomes</div>
        </div>
        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{byCategory.item.length}</div>
          <div className="text-sm text-yellow-200">Items</div>
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
            {byCategory.uncategorized.map((sprite) => (
              <div
                key={sprite.filename}
                className={`bg-white/5 rounded-lg p-3 border transition-colors ${
                  selectedSprites.has(sprite.filename)
                    ? 'border-red-400 bg-red-500/20'
                    : 'border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <input
                    type="checkbox"
                    checked={selectedSprites.has(sprite.filename)}
                    onChange={() => toggleSelection(sprite.filename)}
                    className="w-4 h-4 cursor-pointer"
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
                  onChange={(e) => updateCategory(sprite.filename, e.target.value as any)}
                  className="w-full bg-white/10 text-white text-xs rounded p-1 border border-white/20"
                >
                  <option value="uncategorized">Select...</option>
                  <option value="creature">Creature</option>
                  <option value="biome">Biome</option>
                  <option value="item">Item</option>
                  <option value="ui">UI</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorized Sections */}
      {(['creature', 'biome', 'item', 'ui'] as const).map((category) => {
        const items = byCategory[category];
        if (items.length === 0) return null;

        return (
          <div key={category} className="mb-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 capitalize">
              {category}s ({items.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((sprite) => (
                <div
                  key={sprite.filename}
                  className={`bg-white/5 rounded-lg p-3 border transition-colors ${
                    selectedSprites.has(sprite.filename)
                      ? 'border-red-400 bg-red-500/20'
                      : 'border-teal-400/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <input
                      type="checkbox"
                      checked={selectedSprites.has(sprite.filename)}
                      onChange={() => toggleSelection(sprite.filename)}
                      className="w-4 h-4 cursor-pointer"
                    />
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
                      onChange={(e) => updateName(sprite.filename, e.target.value)}
                      className="w-full bg-white/10 text-white text-xs rounded p-1 mb-1 border border-white/20"
                    />
                  )}
                  <div className="text-xs text-white/60 mb-2 truncate" title={sprite.filename}>
                    {sprite.filename}
                  </div>
                  <button
                    onClick={() => updateCategory(sprite.filename, 'uncategorized')}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded p-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
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
