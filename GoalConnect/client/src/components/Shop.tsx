import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Check, Lock, Sparkles } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Costume, UserCostume, UserPoints, VirtualPet } from "@shared/schema";

const RARITY_COLORS = {
  common: "bg-gray-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-orange-500",
};

const EVOLUTION_ORDER = ["seed", "sprout", "sapling", "tree", "ancient"];

const EVOLUTION_NAMES = {
  seed: "Seed",
  sprout: "Sprout",
  sapling: "Sapling",
  tree: "Tree",
  ancient: "Ancient"
};

export function Shop() {
  const { toast } = useToast();

  const { data: costumes = [], isLoading: costumesLoading } = useQuery<Costume[]>({
    queryKey: ["/api/costumes"],
  });

  const { data: userCostumes = [] } = useQuery<UserCostume[]>({
    queryKey: ["/api/user-costumes"],
  });

  const { data: points } = useQuery<UserPoints>({
    queryKey: ["/api/user-points"],
  });

  const { data: pet } = useQuery<VirtualPet>({
    queryKey: ["/api/virtual-pet"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (costumeId: number) => {
      return await apiRequest("/api/costumes/purchase", "POST", { costumeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-costumes"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/costumes"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/points"], exact: false });
      toast({
        title: "Purchase successful!",
        description: "The costume has been added to your collection.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Purchase failed",
        description: error.message || "Could not purchase costume",
      });
    },
  });

  const categories = ["all", "hat", "outfit", "accessory", "background"];

  const isOwned = (costumeId: number) => {
    return userCostumes.some((uc: UserCostume) => uc.costumeId === costumeId);
  };

  const canAfford = (price: number) => {
    return points ? points.available >= price : false;
  };

  const isUnlocked = (costume: Costume) => {
    if (!pet || !costume.evolutionRequired) return true;
    const currentEvolutionIndex = EVOLUTION_ORDER.indexOf(pet.evolution);
    const requiredEvolutionIndex = EVOLUTION_ORDER.indexOf(costume.evolutionRequired);
    return currentEvolutionIndex >= requiredEvolutionIndex;
  };

  const renderCostume = (costume: Costume) => {
    const owned = isOwned(costume.id);
    const affordable = canAfford(costume.price);
    const unlocked = isUnlocked(costume);

    return (
      <Card
        key={costume.id}
        data-testid={`card-costume-${costume.id}`}
        className={!unlocked ? "opacity-60 relative overflow-hidden" : ""}
      >
        {!unlocked && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 pointer-events-none z-10" />
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {costume.name}
                {!unlocked && <Lock className="w-3 h-3 text-purple-500" />}
              </CardTitle>
              <CardDescription className="text-xs">{costume.description}</CardDescription>
            </div>
            <div className="flex flex-col gap-1">
              <Badge className={RARITY_COLORS[costume.rarity]} data-testid={`badge-rarity-${costume.id}`}>
                {costume.rarity}
              </Badge>
              {!unlocked && costume.evolutionRequired && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {EVOLUTION_NAMES[costume.evolutionRequired]}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 bg-gradient-to-b from-muted to-muted/50 rounded-md min-h-[160px] relative">
            {!unlocked && (
              <div className="absolute inset-0 backdrop-blur-sm bg-black/20 rounded-md flex items-center justify-center">
                <Lock className="w-12 h-12 text-purple-400/50" />
              </div>
            )}
            {costume.imageUrl.startsWith('/') || costume.imageUrl.startsWith('http') || costume.imageUrl.includes('generated_images') ? (
              <img
                src={costume.imageUrl}
                alt={costume.name}
                className="max-w-full max-h-32 object-contain drop-shadow-lg"
                data-testid={`img-costume-${costume.id}`}
              />
            ) : (
              <span
                className="text-8xl leading-none"
                style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}
                data-testid={`text-costume-${costume.id}`}
                role="img"
                aria-label={costume.name}
              >
                {costume.imageUrl}
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {!unlocked ? (
            <Button
              className="w-full"
              variant="outline"
              disabled
              data-testid={`button-locked-${costume.id}`}
            >
              <Lock className="w-4 h-4 mr-2" />
              Unlocks at {EVOLUTION_NAMES[costume.evolutionRequired!]}
            </Button>
          ) : owned ? (
            <Button
              className="w-full"
              variant="outline"
              disabled
              data-testid={`button-owned-${costume.id}`}
            >
              <Check className="w-4 h-4 mr-2" />
              Owned
            </Button>
          ) : (
            <Button
              className="w-full"
              variant={affordable ? "default" : "outline"}
              disabled={!affordable || purchaseMutation.isPending}
              onClick={() => purchaseMutation.mutate(costume.id)}
              data-testid={`button-purchase-${costume.id}`}
            >
              {affordable ? (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy for {costume.price} pts
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {costume.price} pts
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (costumesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-60 animate-pulse bg-muted rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" data-testid="text-shop-title">Costume Shop</h2>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Available Points</div>
          <div className="text-2xl font-bold" data-testid="text-available-points">
            {points?.available ?? 0}
          </div>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-5">
          {categories.map((category) => (
            <TabsTrigger 
              key={category} 
              value={category}
              data-testid={`tab-category-${category}`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {costumes
                .filter((costume) => category === "all" || costume.category === category)
                .map(renderCostume)}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
