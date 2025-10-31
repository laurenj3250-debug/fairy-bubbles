import { VirtualPet } from "@/components/VirtualPet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Check, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Costume, UserCostume } from "@shared/schema";

function CostumeWardrobe() {
  const { toast } = useToast();

  const { data: userCostumes = [] } = useQuery<UserCostume[]>({
    queryKey: ["/api/user-costumes"],
  });

  const { data: allCostumes = [] } = useQuery<Costume[]>({
    queryKey: ["/api/costumes"],
  });

  const { data: equippedCostumes = [] } = useQuery<Array<UserCostume & { costume: Costume }>>({
    queryKey: ["/api/costumes/equipped"],
  });

  const equipMutation = useMutation({
    mutationFn: async (costumeId: number) => {
      return await apiRequest("/api/costumes/equip", "POST", { costumeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costumes/equipped"] });
      toast({
        title: "Costume equipped!",
        description: "Your pet is looking great!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to equip costume",
        description: error.message || "Could not equip costume",
      });
    },
  });

  const unequipMutation = useMutation({
    mutationFn: async (costumeId: number) => {
      return await apiRequest("/api/costumes/unequip", "POST", { costumeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costumes/equipped"] });
      toast({
        title: "Costume unequipped",
        description: "Costume removed from your pet",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to unequip costume",
        description: error.message || "Could not unequip costume",
      });
    },
  });

  const ownedCostumes = allCostumes.filter(costume => 
    userCostumes.some(uc => uc.costumeId === costume.id)
  );

  const isEquipped = (costumeId: number) => {
    return equippedCostumes.some(ec => ec.costumeId === costumeId);
  };

  if (ownedCostumes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wardrobe</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            You don't have any costumes yet. Visit the shop to purchase some!
          </p>
          <Link href="/shop">
            <Button className="w-full">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Go to Shop
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wardrobe - Click to Equip/Unequip</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {ownedCostumes.map((costume) => {
            const equipped = isEquipped(costume.id);
            return (
              <button
                key={costume.id}
                onClick={() => {
                  if (equipped) {
                    unequipMutation.mutate(costume.id);
                  } else {
                    equipMutation.mutate(costume.id);
                  }
                }}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  equipped
                    ? "border-green-500 bg-green-500/10"
                    : "border-border bg-muted hover:border-primary"
                }`}
              >
                <div className="aspect-square flex items-center justify-center mb-2 bg-gradient-to-b from-muted to-muted/50 rounded-md">
                  {costume.imageUrl.startsWith('/') || costume.imageUrl.startsWith('http') || costume.imageUrl.includes('generated_images') ? (
                    <img 
                      src={costume.imageUrl}
                      alt={costume.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-4xl">{costume.imageUrl}</div>
                  )}
                </div>
                <div className="text-xs font-medium truncate">{costume.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{costume.category}</div>
                {equipped && (
                  <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Pet() {
  return (
    <div className="min-h-screen pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              My Gremlin
            </h1>
            <p className="text-muted-foreground">
              Keep your gremlin happy by completing habits!
            </p>
          </div>
          <Link href="/shop">
            <Button data-testid="button-shop">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop
            </Button>
          </Link>
        </div>

        <VirtualPet />
        
        <CostumeWardrobe />
      </div>
    </div>
  );
}
