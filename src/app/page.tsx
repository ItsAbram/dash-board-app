"use client";

import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { OperatorCanvas } from "@/components/dashboard/OperatorCanvas";
import { cloudRowId, createId, createStarterState, localStorageKey, normalizeState, todayKey } from "@/lib/dashboard-state";
import { supabase } from "@/lib/supabase-client";
import { DashboardState } from "@/types/dashboard";
import { FormEvent, useEffect, useMemo, useState } from "react";

const starterState = createStarterState();

export default function Home() {
  const [state, setState] = useState<DashboardState>(starterState);
  const [habitTitle, setHabitTitle] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [status, setStatus] = useState("Local memory ready.");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    window.setTimeout(() => {
      const saved = window.localStorage.getItem(localStorageKey);
      if (saved) {
        try {
          setState(normalizeState(JSON.parse(saved)));
        } catch {
          setState(starterState);
        }
      }
      setIsLoaded(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      window.localStorage.setItem(localStorageKey, JSON.stringify(state));
    }
  }, [isLoaded, state]);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    [],
  );

  const stats = useMemo(() => {
    const completedHabits = state.habits.filter((habit) => habit.checkins[todayKey]).length;
    const openTasks = state.tasks.filter((task) => !task.done).length;
    const completedTasks = state.tasks.length - openTasks;
    const score = state.habits.length ? Math.round((completedHabits / state.habits.length) * 100) : 0;

    return {
      completedHabits,
      totalHabits: state.habits.length,
      openTasks,
      completedTasks,
      score,
    };
  }, [state.habits, state.tasks]);

  function setFocus(value: string) {
    setState({ ...state, focus: { ...state.focus, [todayKey]: value } });
  }

  function addHabit(event: FormEvent) {
    event.preventDefault();
    const title = habitTitle.trim();
    if (!title) return;
    setState({ ...state, habits: [{ id: createId(), title, checkins: {} }, ...state.habits] });
    setHabitTitle("");
  }

  function addTask(event: FormEvent) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    setState({
      ...state,
      tasks: [{ id: createId(), title, done: false, createdAt: new Date().toISOString() }, ...state.tasks],
    });
    setTaskTitle("");
  }

  function toggleHabit(habitId: string) {
    setState({
      ...state,
      habits: state.habits.map((habit) => {
        if (habit.id !== habitId) return habit;
        const checkins = { ...habit.checkins };
        if (checkins[todayKey]) delete checkins[todayKey];
        else checkins[todayKey] = new Date().toISOString();
        return { ...habit, checkins };
      }),
    });
  }

  function deleteHabit(habitId: string) {
    setState({ ...state, habits: state.habits.filter((habit) => habit.id !== habitId) });
  }

  function toggleTask(taskId: string) {
    setState({
      ...state,
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    });
  }

  function deleteTask(taskId: string) {
    setState({ ...state, tasks: state.tasks.filter((task) => task.id !== taskId) });
  }

  async function saveCloud() {
    if (!supabase) {
      setStatus("Add Supabase env vars, then restart the dev server.");
      return;
    }

    setStatus("Saving to Supabase...");
    const { error } = await supabase
      .from("dashboard_state")
      .upsert({ id: cloudRowId, data: state, updated_at: new Date().toISOString() });

    setStatus(error ? `Cloud save failed: ${error.message}` : "Saved to Supabase.");
  }

  async function loadCloud() {
    if (!supabase) {
      setStatus("Add Supabase env vars, then restart the dev server.");
      return;
    }

    setStatus("Loading from Supabase...");
    const { data, error } = await supabase.from("dashboard_state").select("data").eq("id", cloudRowId).maybeSingle();
    if (error) {
      setStatus(`Cloud load failed: ${error.message}`);
      return;
    }
    if (!data?.data) {
      setStatus("No cloud save found yet.");
      return;
    }

    setState(normalizeState(data.data));
    setStatus("Loaded from Supabase.");
  }

  return (
    <main className="min-h-screen bg-[#080a0a] px-3 py-3 font-mono text-[#f2f0e8]">
      <section className="mx-auto grid min-h-[calc(100vh-24px)] max-w-7xl grid-rows-[auto_1fr] border border-[#2b302c] bg-[#0b0d0d] lg:grid-cols-[1fr_390px] lg:grid-rows-1">
        <OperatorCanvas cloudReady={Boolean(supabase)} focus={state.focus[todayKey] || ""} stats={stats} todayLabel={todayLabel} />
        <ControlPanel
          habitTitle={habitTitle}
          onAddHabit={addHabit}
          onAddTask={addTask}
          onDeleteHabit={deleteHabit}
          onDeleteTask={deleteTask}
          onFocusChange={setFocus}
          onHabitTitleChange={setHabitTitle}
          onLoadCloud={loadCloud}
          onSaveCloud={saveCloud}
          onTaskTitleChange={setTaskTitle}
          onToggleHabit={toggleHabit}
          onToggleTask={toggleTask}
          state={state}
          stats={stats}
          status={status}
          taskTitle={taskTitle}
          todayKey={todayKey}
          todayLabel={todayLabel}
        />
      </section>
    </main>
  );
}
