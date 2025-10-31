import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle2, Target, ListTodo } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog, Goal, Todo } from "@shared/schema";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: habitLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs"],
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getItemsForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    
    const completedHabits = habitLogs.filter(log => 
      format(new Date(log.date), "yyyy-MM-dd") === dateString
    );

    const todosForDate = todos.filter(todo => 
      todo.dueDate && format(new Date(todo.dueDate), "yyyy-MM-dd") === dateString
    );

    const goalsForDate = goals.filter(goal => 
      format(new Date(goal.deadline), "yyyy-MM-dd") === dateString
    );

    return {
      habits: completedHabits,
      todos: todosForDate,
      goals: goalsForDate,
    };
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDayOfWeek = monthStart.getDay();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-xl">Calendar</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-32 text-center font-medium">
            {format(currentDate, "MMMM yyyy")}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            data-testid="button-next-month"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-20" />
          ))}

          {days.map(day => {
            const items = getItemsForDate(day);
            const hasItems = items.habits.length > 0 || items.todos.length > 0 || items.goals.length > 0;
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-20 p-2 border rounded-md transition-colors hover-elevate",
                  !isSameMonth(day, currentDate) && "opacity-40",
                  isCurrentDay && "bg-primary/5 border-primary"
                )}
                data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
              >
                <div className="flex flex-col h-full">
                  <div
                    className={cn(
                      "text-sm font-medium mb-1",
                      isCurrentDay && "text-primary font-bold"
                    )}
                  >
                    {format(day, "d")}
                  </div>

                  {hasItems && (
                    <div className="space-y-1">
                      {items.habits.length > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-muted-foreground">
                            {items.habits.length}
                          </span>
                        </div>
                      )}
                      {items.todos.length > 0 && (
                        <div className="flex items-center gap-1">
                          <ListTodo className="w-3 h-3 text-blue-600" />
                          <span className="text-xs text-muted-foreground">
                            {items.todos.length}
                          </span>
                        </div>
                      )}
                      {items.goals.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-orange-600" />
                          <span className="text-xs text-muted-foreground">
                            {items.goals.length}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-muted-foreground">Habits completed</span>
          </div>
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-blue-600" />
            <span className="text-muted-foreground">Todos due</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-600" />
            <span className="text-muted-foreground">Goal deadlines</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
