import { useState, useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Biome {
  id: number;
  name: string;
  description: string;
  backgroundSprite: string | null;
}

interface InteractiveObject {
  id: string;
  x: number;
  emoji: string;
  name: string;
  size: number;
}

interface EventResult {
  eventType: 'loot' | 'encounter';
  loot?: {
    itemId: number;
    itemName: string;
    quantity: number;
    rarity: string;
  };
  encounter?: {
    encounterId: number;
    speciesId: number;
    speciesName: string;
    level: number;
  };
}

export default function BiomeExploration() {
  const params = useParams();
  const biomeId = parseInt(params.biomeId || '0');
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const GROUND_Y = 420; // Ground level
  const PLAYER_SIZE = 50;

  const [playerX, setPlayerX] = useState(100);
  const [facingRight, setFacingRight] = useState(true);
  const [isExploring, setIsExploring] = useState(true);
  const [eventResult, setEventResult] = useState<EventResult | null>(null);
  const [interactedObjects, setInteractedObjects] = useState<Set<string>>(new Set());

  // Interactive objects in the scene
  const [objects] = useState<InteractiveObject[]>([
    { id: 'tree1', x: 200, emoji: '🌲', name: 'Pine Tree', size: 80 },
    { id: 'rock1', x: 350, emoji: '🪨', name: 'Rock', size: 50 },
    { id: 'bush1', x: 500, emoji: '🌿', name: 'Bush', size: 60 },
    { id: 'mushroom1', x: 650, emoji: '🍄', name: 'Mushroom', size: 45 },
    { id: 'tree2', x: 800, emoji: '🌳', name: 'Oak Tree', size: 90 },
    { id: 'flower1', x: 950, emoji: '🌸', name: 'Flowers', size: 40 },
  ]);

  // Fetch biome data
  const { data: biome } = useQuery<Biome>({
    queryKey: [`/api/biomes/${biomeId}`],
  });

  // Use run mutation (triggers the event)
  const useRunMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/runs/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biomeId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to use run');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setEventResult(data);
      setIsExploring(false);
      queryClient.invalidateQueries({ queryKey: ['/api/daily-progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/encounters'] });
    },
  });

  // Check if player is near any object
  const checkNearbyObjects = useCallback(() => {
    for (const obj of objects) {
      if (interactedObjects.has(obj.id)) continue;

      const distance = Math.abs(playerX - obj.x);
      if (distance < 80) {
        return obj;
      }
    }
    return null;
  }, [playerX, objects, interactedObjects]);

  // Interact with object
  const handleInteract = useCallback((objectId: string) => {
    if (interactedObjects.has(objectId)) return;

    setInteractedObjects(prev => new Set(prev).add(objectId));

    // Trigger event after interacting with 3rd object
    if (interactedObjects.size >= 2) {
      useRunMutation.mutate();
    }
  }, [interactedObjects, useRunMutation]);

  // Keyboard controls - left/right only
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isExploring) return;

    const speed = 15;

    switch(e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        setPlayerX(prev => Math.max(50, prev - speed));
        setFacingRight(false);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        setPlayerX(prev => Math.min(1050, prev + speed));
        setFacingRight(true);
        break;
      case ' ':
      case 'e':
      case 'E':
        // Space or E to interact
        const nearbyObj = checkNearbyObjects();
        if (nearbyObj) {
          handleInteract(nearbyObj.id);
        }
        break;
    }
  }, [isExploring, checkNearbyObjects, handleInteract]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleExitExploration = () => {
    if (eventResult?.eventType === 'encounter' && eventResult.encounter) {
      navigate(`/combat/${eventResult.encounter.encounterId}`);
    } else {
      navigate('/outside-world');
    }
  };

  const nearbyObject = checkNearbyObjects();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-200 to-green-200 p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-900">{biome?.name || 'Exploring...'}</h1>
            <p className="text-green-700 text-sm">← → to move • SPACE or E to interact</p>
          </div>
          <button
            onClick={() => navigate('/outside-world')}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-700 px-4 py-2 rounded-lg border border-red-400"
          >
            Exit Exploration
          </button>
        </div>

        {/* Game Scene */}
        <div className="relative rounded-lg border-4 border-green-800 overflow-hidden shadow-2xl"
             style={{ width: '1200px', height: '500px', margin: '0 auto' }}>

          {/* Sky Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200" />

          {/* Distant Mountains */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-green-600 to-green-700 opacity-40"
               style={{ clipPath: 'polygon(0 100%, 0 40%, 20% 60%, 40% 30%, 60% 50%, 80% 20%, 100% 50%, 100% 100%)' }} />

          {/* Middle Ground Trees (Background) */}
          <div className="absolute bottom-28 left-20 text-4xl opacity-50">🌲</div>
          <div className="absolute bottom-32 right-40 text-5xl opacity-50">🌳</div>

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-green-600 to-green-800" />

          {/* Grass on ground */}
          <div className="absolute bottom-16 left-0 right-0 h-8 flex items-end justify-around px-4">
            {[...Array(30)].map((_, i) => (
              <span key={i} className="text-green-700 text-xl opacity-70">🌿</span>
            ))}
          </div>

          {/* Interactive Objects on Ground */}
          {objects.map(obj => (
            <div
              key={obj.id}
              className="absolute cursor-pointer hover:scale-110 transition-transform"
              style={{
                left: `${obj.x}px`,
                bottom: '96px',
                fontSize: `${obj.size}px`,
                filter: interactedObjects.has(obj.id) ? 'grayscale(100%) opacity(50%)' : 'none'
              }}
              onClick={() => handleInteract(obj.id)}
            >
              {obj.emoji}
              {nearbyObject?.id === obj.id && !interactedObjects.has(obj.id) && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white/90 px-3 py-1 rounded-full text-xs font-semibold text-green-900 whitespace-nowrap animate-bounce">
                  Press E ↵
                </div>
              )}
            </div>
          ))}

          {/* Player Character */}
          <div
            className="absolute transition-all duration-200"
            style={{
              left: `${playerX}px`,
              bottom: '96px',
              transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)'
            }}
          >
            <div className="text-6xl">🧚</div>
          </div>

          {/* Progress Indicator */}
          {isExploring && !eventResult && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 px-6 py-3 rounded-full shadow-lg">
              <div className="text-sm text-green-900 font-semibold">
                Explore objects to find something! ({interactedObjects.size}/3 searched)
              </div>
            </div>
          )}

          {/* Event Result Overlay */}
          {eventResult && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-8 max-w-md text-center border-4 border-white/30 shadow-2xl">
                {eventResult.eventType === 'loot' && eventResult.loot && (
                  <>
                    <div className="text-6xl mb-4">🎁</div>
                    <h2 className="text-3xl font-bold text-white mb-3">Loot Found!</h2>
                    <p className="text-xl text-white mb-2">
                      You found <span className="font-bold text-yellow-300">{eventResult.loot.quantity}x {eventResult.loot.itemName}</span>
                    </p>
                    <p className="text-purple-200 text-sm mb-6">
                      Rarity: <span className="capitalize font-semibold">{eventResult.loot.rarity}</span>
                    </p>
                    <button
                      onClick={handleExitExploration}
                      className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-purple-100 transition-colors"
                    >
                      Continue
                    </button>
                  </>
                )}

                {eventResult.eventType === 'encounter' && eventResult.encounter && (
                  <>
                    <div className="text-6xl mb-4">⚔️</div>
                    <h2 className="text-3xl font-bold text-white mb-3">Wild Encounter!</h2>
                    <p className="text-xl text-white mb-6">
                      A wild <span className="font-bold text-yellow-300">Lv.{eventResult.encounter.level} {eventResult.encounter.speciesName}</span> appeared!
                    </p>
                    <button
                      onClick={handleExitExploration}
                      className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600 transition-colors"
                    >
                      Start Battle →
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-green-800">
          <p className="font-semibold">Walk through the {biome?.name} and interact with objects to find items or creatures!</p>
          <p className="text-sm text-green-700 mt-1">Get close to glowing objects and press E or click to investigate</p>
        </div>
      </div>
    </div>
  );
}
