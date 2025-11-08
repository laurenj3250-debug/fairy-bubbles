import { useState, useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Biome {
  id: number;
  name: string;
  description: string;
  backgroundSprite: string | null;
}

interface PlayerPosition {
  x: number;
  y: number;
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

  const [playerPos, setPlayerPos] = useState<PlayerPosition>({ x: 400, y: 500 });
  const [isExploring, setIsExploring] = useState(true);
  const [eventResult, setEventResult] = useState<EventResult | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [hasTriggeredEvent, setHasTriggeredEvent] = useState(false);

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

  // Trigger event after some movement
  useEffect(() => {
    if (!hasTriggeredEvent && moveCount >= 5) {
      setHasTriggeredEvent(true);
      useRunMutation.mutate();
    }
  }, [moveCount, hasTriggeredEvent]);

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isExploring) return;

    const speed = 20;
    setPlayerPos(prev => {
      let newPos = { ...prev };

      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newPos.y = Math.max(100, prev.y - speed);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newPos.y = Math.min(550, prev.y + speed);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newPos.x = Math.max(50, prev.x - speed);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newPos.x = Math.min(750, prev.x + speed);
          break;
        default:
          return prev;
      }

      setMoveCount(c => c + 1);
      return newPos;
    });
  }, [isExploring]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{biome?.name || 'Exploring...'}</h1>
            <p className="text-green-200 text-sm">Use arrow keys or WASD to move</p>
          </div>
          <button
            onClick={() => navigate('/outside-world')}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg border border-red-400/50"
          >
            Exit Exploration
          </button>
        </div>

        {/* Game World */}
        <div className="relative bg-gradient-to-b from-sky-300 to-green-600 rounded-lg border-4 border-green-700 overflow-hidden"
             style={{ width: '800px', height: '600px', margin: '0 auto' }}>

          {/* Background Layer */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-700/50 to-green-900/50" />

          {/* Foreground Elements (Trees, Rocks, etc) */}
          <div className="absolute bottom-20 left-40 text-6xl">🌲</div>
          <div className="absolute bottom-32 left-80 text-7xl">🌳</div>
          <div className="absolute bottom-16 right-60 text-6xl">🌲</div>
          <div className="absolute bottom-40 right-32 text-5xl">🪨</div>
          <div className="absolute bottom-24 left-60 text-4xl">🌿</div>
          <div className="absolute bottom-20 right-80 text-4xl">🍄</div>
          <div className="absolute top-32 left-32 text-5xl">🌸</div>
          <div className="absolute top-40 right-40 text-6xl">🌲</div>

          {/* Player Character */}
          <div
            className="absolute transition-all duration-200"
            style={{
              left: `${playerPos.x}px`,
              top: `${playerPos.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="text-5xl">🧚</div>
          </div>

          {/* Movement Progress */}
          {isExploring && !hasTriggeredEvent && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-6 py-3 rounded-full">
              <div className="text-sm text-green-900 font-semibold">
                Exploring... ({moveCount}/5 moves)
              </div>
            </div>
          )}

          {/* Event Result Overlay */}
          {eventResult && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-8 max-w-md text-center border-4 border-white/30">
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
        <div className="mt-4 text-center text-green-200 text-sm">
          Move your fairy around to explore the {biome?.name}. An event will trigger after 5 moves!
        </div>
      </div>
    </div>
  );
}
