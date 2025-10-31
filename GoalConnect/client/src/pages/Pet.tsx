import { VirtualPet } from "@/components/VirtualPet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

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
      </div>
    </div>
  );
}
