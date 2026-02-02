import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, endOfMonth, endOfWeek, getISOWeek, getYear } from "date-fns";
import type { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";

const quickGoalSchema = z.object({
  title: z.string().min(1, "Title required"),
  targetValue: z.number().int().min(1, "Must be at least 1"),
  unit: z.string().min(1, "Unit required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  priority: z.enum(["high", "medium", "low"]),
  type: z.enum(["week", "month"]),
});

type QuickGoalFormValues = z.infer<typeof quickGoalSchema>;

interface QuickGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: "week" | "month";
}

export function QuickGoalDialog({
  open,
  onOpenChange,
  defaultType,
}: QuickGoalDialogProps) {
  const { toast } = useToast();
  const [parentYearlyGoalId, setParentYearlyGoalId] = useState<number | null>(null);

  // Fetch yearly goals so user can link new goal to a yearly goal
  const currentYear = String(new Date().getFullYear());
  const { data: yearlyGoalsData } = useQuery<{ goals: YearlyGoalWithProgress[] }>({
    queryKey: ["/api/yearly-goals/with-progress", { year: currentYear }],
    queryFn: async () => {
      const res = await fetch(`/api/yearly-goals/with-progress?year=${currentYear}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch yearly goals");
      return res.json();
    },
    enabled: open,
  });
  const yearlyGoals = yearlyGoalsData?.goals?.filter(g => !g.isCompleted) ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuickGoalFormValues>({
    resolver: zodResolver(quickGoalSchema),
    defaultValues: {
      title: "",
      targetValue: 1,
      unit: "",
      difficulty: "medium",
      priority: "medium",
      type: defaultType,
    },
  });

  const selectedType = watch("type");

  // Sync defaultType prop when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        title: "",
        targetValue: 1,
        unit: "",
        difficulty: "medium",
        priority: "medium",
        type: defaultType,
      });
      setParentYearlyGoalId(null);
    }
  }, [open, defaultType, reset]);

  const createGoalMutation = useMutation({
    mutationFn: async (values: QuickGoalFormValues) => {
      const now = new Date();
      const currentYearNum = getYear(now);
      const currentWeekNum = getISOWeek(now);
      const currentWeek = `${currentYearNum}-W${String(currentWeekNum).padStart(2, "0")}`;
      const currentMonth = format(now, "yyyy-MM");

      const isWeek = values.type === "week";
      const deadline = isWeek
        ? format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
        : format(endOfMonth(now), "yyyy-MM-dd");

      return apiRequest("/api/goals", "POST", {
        title: values.title,
        description: "",
        targetValue: values.targetValue,
        unit: values.unit,
        deadline,
        category: "general",
        difficulty: values.difficulty,
        priority: values.priority,
        week: isWeek ? currentWeek : null,
        month: !isWeek ? currentMonth : null,
        linkedYearlyGoalId: parentYearlyGoalId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goal-calendar"] });
      toast({
        title: "Goal created",
        description: parentYearlyGoalId
          ? "Goal created and linked to yearly goal."
          : "Your goal has been added successfully.",
      });
      onOpenChange(false);
      reset();
      setParentYearlyGoalId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create goal",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: QuickGoalFormValues) => {
    createGoalMutation.mutate(values);
  };

  const isSubmitting = createGoalMutation.isPending;

  const inputClasses =
    "w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-peach-400/50 focus:border-peach-400/50 transition-colors";

  const labelClasses =
    "block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1a1a2e]/95 border-white/10 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)] text-lg font-semibold">
            Quick Goal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type Toggle */}
          <div>
            <label className={labelClasses}>Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["week", "month"] as const).map((t) => {
                const active = selectedType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue("type", t)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      active
                        ? "bg-peach-400/20 text-peach-400 ring-1 ring-peach-400/30"
                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                    }`}
                  >
                    {t === "week" ? "This Week" : "This Month"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={labelClasses}>Title</label>
            <input
              {...register("title")}
              type="text"
              placeholder="e.g. Exercise 5 times"
              autoFocus
              className={inputClasses}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Target Value + Unit (two columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>Target</label>
              <input
                {...register("targetValue", { valueAsNumber: true })}
                type="number"
                min={1}
                placeholder="5"
                className={inputClasses}
              />
              {errors.targetValue && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.targetValue.message}
                </p>
              )}
            </div>
            <div>
              <label className={labelClasses}>Unit</label>
              <input
                {...register("unit")}
                type="text"
                placeholder="sessions"
                className={inputClasses}
              />
              {errors.unit && (
                <p className="mt-1 text-xs text-red-400">{errors.unit.message}</p>
              )}
            </div>
          </div>

          {/* Difficulty + Priority (two columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>Difficulty</label>
              <select
                {...register("difficulty")}
                className={`${inputClasses} appearance-none cursor-pointer`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className={labelClasses}>Priority</label>
              <select
                {...register("priority")}
                className={`${inputClasses} appearance-none cursor-pointer`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Link to Yearly Goal */}
          {yearlyGoals.length > 0 && (
            <div>
              <label className={labelClasses}>Link to Yearly Goal</label>
              <select
                value={parentYearlyGoalId ?? ""}
                onChange={(e) => setParentYearlyGoalId(e.target.value ? parseInt(e.target.value) : null)}
                className={`${inputClasses} appearance-none cursor-pointer`}
              >
                <option value="">None (standalone)</option>
                {yearlyGoals.map((yg) => (
                  <option key={yg.id} value={yg.id}>
                    {yg.title} ({yg.computedValue}/{yg.targetValue})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-white/30">
                Optionally connect this to a yearly goal
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold bg-peach-400 hover:bg-peach-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Goal"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
