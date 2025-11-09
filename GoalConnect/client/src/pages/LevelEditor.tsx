import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

type Sprite = {
  id: number;
  filename: string;
  category: string;
  name: string | null;
  data: string;
  mimeType: string;
};

type Biome = {
  id: number;
  name: string;
  description: string;
  backgroundSprite: string | null;
};

type LevelObject = {
  id?: number;
  objectType: 'platform' | 'obstacle' | 'decoration';
  spriteFilename: string;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  zIndex: number;
};

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 500;
const SCALE = 0.75; // Scale down for editing

export default function LevelEditor() {
  const [selectedBiome, setSelectedBiome] = useState<number | null>(null);
  const [levelObjects, setLevelObjects] = useState<LevelObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<LevelObject | null>(null);
  const [draggedSprite, setDraggedSprite] = useState<Sprite | null>(null);
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch biomes
  const { data: biomes = [] } = useQuery<Biome[]>({
    queryKey: ['/api/game/biomes'],
  });

  // Fetch current biome data
  const { data: currentBiome } = useQuery<Biome>({
    queryKey: [`/api/biomes/${selectedBiome}`],
    enabled: !!selectedBiome,
  });

  // Fetch level objects for selected biome
  // Fixed: Corrected query key to match API endpoint format
  const { data: existingLevelObjects = [] } = useQuery<LevelObject[]>({
    queryKey: [`/api/biomes/${selectedBiome}/level-objects`],
    enabled: !!selectedBiome,
  });

  // Load existing level objects when biome changes
  useEffect(() => {
    if (existingLevelObjects.length > 0) {
      setLevelObjects(existingLevelObjects);
    } else {
      setLevelObjects([]);
    }
  }, [existingLevelObjects]);

  // Fetch sprites for toolbox
  const { data: allSprites = [] } = useQuery<Sprite[]>({
    queryKey: ['/api/sprites'],
  });

  // Filter sprites for platforms and obstacles
  const platformSprites = allSprites.filter(s =>
    s.category === 'biome-platform' || s.category === 'platform'
  );
  const obstacleSprites = allSprites.filter(s =>
    s.category === 'biome-obstacle' || s.category === 'obstacle'
  );

  // Save level mutation
  const saveLevelMutation = useMutation({
    mutationFn: async (objects: LevelObject[]) => {
      const res = await fetch(`/api/biomes/${selectedBiome}/level-objects/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objects.map(obj => ({
          objectType: obj.objectType,
          spriteFilename: obj.spriteFilename,
          xPosition: obj.xPosition,
          yPosition: obj.yPosition,
          width: obj.width,
          height: obj.height,
          zIndex: obj.zIndex,
          metadata: '{}',
        }))),
      });
      if (!res.ok) throw new Error('Failed to save level');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Level saved successfully!',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/biomes/${selectedBiome}/level-objects`] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save level',
        variant: 'destructive',
      });
    },
  });

  // Handle sprite drag from toolbox
  const handleSpriteStart = (sprite: Sprite, type: 'platform' | 'obstacle') => {
    setDraggedSprite(sprite);
  };

  // Handle drop on canvas
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedSprite || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / SCALE;
    const y = (e.clientY - rect.top) / SCALE;

    const newObject: LevelObject = {
      objectType: draggedSprite.category.includes('platform') ? 'platform' : 'obstacle',
      spriteFilename: draggedSprite.filename,
      xPosition: Math.round(x),
      yPosition: Math.round(y),
      width: 100, // Default width
      height: draggedSprite.category.includes('platform') ? 20 : 50,
      zIndex: 0,
    };

    setLevelObjects([...levelObjects, newObject]);
    setDraggedSprite(null);
  };

  // Handle object selection and dragging
  const handleObjectMouseDown = (obj: LevelObject, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedObject(obj);
    setIsDraggingObject(true);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left) / SCALE;
      const y = (e.clientY - rect.top) / SCALE;
      setDragOffset({
        x: x - obj.xPosition,
        y: y - obj.yPosition,
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingObject || !selectedObject || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / SCALE;
    const y = (e.clientY - rect.top) / SCALE;

    const newX = Math.round(x - dragOffset.x);
    const newY = Math.round(y - dragOffset.y);

    setLevelObjects(levelObjects.map(obj =>
      obj === selectedObject
        ? { ...obj, xPosition: newX, yPosition: newY }
        : obj
    ));
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingObject(false);
  };

  // Delete selected object
  const handleDeleteObject = () => {
    if (selectedObject) {
      setLevelObjects(levelObjects.filter(obj => obj !== selectedObject));
      setSelectedObject(null);
    }
  };

  // Clear all objects
  const handleClearLevel = () => {
    if (confirm('Are you sure you want to clear all objects from this level?')) {
      setLevelObjects([]);
      setSelectedObject(null);
    }
  };

  // Save level
  const handleSaveLevel = () => {
    if (!selectedBiome) {
      toast({
        title: 'Error',
        description: 'Please select a biome first',
        variant: 'destructive',
      });
      return;
    }
    saveLevelMutation.mutate(levelObjects);
  };

  // Update object properties
  const updateObjectProperty = (prop: keyof LevelObject, value: any) => {
    if (!selectedObject) return;

    setLevelObjects(levelObjects.map(obj =>
      obj === selectedObject
        ? { ...obj, [prop]: value }
        : obj
    ));
    setSelectedObject({ ...selectedObject, [prop]: value });
  };

  if (!selectedBiome) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">🎮 Level Editor</h1>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Select a Biome to Edit</h2>
          <div className="grid grid-cols-2 gap-4">
            {biomes.map(biome => (
              <button
                key={biome.id}
                onClick={() => setSelectedBiome(biome.id)}
                className="p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-left transition-colors"
              >
                <h3 className="text-lg font-semibold text-white">{biome.name}</h3>
                <p className="text-sm text-teal-200 mt-1">{biome.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <button
              onClick={() => setSelectedBiome(null)}
              className="text-teal-200 hover:text-white mb-2 flex items-center gap-2"
            >
              ← Back to Biome Selection
            </button>
            <h1 className="text-3xl font-bold text-white">
              Editing: {currentBiome?.name || 'Loading...'}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearLevel}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
            >
              🗑️ Clear All
            </button>
            <button
              onClick={handleSaveLevel}
              disabled={saveLevelMutation.isPending}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              💾 {saveLevelMutation.isPending ? 'Saving...' : 'Save Level'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_300px] gap-4">
          {/* Canvas Area */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Canvas</h2>
              <div className="text-sm text-teal-200">
                Objects: {levelObjects.length}
                {selectedObject && ' | Selected: Click to edit properties →'}
              </div>
            </div>

            {/* Canvas */}
            <div
              ref={canvasRef}
              className="relative bg-black/30 rounded-lg overflow-hidden cursor-crosshair"
              style={{
                width: `${CANVAS_WIDTH * SCALE}px`,
                height: `${CANVAS_HEIGHT * SCALE}px`,
                backgroundImage: currentBiome?.backgroundSprite
                  ? `url(${currentBiome.backgroundSprite})`
                  : 'linear-gradient(to bottom, #9333ea, #ec4899, #14b8a6)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              onDrop={handleCanvasDrop}
              onDragOver={(e) => e.preventDefault()}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              {/* Render level objects - Fixed: Removed duplicate scale transform that was breaking positioning */}
              {levelObjects.map((obj, idx) => {
                const sprite = allSprites.find(s => s.filename === obj.spriteFilename);
                return (
                  <div
                    key={idx}
                    onMouseDown={(e) => handleObjectMouseDown(obj, e)}
                    className={`absolute cursor-move border-2 ${
                      selectedObject === obj
                        ? 'border-yellow-400 bg-yellow-400/20'
                        : 'border-white/40 bg-white/10'
                    } hover:border-white`}
                    style={{
                      left: `${obj.xPosition * SCALE}px`,
                      top: `${obj.yPosition * SCALE}px`,
                      width: `${obj.width * SCALE}px`,
                      height: `${obj.height * SCALE}px`,
                      // Removed transform: scale() that was causing double-scaling and click detection issues
                    }}
                  >
                    <img
                      src={sprite?.data || `/api/sprites/file/${obj.spriteFilename}`}
                      alt={obj.spriteFilename}
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                      onError={(e) => {
                        // Fallback to API path if data URL fails
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('/api/sprites/file/')) {
                          target.src = `/api/sprites/file/${obj.spriteFilename}`;
                        }
                      }}
                    />
                    {selectedObject === obj && (
                      <div className="absolute -top-6 left-0 text-xs bg-yellow-400 text-black px-2 py-1 rounded whitespace-nowrap">
                        {obj.objectType}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Instructions */}
            <div className="mt-4 text-sm text-teal-200">
              💡 <strong>Instructions:</strong> Drag sprites from the toolbox onto the canvas.
              Click objects to select them. Use properties panel to adjust size and position.
              Press Delete or use the button to remove selected object.
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Sprite Toolbox */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">🧰 Sprite Toolbox</h3>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-teal-200 mb-2">Platforms</h4>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                  {platformSprites.map(sprite => (
                    <div
                      key={sprite.id}
                      draggable
                      onDragStart={() => handleSpriteStart(sprite, 'platform')}
                      className="cursor-grab active:cursor-grabbing p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded transition-colors"
                    >
                      <img
                        src={sprite.data}
                        alt={sprite.filename}
                        className="w-full h-12 object-contain"
                      />
                      <p className="text-xs text-teal-200 mt-1 truncate text-center">
                        {sprite.name || sprite.filename}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-teal-200 mb-2">Obstacles</h4>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                  {obstacleSprites.map(sprite => (
                    <div
                      key={sprite.id}
                      draggable
                      onDragStart={() => handleSpriteStart(sprite, 'obstacle')}
                      className="cursor-grab active:cursor-grabbing p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded transition-colors"
                    >
                      <img
                        src={sprite.data}
                        alt={sprite.filename}
                        className="w-full h-12 object-contain"
                      />
                      <p className="text-xs text-teal-200 mt-1 truncate text-center">
                        {sprite.name || sprite.filename}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Properties Panel */}
            {selectedObject && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-white">⚙️ Properties</h3>
                  <button
                    onClick={handleDeleteObject}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-teal-200">Type</label>
                    <select
                      value={selectedObject.objectType}
                      onChange={(e) => updateObjectProperty('objectType', e.target.value)}
                      className="w-full px-2 py-1 bg-black/30 border border-white/20 rounded text-white text-sm"
                    >
                      <option value="platform">Platform</option>
                      <option value="obstacle">Obstacle</option>
                      <option value="decoration">Decoration</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-teal-200">X Position</label>
                      <input
                        type="number"
                        value={selectedObject.xPosition}
                        onChange={(e) => updateObjectProperty('xPosition', parseInt(e.target.value))}
                        className="w-full px-2 py-1 bg-black/30 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-teal-200">Y Position</label>
                      <input
                        type="number"
                        value={selectedObject.yPosition}
                        onChange={(e) => updateObjectProperty('yPosition', parseInt(e.target.value))}
                        className="w-full px-2 py-1 bg-black/30 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-teal-200">Width</label>
                      <input
                        type="number"
                        value={selectedObject.width}
                        onChange={(e) => updateObjectProperty('width', parseInt(e.target.value))}
                        className="w-full px-2 py-1 bg-black/30 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-teal-200">Height</label>
                      <input
                        type="number"
                        value={selectedObject.height}
                        onChange={(e) => updateObjectProperty('height', parseInt(e.target.value))}
                        className="w-full px-2 py-1 bg-black/30 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-teal-200">Z-Index (Layer)</label>
                    <input
                      type="number"
                      value={selectedObject.zIndex}
                      onChange={(e) => updateObjectProperty('zIndex', parseInt(e.target.value))}
                      className="w-full px-2 py-1 bg-black/30 border border-white/20 rounded text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-teal-200">Sprite</label>
                    <div className="text-xs text-white bg-black/30 px-2 py-1 rounded border border-white/20">
                      {selectedObject.spriteFilename}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
