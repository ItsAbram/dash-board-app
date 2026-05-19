import { CalendarDay, CalendarMode, DashboardState } from "@/types/dashboard";

const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

export function buildCalendarDays(selectedDateKey: string, state: DashboardState, mode: CalendarMode): CalendarDay[] {
  const selectedDate = new Date(`${selectedDateKey}T12:00:00`);
  const start = getCalendarStart(selectedDate, mode);
  const dayCount = mode === "month" ? getMonthGridDayCount(start, selectedDate) : 7;
  const today = toDateKey(new Date());

  return Array.from({ length: dayCount }, (_, index) => {
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

export function shiftCalendar(dateKey: string, mode: CalendarMode, amount: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  if (mode === "month") {
    date.setMonth(date.getMonth() + amount);
    return toDateKey(date);
  }
  date.setDate(date.getDate() + amount * 7);
  return toDateKey(date);
}

function getCalendarStart(selectedDate: Date, mode: CalendarMode) {
  const start = new Date(selectedDate);
  if (mode === "month") {
    start.setDate(1);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }
  start.setDate(selectedDate.getDate() - selectedDate.getDay());
  return start;
}

function getMonthGridDayCount(start: Date, selectedDate: Date) {
  const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 12);
  end.setDate(end.getDate() + (6 - end.getDay()));
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}
