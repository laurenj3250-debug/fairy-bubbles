import { useMemo, useState } from "react";
import { getTodaysInspiration } from "@/lib/climbingInspiration";
import { Mountain, Lightbulb, Dumbbell, Quote } from "lucide-react";

export function ClimbingInspirationTile() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get today's inspiration content
  const inspiration = useMemo(() => getTodaysInspiration(), []);

  // Get icon based on type
  const getIcon = () => {
    switch (inspiration.type) {
      case 'location':
        return <Mountain className="w-5 h-5" />;
      case 'fact':
        return <Lightbulb className="w-5 h-5" />;
      case 'technique':
        return <Dumbbell className="w-5 h-5" />;
      case 'quote':
        return <Quote className="w-5 h-5" />;
      default:
        return null;
    }
  };

  // Get type label
  const getTypeLabel = () => {
    switch (inspiration.type) {
      case 'location':
        return 'Location Spotlight';
      case 'fact':
        return 'Did You Know?';
      case 'technique':
        return 'Technique Tip';
      case 'quote':
        return 'Daily Inspiration';
      default:
        return '';
    }
  };

  return (
    <div className="card-ice-shelf p-4 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-primary">{getIcon()}</span>
        <h3 className="text-xs font-altitude font-bold uppercase tracking-wider text-muted-foreground">
          {getTypeLabel()}
        </h3>
      </div>

      {/* Image with emoji fallback */}
      <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
        {inspiration.imageUrl && !imageError ? (
          <>
            {/* Loading placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl animate-pulse">{inspiration.emoji}</span>
              </div>
            )}

            {/* Actual image */}
            <img
              src={inspiration.imageUrl}
              alt={inspiration.title}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />

            {/* Gradient overlay for better text readability */}
            {imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            )}
          </>
        ) : (
          /* Emoji fallback if no image or image failed to load */
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">{inspiration.emoji}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h4 className="font-altitude font-bold text-sm text-foreground leading-tight">
          {inspiration.title}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {inspiration.content}
        </p>
      </div>

      {/* Type badge at bottom */}
      <div className="mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground uppercase tracking-wider">
            {inspiration.type}
          </span>
          <span className="text-muted-foreground/60">
            Daily rotation
          </span>
        </div>
      </div>
    </div>
  );
}
