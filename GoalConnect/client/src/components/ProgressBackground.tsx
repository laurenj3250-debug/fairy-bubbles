import { useEffect, useState } from 'react';
import { applyTheme } from '@/themes/config';
import { useBackground } from '@/contexts/BackgroundContext';

interface ProgressBackgroundProps {
  children: React.ReactNode;
}

/**
 * ProgressBackground Component
 *
 * Shows the user's active mountain background or defaults to El Capitan
 */
export function ProgressBackground({ children }: ProgressBackgroundProps) {
  const { activeBackground } = useBackground();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Default to El Capitan if no active background is set
  const defaultImage = '/backgrounds/el-capitan.png';
  const backgroundImage = activeBackground?.backgroundImage || defaultImage;

  // Apply the Granite Monolith theme on mount (could be enhanced to use mountain theme)
  useEffect(() => {
    applyTheme('graniteMonolith');
  }, []);

  // Preload the background image whenever it changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);

    const img = new Image();
    img.onload = () => {
      console.log('[ProgressBackground] Background image loaded:', backgroundImage);
      setImageLoaded(true);
      setImageError(false);
    };
    img.onerror = () => {
      console.error('[ProgressBackground] Failed to load background:', backgroundImage);
      setImageError(true);
      setImageLoaded(false);
    };
    img.src = backgroundImage;
  }, [backgroundImage]);

  return (
    <div className="relative min-h-screen">
      {/* Fallback gradient background */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"
        style={{ opacity: imageError || !imageLoaded ? 0.7 : 0 }}
      />

      {/* Mountain background image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: imageError ? 'none' : `url(${backgroundImage})`,
          opacity: imageLoaded && !imageError ? 0.85 : 0,
          filter: 'brightness(0.9) contrast(1.1)',
          transition: 'opacity 1s ease-in-out'
        }}
      />

      {/* Gradient overlay for readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/40 via-background/50 to-background/60" />

      {/* Subtle topographic texture overlay */}
      <div
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.03) 10px,
            rgba(255, 255, 255, 0.03) 11px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.03) 10px,
            rgba(255, 255, 255, 0.03) 11px
          )`
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
