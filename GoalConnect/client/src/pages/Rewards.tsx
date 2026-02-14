import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import confetti from "canvas-confetti";
import { Gift, Plus, Trash2, Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface CustomReward {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  cost: number;
  imageUrl: string | null;
  redeemed: boolean;
  redeemedAt: string | null;
  createdAt: string;
}

interface PointsData {
  available: number;
  totalEarned: number;
  totalSpent: number;
}

// ============================================================================
// FORM SCHEMA
// ============================================================================

const rewardFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  cost: z.coerce
    .number({ invalid_type_error: "Cost must be a number" })
    .int("Cost must be a whole number")
    .min(10, "Minimum cost is 10 XP"),
  description: z.string().max(500).optional().or(z.literal("")),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type RewardFormValues = z.infer<typeof rewardFormSchema>;

// ============================================================================
// REWARD CARD
// ============================================================================

function RewardCard({
  reward,
  available,
  onRedeem,
  onDelete,
  isRedeeming,
}: {
  reward: CustomReward;
  available: number;
  onRedeem: (id: number) => void;
  onDelete: (id: number) => void;
  isRedeeming: boolean;
}) {
  const canAfford = available >= reward.cost;
  const progress = Math.min((available / reward.cost) * 100, 100);

  if (reward.redeemed) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 opacity-70">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                {reward.title}
              </h3>
            </div>
            {reward.description && (
              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 pl-8">
                {reward.description}
              </p>
            )}
            <p className="text-xs text-[var(--text-muted)] mt-2 pl-8">
              Redeemed{" "}
              {reward.redeemedAt
                ? new Date(reward.redeemedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : ""}
            </p>
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">
            {reward.cost} XP
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
            {reward.title}
          </h3>
          {reward.description && (
            <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
              {reward.description}
            </p>
          )}
        </div>
        <span className="text-xs font-semibold text-peach-400 whitespace-nowrap">
          {reward.cost} XP
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1">
          <span>
            {available} / {reward.cost} XP
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              canAfford ? "bg-peach-400" : "bg-peach-400/60"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={!canAfford || isRedeeming}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                canAfford && !isRedeeming
                  ? "bg-peach-400 hover:bg-peach-500 text-white"
                  : "bg-white/5 text-[var(--text-muted)] cursor-not-allowed opacity-50"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isRedeeming ? "Redeeming..." : "Redeem"}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[var(--text-primary)]">
                Redeem Reward
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[var(--text-muted)]">
                Spend {reward.cost} XP on {reward.title}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10 text-[var(--text-primary)] hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRedeem(reward.id)}
                className="bg-peach-400 hover:bg-peach-500 text-white"
              >
                Spend {reward.cost} XP
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[var(--text-primary)]">
                Delete Reward
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[var(--text-muted)]">
                Are you sure you want to delete &quot;{reward.title}&quot;? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10 text-[var(--text-primary)] hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(reward.id)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ============================================================================
// CREATE REWARD DIALOG
// ============================================================================

function CreateRewardDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardFormSchema),
    defaultValues: {
      title: "",
      cost: 100,
      description: "",
      imageUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: RewardFormValues) =>
      apiRequest("/api/rewards", "POST", {
        title: data.title,
        cost: data.cost,
        description: data.description || undefined,
        imageUrl: data.imageUrl || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      toast({ title: "Reward created", description: "Your new reward is ready to earn!" });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create reward",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RewardFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)] flex items-center gap-2">
            <Gift className="w-5 h-5 text-peach-400" />
            Create Reward
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              {...form.register("title")}
              placeholder="e.g. Custom scrub cap"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-peach-400/50 focus:border-peach-400/50"
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-400">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Cost */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Cost (XP) <span className="text-red-400">*</span>
            </label>
            <input
              {...form.register("cost")}
              type="number"
              min={50}
              step={10}
              placeholder="100"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-peach-400/50 focus:border-peach-400/50"
            />
            {form.formState.errors.cost && (
              <p className="text-xs text-red-400">
                {form.formState.errors.cost.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Description
            </label>
            <textarea
              {...form.register("description")}
              placeholder="Why do you want this?"
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-peach-400/50 focus:border-peach-400/50 resize-none"
            />
            {form.formState.errors.description && (
              <p className="text-xs text-red-400">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Image URL
            </label>
            <input
              {...form.register("imageUrl")}
              placeholder="https://..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-peach-400/50 focus:border-peach-400/50"
            />
            {form.formState.errors.imageUrl && (
              <p className="text-xs text-red-400">
                {form.formState.errors.imageUrl.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full rounded-lg bg-peach-400 hover:bg-peach-500 text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? "Creating..." : "Create Reward"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function RewardsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 animate-pulse"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-2/3" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
            <div className="h-4 bg-white/10 rounded w-12" />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 bg-white/5 rounded-full" />
          </div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 h-8 bg-white/5 rounded-lg" />
            <div className="w-8 h-8 bg-white/5 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function RewardsPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Queries
  const {
    data: rewards = [],
    isLoading: rewardsLoading,
    error: rewardsError,
  } = useQuery<CustomReward[]>({
    queryKey: ["/api/rewards"],
  });

  const { data: points } = useQuery<PointsData>({
    queryKey: ["/api/points"],
  });

  const available = points?.available ?? 0;

  // Mutations
  const [redeemingId, setRedeemingId] = useState<number | null>(null);

  const redeemMutation = useMutation({
    mutationFn: (id: number) => {
      setRedeemingId(id);
      return apiRequest(`/api/rewards/${id}/redeem`, "POST");
    },
    onSuccess: (data: { reward: CustomReward; pointsRemaining: number }) => {
      setRedeemingId(null);
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      toast({
        title: "Reward redeemed!",
        description: `You earned "${data.reward.title}". ${data.pointsRemaining} XP remaining.`,
      });
    },
    onError: (error: Error) => {
      setRedeemingId(null);
      toast({
        title: "Failed to redeem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/rewards/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      toast({ title: "Reward deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Split rewards
  const activeRewards = rewards.filter((r) => !r.redeemed);
  const redeemedRewards = rewards.filter((r) => r.redeemed);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="w-6 h-6 text-peach-400" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Rewards
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {points && (
            <div className="flex items-center gap-1.5 rounded-full bg-peach-400/10 border border-peach-400/20 px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-peach-400" />
              <span className="text-xs font-semibold text-peach-400">
                {available.toLocaleString()} XP
              </span>
            </div>
          )}
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-peach-400 hover:bg-peach-500 text-white px-3 py-2 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Reward
          </button>
        </div>
      </div>

      {/* Error state */}
      {rewardsError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
          <p className="text-sm text-red-400">
            Failed to load rewards. Please try again.
          </p>
        </div>
      )}

      {/* Loading state */}
      {rewardsLoading && <RewardsSkeleton />}

      {/* Empty state */}
      {!rewardsLoading && !rewardsError && rewards.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-peach-400/10">
              <Gift className="w-7 h-7 text-peach-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
            No rewards yet
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4 max-w-xs mx-auto">
            Create your first reward to start working toward something!
          </p>
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-peach-400 hover:bg-peach-500 text-white px-4 py-2 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Reward
          </button>
        </div>
      )}

      {/* Active Rewards */}
      {!rewardsLoading && activeRewards.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-[var(--text-muted)] font-medium">
            Active Rewards
          </h2>
          <div className="grid gap-3">
            {activeRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                available={available}
                onRedeem={(id) => redeemMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
                isRedeeming={redeemingId === reward.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Redeemed Rewards */}
      {!rewardsLoading && redeemedRewards.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-[var(--text-muted)] font-medium">
            Redeemed
          </h2>
          <div className="grid gap-3">
            {redeemedRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                available={available}
                onRedeem={() => {}}
                onDelete={() => {}}
                isRedeeming={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Create Dialog */}
      <CreateRewardDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
