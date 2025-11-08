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

  const GROUND_Y = 404; // Ground level (bottom position)
  const PLAYER_SIZE = 50;
  const GRAVITY = 0.8;
  const JUMP_STRENGTH = -15;

  const [playerX, setPlayerX] = useState(100);
  const [playerY, setPlayerY] = useState(GROUND_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isExploring, setIsExploring] = useState(true);
  const [eventResult, setEventResult] = useState<EventResult | null>(null);
  const [collectedObjects, setCollectedObjects] = useState<Set<string>>(new Set());
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const END_ZONE_X = 1500; // End of level position

  // Obstacles to jump over
  const obstacles = [
    { x: 300, width: 60, height: 50, emoji: '🪵', name: 'Log' },
    { x: 700, width: 80, height: 60, emoji: '🪨', name: 'Boulder' },
    { x: 1100, width: 50, height: 45, emoji: '🌳', name: 'Stump' },
    { x: 1500, width: 70, height: 55, emoji: '🪵', name: 'Fallen Tree' },
  ];

  // Platforms at different heights
  const platforms = [
    { x: 450, y: 340, width: 120, height: 20 },
    { x: 900, y: 360, width: 100, height: 20 },
    { x: 1300, y: 350, width: 110, height: 20 },
  ];

  // Collectible items scattered throughout the level
  const [objects] = useState<InteractiveObject[]>([
    { id: 'berry1', x: 250, emoji: '🫐', name: 'Forest Berry', size: 40 },
    { id: 'crystal1', x: 500, emoji: '💎', name: 'Crystal Shard', size: 45 },
    { id: 'coin1', x: 750, emoji: '🪙', name: 'Gold Coin', size: 40 },
    { id: 'flower1', x: 950, emoji: '🌸', name: 'Magic Blossom', size: 40 },
    { id: 'coin2', x: 1150, emoji: '🪙', name: 'Gold Coin', size: 40 },
    { id: 'sparkles1', x: 1350, emoji: '✨', name: 'Stardust', size: 40 },
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

  // Physics update - gravity and jumping
  useEffect(() => {
    if (!isExploring || eventResult) return;

    const interval = setInterval(() => {
      setVelocityY(prevVel => {
        const newVel = prevVel + GRAVITY;
        return newVel;
      });

      setPlayerY(prevY => {
        const newY = prevY + velocityY;

        // Check platform collisions
        let onPlatform = false;
        for (const platform of platforms) {
          if (
            playerX + 25 > platform.x &&
            playerX - 25 < platform.x + platform.width &&
            prevY >= platform.y - 50 &&
            newY <= platform.y &&
            velocityY >= 0
          ) {
            onPlatform = true;
            setVelocityY(0);
            setIsJumping(false);
            return platform.y - 50;
          }
        }

        // Ground collision
        if (newY >= GROUND_Y) {
          setVelocityY(0);
          setIsJumping(false);
          return GROUND_Y;
        }

        return newY;
      });
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, [isExploring, eventResult, velocityY, playerX]);

  // Check if player reached end zone
  useEffect(() => {
    if (!isExploring || eventResult || hasReachedEnd) return;

    if (playerX >= END_ZONE_X) {
      setHasReachedEnd(true);
      // Trigger encounter at the end
      useRunMutation.mutate();
    }
  }, [playerX, isExploring, eventResult, hasReachedEnd, useRunMutation]);

  // Auto-collect items as player passes them
  useEffect(() => {
    for (const obj of objects) {
      if (collectedObjects.has(obj.id)) continue;

      const distance = Math.abs(playerX - obj.x);
      if (distance < 50) {
        setCollectedObjects(prev => new Set(prev).add(obj.id));
      }
    }
  }, [playerX, objects, collectedObjects]);


  // Keyboard controls - movement and jumping
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isExploring) return;

    const speed = 15;

    switch(e.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
      case ' ':
        // Prevent page scrolling
        e.preventDefault();
        break;
    }

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
        setPlayerX(prev => Math.min(1550, prev + speed));
        setFacingRight(true);
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        // Jump
        if (!isJumping) {
          setVelocityY(JUMP_STRENGTH);
          setIsJumping(true);
        }
        break;
    }
  }, [isExploring, isJumping]);

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
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-800 to-purple-700 p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-purple-100">{biome?.name || 'Exploring...'}</h1>
            <p className="text-purple-300 text-sm">← → to move • SPACE or W to jump • Reach the end to find a creature!</p>
          </div>
          <button
            onClick={() => navigate('/outside-world')}
            className="bg-red-500/30 hover:bg-red-500/50 text-red-100 px-4 py-2 rounded-lg border border-red-300"
          >
            Exit Exploration
          </button>
        </div>

        {/* Game Scene */}
        <div className="relative rounded-lg border-4 border-purple-500/50 overflow-hidden shadow-2xl"
             style={{ width: '1600px', height: '500px', margin: '0 auto' }}>

          {/* Background Image or Gradient */}
          {biome?.backgroundSprite ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${biome.backgroundSprite})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-purple-600 via-pink-400 to-teal-400" />
          )}

          {/* Floating Fireflies / Magic Particles - MORE */}
          <div className="absolute top-20 left-40 text-2xl animate-pulse">✨</div>
          <div className="absolute top-60 left-200 text-xl animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
          <div className="absolute top-40 right-60 text-2xl animate-pulse" style={{ animationDelay: '1s' }}>✨</div>
          <div className="absolute top-80 right-200 text-xl animate-pulse" style={{ animationDelay: '1.5s' }}>💫</div>
          <div className="absolute top-100 left-500 text-xl animate-pulse" style={{ animationDelay: '2s' }}>✨</div>
          <div className="absolute top-50 right-400 text-2xl animate-pulse" style={{ animationDelay: '0.8s' }}>⭐</div>
          <div className="absolute top-30 left-700 text-xl animate-pulse" style={{ animationDelay: '1.2s' }}>💫</div>
          <div className="absolute top-70 right-500 text-2xl animate-pulse" style={{ animationDelay: '0.3s' }}>✨</div>
          <div className="absolute top-90 left-900 text-xl animate-pulse" style={{ animationDelay: '1.7s' }}>⭐</div>
          <div className="absolute top-110 right-700 text-2xl animate-pulse" style={{ animationDelay: '0.9s' }}>💫</div>
          <div className="absolute top-35 left-1100 text-xl animate-pulse" style={{ animationDelay: '1.4s' }}>✨</div>
          <div className="absolute top-65 right-900 text-2xl animate-pulse" style={{ animationDelay: '0.6s' }}>⭐</div>

          {/* Distant Magical Mountains */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-700 to-purple-900 opacity-50"
               style={{ clipPath: 'polygon(0 100%, 0 40%, 20% 60%, 40% 30%, 60% 50%, 80% 20%, 100% 50%, 100% 100%)' }} />

          {/* Background Trees (Far Distance) - very faded */}
          <div className="absolute bottom-35 left-100 text-4xl opacity-20" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.3))' }}>🌲</div>
          <div className="absolute bottom-38 left-300 text-5xl opacity-20" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.3))' }}>🌳</div>
          <div className="absolute bottom-33 left-500 text-4xl opacity-20" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.3))' }}>🌲</div>
          <div className="absolute bottom-36 left-800 text-5xl opacity-20" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.3))' }}>🌳</div>
          <div className="absolute bottom-34 left-1100 text-4xl opacity-20" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.3))' }}>🌲</div>
          <div className="absolute bottom-37 right-200 text-5xl opacity-20" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.3))' }}>🌳</div>

          {/* Middle Ground Trees (Background) with glow - closer but still background */}
          <div className="absolute bottom-28 left-60 text-5xl opacity-40" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}>🌲</div>
          <div className="absolute bottom-32 left-250 text-6xl opacity-40" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}>🌳</div>
          <div className="absolute bottom-30 left-450 text-5xl opacity-40" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}>🌲</div>
          <div className="absolute bottom-33 left-700 text-6xl opacity-40" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}>🌳</div>
          <div className="absolute bottom-29 left-950 text-5xl opacity-40" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}>🌲</div>
          <div className="absolute bottom-31 left-1200 text-6xl opacity-40" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}>🌳</div>
          <div className="absolute bottom-28 right-100 text-5xl opacity-40" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}>🌲</div>

          {/* Decorative Background Flowers and Mushrooms */}
          <div className="absolute bottom-24 left-150 text-2xl opacity-50">🌸</div>
          <div className="absolute bottom-25 left-350 text-2xl opacity-50">🍄</div>
          <div className="absolute bottom-23 left-550 text-2xl opacity-50">🌺</div>
          <div className="absolute bottom-26 left-750 text-2xl opacity-50">🌼</div>
          <div className="absolute bottom-24 left-1000 text-2xl opacity-50">🍄</div>
          <div className="absolute bottom-25 left-1250 text-2xl opacity-50">🌸</div>
          <div className="absolute bottom-23 right-150 text-2xl opacity-50">🌺</div>
          <div className="absolute bottom-26 right-350 text-2xl opacity-50">🍄</div>

          {/* Enchanted Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-purple-800 to-indigo-950" />

          {/* Magical Grass on ground */}
          <div className="absolute bottom-16 left-0 right-0 h-8 flex items-end justify-around px-4">
            {[...Array(50)].map((_, i) => (
              <span key={i} className="text-teal-400 text-xl opacity-60" style={{ filter: 'drop-shadow(0 0 3px rgba(45, 212, 191, 0.5))' }}>🌿</span>
            ))}
          </div>

          {/* Collectible Items */}
          {objects.map(obj => (
            <div
              key={obj.id}
              className="absolute transition-all duration-300"
              style={{
                left: `${obj.x}px`,
                bottom: '96px',
                fontSize: `${obj.size}px`,
                filter: collectedObjects.has(obj.id)
                  ? 'grayscale(100%) opacity(0%)'
                  : 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))',
                animation: !collectedObjects.has(obj.id) ? 'pulse 2s ease-in-out infinite' : 'none',
                opacity: collectedObjects.has(obj.id) ? 0 : 1,
                transform: collectedObjects.has(obj.id) ? 'scale(0.5) translateY(-50px)' : 'scale(1)',
                transition: 'all 0.5s ease-out'
              }}
            >
              {obj.emoji}
            </div>
          ))}

          {/* End Zone Marker */}
          <div
            className="absolute"
            style={{
              left: `${END_ZONE_X}px`,
              bottom: '0px',
              width: '100px',
              height: '500px',
              background: 'linear-gradient(90deg, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.3) 50%, rgba(236, 72, 153, 0.5) 100%)',
              borderLeft: '4px solid rgba(236, 72, 153, 0.8)',
              boxShadow: '0 0 40px rgba(236, 72, 153, 0.6)',
            }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-2xl rotate-90 whitespace-nowrap">
              ⭐ FINISH ⭐
            </div>
          </div>

          {/* Obstacles to jump over */}
          {obstacles.map((obstacle, i) => (
            <div
              key={`obstacle-${i}`}
              className="absolute"
              style={{
                left: `${obstacle.x}px`,
                bottom: '96px',
                fontSize: '60px',
              }}
            >
              {obstacle.emoji}
            </div>
          ))}

          {/* Platforms */}
          {platforms.map((platform, i) => (
            <div
              key={`platform-${i}`}
              className="absolute bg-gradient-to-b from-purple-600 to-purple-800 rounded-lg border-2 border-purple-400/50"
              style={{
                left: `${platform.x}px`,
                bottom: `${500 - platform.y}px`,
                width: `${platform.width}px`,
                height: `${platform.height}px`,
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
              }}
            />
          ))}

          {/* Player Character */}
          <div
            className="absolute transition-all duration-100"
            style={{
              left: `${playerX}px`,
              bottom: `${500 - playerY}px`,
              transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)'
            }}
          >
            <div className="text-6xl">🧚</div>
          </div>

          {/* Progress Indicator */}
          {isExploring && !eventResult && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 rounded-full shadow-2xl border-2 border-white/50">
              <div className="text-sm text-white font-bold flex items-center gap-4">
                <span>🪙 Items: {collectedObjects.size}/{objects.length}</span>
                <span className="border-l border-white/30 pl-4">
                  {playerX >= END_ZONE_X ? '⭐ REACHED END!' : `📍 Distance: ${Math.max(0, Math.floor((END_ZONE_X - playerX) / 100))}m`}
                </span>
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
                    <div className="text-6xl mb-4">🎯</div>
                    <h2 className="text-3xl font-bold text-white mb-3">You reached the end!</h2>
                    <p className="text-xl text-white mb-2">
                      A wild <span className="font-bold text-yellow-300">Lv.{eventResult.encounter.level} {eventResult.encounter.speciesName}</span> appeared!
                    </p>
                    <p className="text-purple-200 text-sm mb-6">
                      Battle and attempt to capture it! Success depends on your skills and equipped items.
                    </p>
                    <button
                      onClick={handleExitExploration}
                      className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600 transition-colors"
                    >
                      Enter Battle →
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-purple-200">
          <p className="font-bold text-lg">Platform through the mystical {biome?.name} to reach the end!</p>
          <p className="text-sm text-purple-300 mt-1">Collect items along the way • Jump over obstacles • Reach the FINISH line to encounter a creature!</p>
        </div>
      </div>
    </div>
  );
}
