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

interface LevelObject {
  id: number;
  objectType: 'platform' | 'obstacle' | 'decoration';
  spriteFilename: string;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  zIndex: number;
}

interface Obstacle {
  x: number;
  width: number;
  height: number;
  sprite: string;
  name: string;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  sprite?: string;
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
  const [fps, setFps] = useState(0);

  const GROUND_Y = 404; // Ground level (bottom position)
  const PLAYER_SIZE = 50;
  const GRAVITY = 0.8;
  const JUMP_STRENGTH = -15;
  const AUTO_SCROLL_SPEED = 3; // Pixels per frame for auto-scrolling
  const PLAYER_SCREEN_X = 300; // Player stays at this X position on screen

  const [playerX, setPlayerX] = useState(300); // Player world position
  const [cameraX, setCameraX] = useState(0); // Camera offset
  const [playerY, setPlayerY] = useState(GROUND_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isExploring, setIsExploring] = useState(true);
  const [eventResult, setEventResult] = useState<EventResult | null>(null);
  const [collectedObjects, setCollectedObjects] = useState<Set<string>>(new Set());
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const END_ZONE_X = 2500; // End of level position (longer level)

  // Fetch level objects from database
  const { data: levelObjects = [] } = useQuery<LevelObject[]>({
    queryKey: [`/api/biomes/${biomeId}/level-objects`],
    enabled: !!biomeId,
  });

  // Transform level objects into obstacles and platforms
  const obstacles: Obstacle[] = levelObjects
    .filter(obj => obj.objectType === 'obstacle')
    .map(obj => ({
      x: obj.xPosition,
      width: obj.width,
      height: obj.height,
      sprite: `/api/sprites/file/${obj.spriteFilename}`,
      name: obj.spriteFilename,
    }));

  const platforms: Platform[] = levelObjects
    .filter(obj => obj.objectType === 'platform')
    .map(obj => ({
      x: obj.xPosition,
      y: obj.yPosition,
      width: obj.width,
      height: obj.height,
      sprite: `/api/sprites/file/${obj.spriteFilename}`,
    }));

  // Collectible items scattered throughout the level
  const [objects] = useState<InteractiveObject[]>([
    { id: 'berry1', x: 400, emoji: '🫐', name: 'Forest Berry', size: 40 },
    { id: 'crystal1', x: 700, emoji: '💎', name: 'Crystal Shard', size: 45 },
    { id: 'coin1', x: 1000, emoji: '🪙', name: 'Gold Coin', size: 40 },
    { id: 'flower1', x: 1300, emoji: '🌸', name: 'Magic Blossom', size: 40 },
    { id: 'coin2', x: 1600, emoji: '🪙', name: 'Gold Coin', size: 40 },
    { id: 'sparkles1', x: 1900, emoji: '✨', name: 'Stardust', size: 40 },
    { id: 'berry2', x: 2200, emoji: '🫐', name: 'Forest Berry', size: 40 },
    { id: 'crystal2', x: 2400, emoji: '💎', name: 'Crystal Shard', size: 45 },
  ]);

  // Fetch biome data
  const { data: biome } = useQuery<Biome>({
    queryKey: [`/api/biomes/${biomeId}`],
  });

