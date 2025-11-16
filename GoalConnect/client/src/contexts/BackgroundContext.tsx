import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface MountainBackground {
  id: number;
  name: string;
  backgroundImage: string;
  themeColors: string;
  isActive: boolean;
  unlocked: boolean;
}

interface BackgroundContextType {
  activeBackground: MountainBackground | null;
  loading: boolean;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [activeBackground, setActiveBackground] = useState<MountainBackground | null>(null);

  const { data: backgrounds = [], isLoading } = useQuery<MountainBackground[]>({
    queryKey: ["/api/user/backgrounds"],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  useEffect(() => {
    // Find the active background from the list
    const active = backgrounds.find(bg => bg.isActive);
    if (active) {
      setActiveBackground(active);
    }
  }, [backgrounds]);

  return (
    <BackgroundContext.Provider value={{ activeBackground, loading: isLoading }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return context;
}
