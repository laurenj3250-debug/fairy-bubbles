import { Shop } from "@/components/Shop";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ShopPage() {
  return (
    <div className="min-h-screen pb-20">
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/pet">
            <Button variant="outline" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Costume Shop
            </h1>
            <p className="text-muted-foreground">
              Customize your gremlin with awesome costumes!
            </p>
          </div>
        </div>

        <Shop />
      </div>
    </div>
  );
}