  // Performance optimization: Single animation loop using requestAnimationFrame
  // This replaces the two separate setInterval loops for better performance
  useEffect(() => {
    if (!isExploring || eventResult) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsUpdateTime = 0;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update FPS counter every 500ms
      frameCount++;
      if (currentTime - fpsUpdateTime >= 500) {
        const calculatedFps = Math.round(frameCount * 2); // frames in 0.5s * 2
        setFps(calculatedFps);
        frameCount = 0;
        fpsUpdateTime = currentTime;
      }

      // Auto-scroll camera and player
      setCameraX(prevCamera => {
        const newCamera = prevCamera + AUTO_SCROLL_SPEED;
        setPlayerX(prev => prev + AUTO_SCROLL_SPEED);
        return newCamera;
      });

      // Physics update - run at 60 FPS equivalent timing
      if (deltaTime < 100) { // Skip if frame took too long (tab switch, etc.)
        // Update velocity
        setVelocityY(prevVel => prevVel + GRAVITY);

        // Update position with collision detection
        setPlayerY(prevY => {
          const newY = prevY + velocityY;

          // Only check collisions with nearby platforms (viewport culling)
          const nearbyPlatforms = platforms.filter(platform =>
            Math.abs(platform.x - playerX) < 200 // Only check platforms within 200px
          );

          // Check platform collisions
          for (const platform of nearbyPlatforms) {
            if (
              playerX + 25 > platform.x &&
              playerX - 25 < platform.x + platform.width &&
              prevY >= platform.y - 50 &&
              newY <= platform.y &&
              velocityY >= 0
            ) {
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
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isExploring, eventResult, velocityY, playerX, platforms]);

  // Check if player reached end zone - trigger egg reward
  useEffect(() => {
    if (!isExploring || eventResult || hasReachedEnd) return;

    if (playerX >= END_ZONE_X) {
      setHasReachedEnd(true);
      setIsExploring(false);

      // Calculate egg rarity based on performance
      const itemScore = collectedObjects.size / objects.length;
      let eggRarity: string;
      let eggEmoji: string;
      let creatureName: string | null = null;

      // Random roll with weighting based on items collected
      const roll = Math.random();

      if (itemScore >= 0.8) {
        // 80%+ items collected - better chances
        if (roll < 0.05) {
          eggRarity = 'epic';
          eggEmoji = '🥚✨';
          creatureName = 'Legendary Phoenix';
        } else if (roll < 0.20) {
          eggRarity = 'rare';
          eggEmoji = '🥚💎';
          creatureName = 'Rare Unicorn';
        } else if (roll < 0.50) {
          eggRarity = 'uncommon';
          eggEmoji = '🥚⭐';
          creatureName = 'Uncommon Griffin';
        } else if (roll < 0.85) {
          eggRarity = 'common';
          eggEmoji = '🥚';
          creatureName = 'Forest Sprite';
        } else {
          eggRarity = 'dud';
          eggEmoji = '🥚💔';
          creatureName = null;
        }
      } else if (itemScore >= 0.5) {
        // 50-80% items collected - medium chances
        if (roll < 0.02) {
          eggRarity = 'epic';
          eggEmoji = '🥚✨';
          creatureName = 'Legendary Phoenix';
        } else if (roll < 0.12) {
          eggRarity = 'rare';
          eggEmoji = '🥚💎';
          creatureName = 'Rare Unicorn';
        } else if (roll < 0.40) {
          eggRarity = 'uncommon';
          eggEmoji = '🥚⭐';
          creatureName = 'Uncommon Griffin';
        } else if (roll < 0.80) {
          eggRarity = 'common';
          eggEmoji = '🥚';
          creatureName = 'Forest Sprite';
        } else {
          eggRarity = 'dud';
          eggEmoji = '🥚💔';
          creatureName = null;
        }
      } else {
        // <50% items collected - basic chances
        if (roll < 0.01) {
          eggRarity = 'epic';
          eggEmoji = '🥚✨';
          creatureName = 'Legendary Phoenix';
        } else if (roll < 0.06) {
          eggRarity = 'rare';
          eggEmoji = '🥚💎';
          creatureName = 'Rare Unicorn';
        } else if (roll < 0.25) {
          eggRarity = 'uncommon';
          eggEmoji = '🥚⭐';
          creatureName = 'Uncommon Griffin';
        } else if (roll < 0.70) {
          eggRarity = 'common';
          eggEmoji = '🥚';
          creatureName = 'Forest Sprite';
        } else {
          eggRarity = 'dud';
          eggEmoji = '🥚💔';
          creatureName = null;
        }
      }

      // Set egg result (reusing EventResult structure for now)
      setEventResult({
        eventType: 'loot',
        loot: {
          itemId: 0,
          itemName: eggRarity === 'dud' ? 'Empty Egg' : `${eggEmoji} ${creatureName}`,
          quantity: 1,
          rarity: eggRarity,
        },
      });
    }
  }, [playerX, isExploring, eventResult, hasReachedEnd, collectedObjects, objects.length]);

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

    const speed = 25; // Increased from 15 for faster movement

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
        setPlayerX(prev => Math.max(cameraX + 50, prev - speed)); // Keep ahead of camera
        setFacingRight(false);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        setPlayerX(prev => Math.min(cameraX + 1550, prev + speed)); // Can move ahead
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
  }, [isExploring, isJumping, cameraX]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleExitExploration = () => {
    navigate('/outside-world');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-800 to-purple-700 p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-purple-100">{biome?.name || 'Exploring...'}</h1>
            <p className="text-purple-300 text-sm">← → to move • SPACE or W to jump • Collect items & reach the end for an egg reward!</p>
          </div>
          <div className="flex items-center gap-4">
            {/* FPS Counter */}
            <div className={`px-3 py-1 rounded-lg ${fps > 50 ? 'bg-green-500/30 text-green-200' : fps > 30 ? 'bg-yellow-500/30 text-yellow-200' : 'bg-red-500/30 text-red-200'} border ${fps > 50 ? 'border-green-400' : fps > 30 ? 'border-yellow-400' : 'border-red-400'}`}>
              FPS: {fps}
            </div>
            <button
              onClick={() => navigate('/outside-world')}
              className="bg-red-500/30 hover:bg-red-500/50 text-red-100 px-4 py-2 rounded-lg border border-red-300"
            >
              Exit Exploration
            </button>
          </div>
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

          {/* Performance optimized: CSS-based particle effects */}
          <div className="absolute inset-0 pointer-events-none">
            <style>{`
              @keyframes float-particle {
                0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
                50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
              }
              .particle {
                position: absolute;
                animation: float-particle 3s ease-in-out infinite;
              }
            `}</style>
            {/* Only render a few particles for visual effect */}
            <div className="particle" style={{ top: '20%', left: '15%', animationDelay: '0s' }}>✨</div>
            <div className="particle" style={{ top: '40%', right: '20%', animationDelay: '1s' }}>⭐</div>
            <div className="particle" style={{ top: '60%', left: '50%', animationDelay: '2s' }}>💫</div>
          </div>

          {/* Distant Magical Mountains */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-700 to-purple-900 opacity-50"
               style={{ clipPath: 'polygon(0 100%, 0 40%, 20% 60%, 40% 30%, 60% 50%, 80% 20%, 100% 50%, 100% 100%)' }} />

          {/* Performance optimized: Background decoration using CSS pattern */}
          <div
            className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
            style={{
              background: `
                linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.1) 100%),
                repeating-linear-gradient(90deg, transparent, transparent 200px, rgba(168, 85, 247, 0.05) 200px, rgba(168, 85, 247, 0.05) 220px)
              `,
              maskImage: 'linear-gradient(180deg, transparent 0%, black 100%)'
            }}
          />

          {/* Enchanted Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-purple-800 to-indigo-950" />

          {/* Performance optimized: CSS-based grass pattern */}
          <div
            className="absolute bottom-16 left-0 right-0 h-8"
            style={{
              background: 'repeating-linear-gradient(90deg, rgba(45, 212, 191, 0.3) 0px, transparent 5px, transparent 30px, rgba(45, 212, 191, 0.3) 35px)',
              borderTop: '2px solid rgba(45, 212, 191, 0.2)'
            }}
          />

          {/* Collectible Items */}
          {objects.map(obj => {
            const screenX = obj.x - cameraX;
            if (screenX < -100 || screenX > 1700) return null; // Don't render off-screen
            return (
              <div
                key={obj.id}
                className="absolute transition-all duration-300"
                style={{
                  left: `${screenX}px`,
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
            );
          })}

          {/* End Zone Marker */}
          {(() => {
            const endScreenX = END_ZONE_X - cameraX;
            if (endScreenX < -100 || endScreenX > 1700) return null;
            return (
              <div
                className="absolute"
                style={{
                  left: `${endScreenX}px`,
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
            );
          })()}

          {/* Obstacles to jump over */}
          {obstacles.map((obstacle, i) => {
            const screenX = obstacle.x - cameraX;
            if (screenX < -100 || screenX > 1700) return null;
            return (
              <div
                key={`obstacle-${i}`}
                className="absolute"
                style={{
                  left: `${screenX}px`,
                  bottom: '96px',
                  width: `${obstacle.width}px`,
                  height: `${obstacle.height}px`,
                }}
              >
                {obstacle.sprite ? (
                  <img
                    src={obstacle.sprite}
                    alt={obstacle.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-600 rounded" />
                )}
              </div>
            );
          })}

          {/* Platforms */}
          {platforms.map((platform, i) => {
            const screenX = platform.x - cameraX;
            if (screenX < -150 || screenX > 1750) return null;
            return (
              <div
                key={`platform-${i}`}
                className="absolute rounded-lg border-2 border-purple-400/50"
                style={{
                  left: `${screenX}px`,
                  bottom: `${500 - platform.y}px`,
                  width: `${platform.width}px`,
                  height: `${platform.height}px`,
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
                  background: platform.sprite ? 'transparent' : 'linear-gradient(to bottom, #9333ea, #6b21a8)',
                }}
              >
                {platform.sprite && (
                  <img
                    src={platform.sprite}
                    alt="platform"
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
              </div>
            );
          })}

          {/* Player Character */}
          <div
            className="absolute transition-all duration-100"
            style={{
              left: `${playerX - cameraX}px`,
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

          {/* Egg Result Overlay */}
          {eventResult && eventResult.loot && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-8 max-w-md text-center border-4 border-white/30 shadow-2xl">
                <div className="text-8xl mb-4 animate-bounce">🥚</div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  {eventResult.loot.rarity === 'dud' ? '💔 Oh no!' : '🎉 Egg Found!'}
                </h2>

                {eventResult.loot.rarity === 'dud' ? (
                  <>
                    <p className="text-xl text-white mb-3">
                      The egg didn't hatch... Better luck next time!
                    </p>
                    <p className="text-purple-200 text-sm mb-6">
                      Collect more items during your run for better chances at rare creatures!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl text-white mb-2">
                      You found: <span className="font-bold text-yellow-300">{eventResult.loot.itemName}</span>
                    </p>
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                      eventResult.loot.rarity === 'epic' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse' :
                      eventResult.loot.rarity === 'rare' ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white' :
                      eventResult.loot.rarity === 'uncommon' ? 'bg-gradient-to-r from-blue-400 to-teal-400 text-white' :
                      'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
                    }`}>
                      {eventResult.loot.rarity === 'epic' ? '✨ EPIC ✨' :
                       eventResult.loot.rarity === 'rare' ? '💎 RARE' :
                       eventResult.loot.rarity === 'uncommon' ? '⭐ UNCOMMON' :
                       'COMMON'}
                    </div>
                    <p className="text-purple-200 text-sm mb-6">
                      Items collected: {collectedObjects.size}/{objects.length} • Better performance = Better eggs!
                    </p>
                  </>
                )}

                <button
                  onClick={handleExitExploration}
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-purple-100 transition-colors shadow-lg"
                >
                  Return to Outside World
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-purple-200">
          <p className="font-bold text-lg">Platform through the mystical {biome?.name} to reach the end!</p>
          <p className="text-sm text-purple-300 mt-1">Auto-scrolls forward • Collect items for better egg rewards • Jump over obstacles • Reach FINISH for your egg!</p>
        </div>
      </div>
    </div>
  );
}
