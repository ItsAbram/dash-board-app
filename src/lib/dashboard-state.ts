import { DashboardState } from "@/types/dashboard";
import { toDateKey } from "@/lib/calendar";

export const todayKey = toDateKey(new Date());
export const localStorageKey = "dash-board-next-state-v1";
export const cloudRowId = "main";

export function createStarterState(): DashboardState {
  return {
    habits: [
      { id: createId(), title: "Drink water", checkins: {} },
      { id: createId(), title: "Plan the day", checkins: {} },
      { id: createId(), title: "Move for 10 minutes", checkins: {} },
    ],
    tasks: [
      { id: createId(), title: "Create Supabase project", done: false, createdAt: new Date().toISOString(), dateKey: todayKey },
      { id: createId(), title: "Deploy dashboard to Vercel", done: false, createdAt: new Date().toISOString(), dateKey: todayKey },
    ],
    focus: {},
  };
}

export function normalizeState(value: unknown): DashboardState {
  const input = value as Partial<DashboardState>;
  return {
    habits: Array.isArray(input.habits) ? input.habits : [],
    tasks: Array.isArray(input.tasks)
      ? input.tasks.map((task) => ({
          ...task,
          dateKey: typeof task.dateKey === "string" ? task.dateKey : todayKey,
        }))
      : [],
    focus: input.focus && typeof input.focus === "object" ? input.focus : {},
  };
}

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
