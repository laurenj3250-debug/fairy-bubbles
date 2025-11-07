import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // Use local timezone instead of UTC to avoid date shifting issues
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getToday(): string {
  return formatDateInput(new Date());
}

export function getDayOfWeek(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function getDaysInRange(startDate: Date, days: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() - i);
    dates.unshift(formatDateInput(date));
  }
  return dates;
}

export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  
  const sortedDates = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  const today = getToday();
  let currentDate = new Date(today);
  
  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    const expectedDate = new Date(currentDate);
    
    if (formatDateInput(date) === formatDateInput(expectedDate)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (date < expectedDate) {
      break;
    }
  }
  
  return streak;
}

export function getHeatmapIntensity(value: number, max: number): number {
  if (value === 0) return 0;
  if (max === 0) return 1;
  const percentage = value / max;
  if (percentage <= 0.25) return 0.25;
  if (percentage <= 0.5) return 0.5;
  if (percentage <= 0.75) return 0.75;
  return 1;
}
