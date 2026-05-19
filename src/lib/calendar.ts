import { CalendarDay, DashboardState } from "@/types/dashboard";

const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

export function shiftDateKey(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function buildCalendarDays(selectedDateKey: string, state: DashboardState): CalendarDay[] {
  const selectedDate = new Date(`${selectedDateKey}T12:00:00`);
  const start = new Date(selectedDate);
  start.setDate(selectedDate.getDate() - 3);
  const today = toDateKey(new Date());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    const completedHabits = state.habits.filter((habit) => habit.checkins[key]).length;
    const score = state.habits.length ? Math.round((completedHabits / state.habits.length) * 100) : 0;

    return {
      key,
      dayName: dayFormatter.format(date),
      dayNumber: String(date.getDate()).padStart(2, "0"),
      monthName: monthFormatter.format(date),
      isToday: key === today,
      isSelected: key === selectedDateKey,
      score,
      taskCount: state.tasks.filter((task) => task.dateKey === key).length,
    };
  });
}
