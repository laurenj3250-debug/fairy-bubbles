import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import CrumpetSVG from "@/components/CrumpetSVG";
import { ParticleEffects } from "@/components/ParticleEffects";

const MUSHROOM_SPRITE = [
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,1,2,2,3,2,2,2,1,0,0],
  [0,1,2,2,3,2,2,3,2,2,1,0],
  [0,1,2,3,2,2,2,2,3,2,1,0],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,1,4,4,4,4,1,0,0,0],
  [0,0,0,1,4,4,4,4,1,0,0,0],
  [0,0,0,1,4,4,4,4,1,0,0,0],
  [0,0,0,0,1,4,4,1,0,0,0,0],
  [0,0,0,0,0,1,1,0,0,0,0,0],
];

const MUSHROOM_COLORS = {
  0: 'transparent',
  1: '#8B4513', // brown outline
  2: '#FF6B9D', // pink cap
  3: '#FFF', // white spots
  4: '#F5E6D3', // cream stem
};

const FLOWER_SPRITE = [
  [0,0,1,1,0,0,1,1,0,0],
  [0,1,2,2,1,1,2,2,1,0],
  [1,2,2,2,2,2,2,2,2,1],
  [0,1,2,2,3,3,2,2,1,0],
  [0,0,1,3,3,3,3,1,0,0],
  [0,0,0,1,4,4,1,0,0,0],
  [0,0,0,1,4,4,1,0,0,0],
  [0,0,0,1,4,4,1,0,0,0],
  [0,0,1,5,5,5,5,1,0,0],
  [0,1,5,5,5,5,5,5,1,0],
];

const FLOWER_COLORS = {
  0: 'transparent',
  1: '#8B4513',
  2: '#FF69B4', // pink petals
  3: '#FFD700', // yellow center
  4: '#90EE90', // green stem
  5: '#228B22', // dark green leaves
};

