import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FABProps {
  onClick: () => void;
  className?: string;
}

export function FAB({ onClick, className }: FABProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg z-40",
        className
      )}
      size="icon"
      data-testid="fab-button"
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}
