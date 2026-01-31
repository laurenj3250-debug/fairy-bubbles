import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gift, Plus, Star, Trash2, ShoppingBag, Check, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PersonalReward {
  id: number;
  title: string;
  description: string | null;
  cost: number;
  category: string;
  icon: string | null;
  redeemed: boolean;
  redeemedAt: string | null;
}

interface RewardsResponse {
  rewards: PersonalReward[];
  availableTokens: number;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; defaultIcon: string }> = {
  treat: { label: "Treat", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", defaultIcon: "☕" },
  experience: { label: "Experience", color: "bg-purple-500/20 text-purple-300 border-purple-500/30", defaultIcon: "✨" },
  gear: { label: "Gear", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", defaultIcon: "🎒" },
  self_care: { label: "Self Care", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", defaultIcon: "🧘" },
  splurge: { label: "Splurge", color: "bg-rose-500/20 text-rose-300 border-rose-500/30", defaultIcon: "🎉" },
};

export default function PersonalRewards() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newReward, setNewReward] = useState({
    title: "",
    description: "",
    cost: 100,
    category: "treat",
    icon: "",
  });

  const { data, isLoading } = useQuery<RewardsResponse>({
    queryKey: ["/api/personal-rewards"],
  });

  const rewards = data?.rewards || [];
  const availableTokens = data?.availableTokens || 0;

  const createMutation = useMutation({
    mutationFn: async (reward: typeof newReward) => {
      const response = await fetch("/api/personal-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reward),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create reward");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-rewards"] });
      setShowCreate(false);
      setNewReward({ title: "", description: "", cost: 100, category: "treat", icon: "" });
      toast({ title: "Reward created!", description: "Keep earning tokens to redeem it." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await fetch(`/api/personal-rewards/${rewardId}/redeem`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to redeem reward");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      toast({
        title: "Reward redeemed!",
        description: data.message,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Can't redeem yet", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await fetch(`/api/personal-rewards/${rewardId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-rewards"] });
      toast({ title: "Reward removed" });
    },
  });

  const activeRewards = rewards.filter(r => !r.redeemed);
  const redeemedRewards = rewards.filter(r => r.redeemed);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/alpine-shop">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-amber-400" />
            My Rewards
          </h1>
          <p className="text-slate-400 text-sm">Set personal rewards to work towards</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-400">{availableTokens}</div>
          <div className="text-xs text-slate-400">tokens</div>
        </div>
      </div>

      {/* Token Earning Summary */}
      <Card className="bg-slate-800/50 border-slate-700 mb-6">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">How to earn tokens</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Star className="w-3 h-3 text-green-400" />
              <span>Easy habit: 5 pts</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Star className="w-3 h-3 text-yellow-400" />
              <span>Medium habit: 10 pts</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Star className="w-3 h-3 text-red-400" />
              <span>Hard habit: 15 pts</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Combo bonus: +1-3 pts</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Check className="w-3 h-3 text-cyan-400" />
              <span>Daily quests: 10-50 pts</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Star className="w-3 h-3 text-amber-400" />
              <span>Yearly goals: 100+ pts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create New Reward */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogTrigger asChild>
          <Button className="w-full mb-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add a Reward to Work Towards
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Create Personal Reward</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">What do you want to earn?</label>
              <Input
                className="bg-slate-700 border-slate-600 text-white mt-1"
                placeholder="e.g., Nice coffee, New climbing shoes..."
                value={newReward.title}
                onChange={e => setNewReward({ ...newReward, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Description (optional)</label>
              <Textarea
                className="bg-slate-700 border-slate-600 text-white mt-1"
                placeholder="Details about this reward..."
                value={newReward.description}
                onChange={e => setNewReward({ ...newReward, description: e.target.value })}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm text-slate-300">Token cost</label>
                <Input
                  type="number"
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  min={1}
                  value={newReward.cost}
                  onChange={e => setNewReward({ ...newReward, cost: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-slate-300">Category</label>
                <Select
                  value={newReward.category}
                  onValueChange={v => setNewReward({ ...newReward, category: v })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="text-white">
                        {config.defaultIcon} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300">Icon (emoji, optional)</label>
              <Input
                className="bg-slate-700 border-slate-600 text-white mt-1"
                placeholder="e.g., ☕ 🧗 🎧"
                value={newReward.icon}
                onChange={e => setNewReward({ ...newReward, icon: e.target.value })}
                maxLength={4}
              />
            </div>
            <Button
              className="w-full bg-amber-600 hover:bg-amber-500"
              disabled={!newReward.title || newReward.cost < 1}
              onClick={() => createMutation.mutate(newReward)}
            >
              Create Reward
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Rewards */}
      {activeRewards.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">No rewards yet</p>
          <p className="text-sm">Add something you want to earn!</p>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {activeRewards.map(reward => {
          const config = CATEGORY_CONFIG[reward.category] || CATEGORY_CONFIG.treat;
          const canAfford = availableTokens >= reward.cost;
          const progress = Math.min(100, Math.round((availableTokens / reward.cost) * 100));

          return (
            <Card key={reward.id} className="bg-slate-800/60 border-slate-700 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{reward.icon || config.defaultIcon}</span>
                    <div>
                      <h3 className="font-semibold text-white">{reward.title}</h3>
                      {reward.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{reward.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${config.color} border text-xs`}>
                      {config.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-slate-500 hover:text-red-400"
                      onClick={() => deleteMutation.mutate(reward.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{availableTokens} / {reward.cost} tokens</span>
                    <span className={canAfford ? "text-green-400" : "text-slate-400"}>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        canAfford
                          ? "bg-gradient-to-r from-green-500 to-emerald-400"
                          : "bg-gradient-to-r from-amber-600 to-orange-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Redeem button */}
                <Button
                  className={`w-full mt-3 ${
                    canAfford
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed"
                  }`}
                  disabled={!canAfford || redeemMutation.isPending}
                  onClick={() => redeemMutation.mutate(reward.id)}
                >
                  {canAfford ? (
                    <>
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Redeem for {reward.cost} tokens
                    </>
                  ) : (
                    `Need ${reward.cost - availableTokens} more tokens`
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Redeemed Rewards */}
      {redeemedRewards.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            Redeemed ({redeemedRewards.length})
          </h2>
          <div className="space-y-2">
            {redeemedRewards.map(reward => {
              const config = CATEGORY_CONFIG[reward.category] || CATEGORY_CONFIG.treat;
              return (
                <Card key={reward.id} className="bg-slate-800/30 border-slate-700/50">
                  <div className="p-3 flex items-center gap-3 opacity-70">
                    <span className="text-xl">{reward.icon || config.defaultIcon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-300 line-through">{reward.title}</h3>
                      <p className="text-xs text-slate-500">
                        {reward.cost} tokens &middot; Redeemed{" "}
                        {reward.redeemedAt
                          ? new Date(reward.redeemedAt).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
