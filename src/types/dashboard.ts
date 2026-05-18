export type Habit = {
  id: string;
  title: string;
  checkins: Record<string, string>;
};

export type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
};

export type DashboardState = {
  habits: Habit[];
  tasks: Task[];
  focus: Record<string, string>;
};

export type DashboardStats = {
  completedHabits: number;
  totalHabits: number;
  openTasks: number;
  completedTasks: number;
  score: number;
};