// Pixel sprite renderer component
function PixelSprite({
  sprite,
  colors,
  scale = 2,
  className = "",
  style = {}
}: {
  sprite: number[][],
  colors: Record<number, string>,
  scale?: number,
  className?: string,
  style?: React.CSSProperties
}) {
  return (
    <div className={className} style={{ ...style, imageRendering: 'pixelated' }}>
      {sprite.map((row, y) => (
        <div key={y} style={{ display: 'flex', height: `${scale}px` }}>
          {row.map((pixel, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                width: `${scale}px`,
                height: `${scale}px`,
                backgroundColor: colors[pixel],
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Wonderland() {
  const [crumpetPos, setCrumpetPos] = useState({ x: 50, y: 50 });
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isWalking, setIsWalking] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(0); // 0-100 (day cycle)
  const [isJumping, setIsJumping] = useState(false);
  const [jumpPhase, setJumpPhase] = useState<'none' | 'squash' | 'air' | 'land'>('none');
  const [expression, setExpression] = useState<'normal' | 'happy' | 'sleepy' | 'excited' | 'surprised'>('normal');
  const [particles, setParticles] = useState<{type: 'hearts' | 'sparkles' | 'dust', x: number, y: number, active: boolean}[]>([]);

  // Jump animation
  const performJump = () => {
    if (isJumping) return;
    setIsJumping(true);

    // Squash
    setJumpPhase('squash');
    setParticles([{ type: 'dust', x: crumpetPos.x, y: crumpetPos.y + 10, active: true }]);

    setTimeout(() => {
      // Jump up
      setJumpPhase('air');
      setCrumpetPos(prev => ({ ...prev, y: Math.max(10, prev.y - 15) }));

      setTimeout(() => {
        // Land squash
        setJumpPhase('land');
        setParticles([{ type: 'dust', x: crumpetPos.x, y: crumpetPos.y + 10, active: true }]);

        setTimeout(() => {
          setJumpPhase('none');
          setIsJumping(false);
          setParticles([]);
        }, 100);
      }, 400);
    }, 100);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 5;
      let newX = crumpetPos.x;
      let newY = crumpetPos.y;

      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newY = Math.max(10, crumpetPos.y - speed);
          setIsWalking(true);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newY = Math.min(90, crumpetPos.y + speed);
          setIsWalking(true);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newX = Math.max(5, crumpetPos.x - speed);
          setDirection('left');
          setIsWalking(true);
          setParticles([{ type: 'dust', x: crumpetPos.x, y: crumpetPos.y + 8, active: true }]);
          setTimeout(() => setParticles([]), 500);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newX = Math.min(95, crumpetPos.x + speed);
          setDirection('right');
          setIsWalking(true);
          setParticles([{ type: 'dust', x: crumpetPos.x, y: crumpetPos.y + 8, active: true }]);
          setTimeout(() => setParticles([]), 500);
          break;
        case ' ':
          e.preventDefault();
          performJump();
          break;
        case '1':
          setExpression('normal');
          break;
        case '2':
          setExpression('happy');
          setParticles([{ type: 'hearts', x: crumpetPos.x, y: crumpetPos.y - 5, active: true }]);
          setTimeout(() => setParticles([]), 1000);
          break;
        case '3':
          setExpression('sleepy');
          break;
        case '4':
          setExpression('excited');
          setParticles([{ type: 'sparkles', x: crumpetPos.x, y: crumpetPos.y, active: true }]);
          setTimeout(() => setParticles([]), 1000);
          break;
        case '5':
          setExpression('surprised');
          break;
      }

      setCrumpetPos({ x: newX, y: newY });
    };

    const handleKeyUp = () => {
      setIsWalking(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [crumpetPos, isJumping]);

  // Day/night cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(prev => (prev + 0.1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Sky color based on time of day
  const getSkyGradient = () => {
    if (timeOfDay < 25) {
      // Dawn
      return 'linear-gradient(to bottom, #FFB6D9, #FFC9E3, #FFE5F1)';
    } else if (timeOfDay < 50) {
      // Day
      return 'linear-gradient(to bottom, #87CEEB, #B0E0E6, #E0F6FF)';
    } else if (timeOfDay < 75) {
      // Dusk
      return 'linear-gradient(to bottom, #FF69B4, #FF8DC7, #FFB6D9)';
    } else {
      // Night
      return 'linear-gradient(to bottom, #191970, #483D8B, #6A5ACD)';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: getSkyGradient(),
      transition: 'background 2s ease',
      position: 'relative',
      overflow: 'hidden',
      paddingBottom: '80px',
    }}>
      {/* Stars at night */}
      {timeOfDay > 75 && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '2px',
                height: '2px',
                background: 'white',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                animation: `twinkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                opacity: Math.random(),
              }}
            />
          ))}
        </div>
      )}

      {/* Sun/Moon */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: timeOfDay > 50 && timeOfDay < 75
          ? '#FFA500' // Sunset orange
          : timeOfDay >= 75
            ? '#F0E68C' // Moon yellow
            : '#FFD700', // Sun gold
        boxShadow: `0 0 40px ${timeOfDay >= 75 ? '#F0E68C' : '#FFD700'}`,
        transition: 'all 2s ease',
      }} />

      {/* Floating clouds */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${10 + i * 15}%`,
            left: `${20 + i * 30}%`,
            animation: `float-cloud ${20 + i * 5}s linear infinite`,
          }}
        >
          <div style={{
            width: '80px',
            height: '30px',
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '50px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              top: '-15px',
              left: '10px',
            }} />
            <div style={{
              position: 'absolute',
              width: '50px',
              height: '35px',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              top: '-10px',
              right: '10px',
            }} />
          </div>
        </div>
      ))}

      {/* Ground */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: 0,
        right: 0,
        height: '200px',
        background: 'linear-gradient(to bottom, #90EE90, #228B22)',
      }}>
        {/* Grass pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 10px,
            rgba(34, 139, 34, 0.3) 10px,
            rgba(34, 139, 34, 0.3) 11px
          )`,
        }} />
      </div>

      {/* Giant Mushrooms */}
      <PixelSprite
        sprite={MUSHROOM_SPRITE}
        colors={MUSHROOM_COLORS}
        scale={4}
        style={{
          position: 'absolute',
          left: '15%',
          bottom: '160px',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        }}
      />
      <PixelSprite
        sprite={MUSHROOM_SPRITE}
        colors={MUSHROOM_COLORS}
        scale={5}
        style={{
          position: 'absolute',
          left: '75%',
          bottom: '150px',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        }}
      />

      {/* Flowers */}
      {[
        { left: '30%', bottom: '140px', scale: 2 },
        { left: '45%', bottom: '135px', scale: 2.5 },
        { left: '60%', bottom: '130px', scale: 2 },
        { left: '85%', bottom: '145px', scale: 2.3 },
      ].map((flower, i) => (
        <PixelSprite
          key={i}
          sprite={FLOWER_SPRITE}
          colors={FLOWER_COLORS}
          scale={flower.scale}
          style={{
            position: 'absolute',
            left: flower.left,
            bottom: flower.bottom,
            animation: `sway ${2 + i * 0.5}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* Crumpet */}
      <div style={{
        position: 'absolute',
        left: `${crumpetPos.x}%`,
        top: `${crumpetPos.y}%`,
        transform: `translate(-50%, -50%) scaleX(${direction === 'left' ? -1 : 1})`,
        transition: 'left 0.2s, top 0.2s',
        zIndex: 100,
      }}>
        <div style={{ position: 'relative' }}>
          {/* Whiskers */}
          <div style={{
            position: 'absolute',
            left: '-25px',
            top: '55px',
            width: '30px',
            height: '1.5px',
            background: '#8B4513',
            transform: 'rotate(-15deg)',
          }} />
          <div style={{
            position: 'absolute',
            left: '-25px',
            top: '62px',
            width: '30px',
            height: '1.5px',
            background: '#8B4513',
          }} />
          <div style={{
            position: 'absolute',
            left: '-25px',
            top: '69px',
            width: '30px',
            height: '1.5px',
            background: '#8B4513',
            transform: 'rotate(15deg)',
          }} />

          <div style={{
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))',
            animation: isWalking && !isJumping ? 'walk 0.4s steps(2) infinite' : !isJumping ? 'idle 2s ease-in-out infinite, blink 4s infinite' : 'none',
            transform:
              jumpPhase === 'squash' ? 'scaleY(0.7) scaleX(1.3)' :
              jumpPhase === 'air' ? 'scaleY(1.2) scaleX(0.9)' :
              jumpPhase === 'land' ? 'scaleY(0.8) scaleX(1.2)' :
              'scaleY(1) scaleX(1)',
            transition: 'transform 0.1s ease-out',
          }}>
            <CrumpetSVG
              pixelSize={1.8}
              crisp={true}
              dropShadow={false}
              expression={expression}
              showTail={true}
              tailWag={isWalking}
              earTwitch={!isWalking && !isJumping}
            />
          </div>

          {/* Particle Effects */}
          {particles.map((particle, idx) => (
            <ParticleEffects
              key={idx}
              type={particle.type}
              active={particle.active}
              x={particle.x}
              y={particle.y}
              count={particle.type === 'hearts' ? 3 : particle.type === 'sparkles' ? 5 : 4}
            />
          ))}

          {/* Whiskers (right side) */}
          <div style={{
            position: 'absolute',
            right: '-25px',
            top: '55px',
            width: '30px',
            height: '1.5px',
            background: '#8B4513',
            transform: 'rotate(15deg) scaleX(-1)',
          }} />
          <div style={{
            position: 'absolute',
            right: '-25px',
            top: '62px',
            width: '30px',
            height: '1.5px',
            background: '#8B4513',
            transform: 'scaleX(-1)',
          }} />
          <div style={{
            position: 'absolute',
            right: '-25px',
            top: '69px',
            width: '30px',
            height: '1.5px',
            background: '#8B4513',
            transform: 'rotate(-15deg) scaleX(-1)',
          }} />
        </div>
      </div>

      {/* UI Overlay */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 1000,
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '16px',
          border: '3px solid #FF69B4',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            background: 'linear-gradient(135deg, #FF69B4, #FFB6D9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
          }}>
            ✨ Crumpet's Wonderland ✨
          </h2>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.6',
          }}>
            <strong>Movement:</strong> Arrow keys or WASD<br/>
            <strong>Jump:</strong> Spacebar<br/>
            <strong>Expressions:</strong> 1=Normal, 2=Happy💖, 3=Sleepy, 4=Excited✨, 5=Surprised
          </p>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes float-cloud {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }

        @keyframes sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }

        @keyframes walk {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }

        @keyframes idle {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.02); }
        }

        @keyframes blink {
          0%, 90%, 100% { opacity: 1; }
          92%, 96% { opacity: 1; }
          94% {
            filter: brightness(0.8);
          }
        }

        @keyframes tail-wag {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }

        @keyframes ear-twitch {
          0%, 90%, 100% { transform: translateY(0); }
          93%, 97% { transform: translateY(-1px); }
        }
      `}</style>
    </div>
  );
}
