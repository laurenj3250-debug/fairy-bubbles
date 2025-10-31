import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertGoalSchema, type InsertGoal, type Goal } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDateInput } from "@/lib/utils";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal;
}

export function GoalDialog({ open, onOpenChange, goal }: GoalDialogProps) {
  const { toast } = useToast();
  const isEdit = !!goal;

  const form = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema),
    defaultValues: goal ? {
      userId: goal.userId,
      title: goal.title,
      description: goal.description,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      deadline: goal.deadline,
      category: goal.category,
    } : {
      userId: 1,
      title: "",
      description: "",
      targetValue: 100,
      currentValue: 0,
      unit: "",
      deadline: formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      category: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertGoal) => apiRequest("/api/goals", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"], exact: false });
      toast({ title: "Goal created", description: "Your new goal has been added" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create goal", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertGoal) => apiRequest(`/api/goals/${goal?.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"], exact: false });
      toast({ title: "Goal updated", description: "Your goal has been updated" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update goal", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertGoal) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const progress = form.watch("currentValue") / form.watch("targetValue") * 100 || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="goal-dialog">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Goal" : "Create New Goal"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update your goal details" : "Set a new goal to track your progress"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Read 12 Books This Year" data-testid="input-goal-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Read at least one book per month"
                      className="resize-none"
                      rows={2}
                      data-testid="input-goal-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-goal-current"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Value</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-goal-target"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="books" data-testid="input-goal-unit" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Learning" data-testid="input-goal-category" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" data-testid="input-goal-deadline" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress Preview</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-goal"
              >
                {isEdit ? "Update" : "Create"} Goal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
