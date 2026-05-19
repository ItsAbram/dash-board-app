export type WorkoutBlock = {
  user_id: string;
  block_id: string;
  block_name: string;
  start_date: string;
  end_date: string;
  goal: string;
  notes: string;
  updated_at?: string;
};

export type WorkoutSession = {
  user_id: string;
  session_id: string;
  block_id: string;
  date: string;
  session_name: string;
  template_name: string;
  priority: string;
  estimated_minutes: number | null;
  tags: string[];
  notes: string;
  updated_at?: string;
};

export type WorkoutExercise = {
  user_id: string;
  exercise_id: string;
  session_id: string;
  order_index: number;
  exercise_name: string;
  sets: string;
  reps: string;
  target_load: string;
  notes: string;
  updated_at?: string;
};

export type WorkoutSessionCompletion = {
  user_id: string;
  session_id: string;
  status: "complete" | "skipped";
  completed_at: string;
  notes: string;
  updated_at?: string;
};

export type WorkoutExerciseCompletion = {
  user_id: string;
  exercise_id: string;
  done: boolean;
  completed_at: string | null;
  actual_sets: string;
  actual_reps: string;
  actual_load: string;
  actual_rpe: string;
  notes: string;
  updated_at?: string;
};

export type WorkoutSyncWarning = {
  sheet: string;
  row: number;
  message: string;
};

export type WorkoutSyncResult = {
  ok: boolean;
  counts: {
    blocks: number;
    sessions: number;
    exercises: number;
  };
  warnings: WorkoutSyncWarning[];
};
