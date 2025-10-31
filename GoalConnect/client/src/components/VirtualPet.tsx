import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Sparkles, TrendingUp } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { VirtualPet as VirtualPetType, Costume } from "@shared/schema";

export function VirtualPet() {
  const { data: pet, isLoading: petLoading } = useQuery<VirtualPetType>({
    queryKey: ["/api/pet"],
  });

  const { data: userCostumes = [] } = useQuery<any[]>({
    queryKey: ["/api/user-costumes"],
  });

  const { data: costumes = [] } = useQuery<Costume[]>({
    queryKey: ["/api/costumes"],
  });

  const updatePetMutation = useMutation({
    mutationFn: async (data: { currentCostumeId: number | null }) => {
      if (!pet) return;
      return await apiRequest(`/api/pet/${pet.id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pet"], exact: false });
    },
  });

  if (petLoading || !pet) {
    return (
      <Card className="rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="h-64 animate-pulse bg-muted rounded-3xl" />
        </CardContent>
      </Card>
    );
  }

  const currentCostume = costumes.find(c => c.id === pet.currentCostumeId);

  return (
    <div className="flex items-center justify-center" data-testid="pet-display-container">
      <div className="w-48 h-48 rounded-full bg-white/10 backdrop-blur-sm border-3 border-white/20 shadow-lg overflow-hidden float-animation">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#a855f7', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#ec4899', stopOpacity: 1}} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Body */}
          <circle cx="100" cy="100" r="60" fill="url(#bodyGradient)" filter="url(#glow)"/>
          {/* Fairy Wings */}
          <ellipse cx="60" cy="80" rx="30" ry="45" fill="#a7f3d0" opacity="0.7" transform="rotate(-20 60 80)">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="140" cy="80" rx="30" ry="45" fill="#a7f3d0" opacity="0.7" transform="rotate(20 140 80)">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" begin="0.5s"/>
          </ellipse>
          {/* Eyes */}
          <circle cx="85" cy="90" r="10" fill="white"/>
          <circle cx="115" cy="90" r="10" fill="white"/>
          <circle cx="87" cy="92" r="6" fill="#2d3748"/>
          <circle cx="117" cy="92" r="6" fill="#2d3748"/>
          <circle cx="89" cy="90" r="3" fill="white"/>
          <circle cx="119" cy="90" r="3" fill="white"/>
          {/* Nose */}
          <circle cx="100" cy="105" r="5" fill="#fbbf24"/>
          {/* Smile */}
          <path d="M 85 115 Q 100 130 115 115" stroke="#2d3748" strokeWidth="3" fill="none" strokeLinecap="round"/>
          {/* Ears with sparkles */}
          <circle cx="70" cy="60" r="15" fill="url(#bodyGradient)"/>
          <circle cx="130" cy="60" r="15" fill="url(#bodyGradient)"/>
          <circle cx="70" cy="62" r="8" fill="#fbbf24"/>
          <circle cx="130" cy="62" r="8" fill="#fbbf24"/>
          {/* Magical antenna */}
          <line x1="100" y1="40" x2="100" y2="20" stroke="#a7f3d0" strokeWidth="2"/>
          <circle cx="100" cy="20" r="5" fill="#fbbf24">
            <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          {/* Rosy cheeks */}
          <circle cx="70" cy="110" r="10" fill="#fca5a5" opacity="0.5"/>
          <circle cx="130" cy="110" r="10" fill="#fca5a5" opacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}
