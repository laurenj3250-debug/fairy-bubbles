import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertHabitSchema, type InsertHabit, type Habit } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as Icons from "lucide-react";

const iconOptions = [
  { value: "Dumbbell", label: "Dumbbell" },
  { value: "BookOpen", label: "Book" },
  { value: "Brain", label: "Brain" },
  { value: "Coffee", label: "Coffee" },
  { value: "Droplets", label: "Water" },
  { value: "Moon", label: "Sleep" },
  { value: "Heart", label: "Heart" },
  { value: "Music", label: "Music" },
  { value: "Pencil", label: "Writing" },
  { value: "Code", label: "Code" },
  { value: "Sparkles", label: "Sparkles" },
  { value: "ClipboardCheck", label: "Checklist" },
];

const colorOptions = [
  "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
  "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#84CC16"
];

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit;
}

export function HabitDialog({ open, onOpenChange, habit }: HabitDialogProps) {
  console.log('🟢 HabitDialog RENDERED - open:', open, 'habit:', habit);
  const { toast } = useToast();
  const isEdit = !!habit;

  const form = useForm<InsertHabit>({
    resolver: zodResolver(insertHabitSchema),
    defaultValues: habit ? {
      userId: habit.userId,
      title: habit.title,
      description: habit.description,
      icon: habit.icon,
      color: habit.color,
      cadence: habit.cadence,
      targetPerWeek: habit.targetPerWeek,
    } : {
      userId: 1,
      title: "",
      description: "",
      icon: "Sparkles",
      color: "#8B5CF6",
      cadence: "daily",
      targetPerWeek: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertHabit) => {
      console.log('📝 Creating habit with data:', data);
      try {
        const result = await apiRequest("/api/habits", "POST", data);
        console.log('✅ Habit created successfully:', result);
        return result;
      } catch (err) {
        console.error('❌ API request failed:', err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log('🎉 onSuccess called - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/all"] });
      toast({ title: "Habit created", description: "Your new habit has been added" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('❌ Error creating habit (onError):', error);
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to create habit", 
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertHabit) => apiRequest(`/api/habits/${habit?.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"], exact: false });
      toast({ title: "Habit updated", description: "Your habit has been updated" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update habit", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertHabit) => {
    console.log('📝 Submitting habit:', data);
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedIcon = form.watch("icon");
  const selectedColor = form.watch("color");
  const selectedCadence = form.watch("cadence");
  const IconComponent = (Icons as any)[selectedIcon] || Icons.Sparkles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="habit-dialog">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Habit" : "Create New Habit"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update your habit details" : "Add a new habit to track"}
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
                    <Input {...field} placeholder="Morning Exercise" data-testid="input-habit-title" />
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
                      placeholder="30 minutes of cardio or strength training"
                      className="resize-none"
                      rows={3}
                      data-testid="input-habit-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-habit-icon">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map(icon => {
                          const Icon = (Icons as any)[icon.value];
                          return (
                            <SelectItem key={icon.value} value={icon.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {icon.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cadence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cadence</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-habit-cadence">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedCadence === "weekly" && (
              <FormField
                control={form.control}
                name="targetPerWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly Target (optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value && value !== "" ? parseInt(value) : null)}
                      value={field.value !== null && field.value !== undefined ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-habit-target">
                          <SelectValue placeholder="Select times per week" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No target</SelectItem>
                        <SelectItem value="1">1 time per week</SelectItem>
                        <SelectItem value="2">2 times per week</SelectItem>
                        <SelectItem value="3">3 times per week</SelectItem>
                        <SelectItem value="4">4 times per week</SelectItem>
                        <SelectItem value="5">5 times per week</SelectItem>
                        <SelectItem value="6">6 times per week</SelectItem>
                        <SelectItem value="7">7 times per week</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => field.onChange(color)}
                        className="w-10 h-10 rounded-lg border-2 transition-all hover-elevate"
                        style={{
                          backgroundColor: color,
                          borderColor: selectedColor === color ? "#fff" : "transparent",
                        }}
                        data-testid={`color-${color}`}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t flex items-center gap-3">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg"
                style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
              >
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Preview</p>
                <p className="text-xs text-muted-foreground">
                  {form.watch("title") || "Your habit title"}
                </p>
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
                data-testid="button-save-habit"
              >
                {isEdit ? "Update" : "Create"} Habit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
