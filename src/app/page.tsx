"use client";

import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";
import { buildCalendarDays, formatLongDate, shiftCalendar } from "@/lib/calendar";
import { cloudRowId, createId, createStarterState, localStorageKey, normalizeState, todayKey } from "@/lib/dashboard-state";
import { supabase } from "@/lib/supabase-client";
import { CalendarMode, DashboardState } from "@/types/dashboard";
import { FormEvent, useEffect, useMemo, useState } from "react";

const starterState = createStarterState();

export default function Home() {
  const [state, setState] = useState<DashboardState>(starterState);
  const [habitTitle, setHabitTitle] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [status, setStatus] = useState("Local memory ready.");
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("week");

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

  const todayLabel = useMemo(() => formatLongDate(todayKey), []);
  const selectedDateLabel = useMemo(() => formatLongDate(selectedDateKey), [selectedDateKey]);
  const calendarDays = useMemo(() => buildCalendarDays(selectedDateKey, state, calendarMode), [calendarMode, selectedDateKey, state]);
  const dayTasks = useMemo(() => state.tasks.filter((task) => task.dateKey === selectedDateKey), [selectedDateKey, state.tasks]);

  const stats = useMemo(() => {
    const completedHabits = state.habits.filter((habit) => habit.checkins[selectedDateKey]).length;
    const openTasks = dayTasks.filter((task) => !task.done).length;
    const completedTasks = dayTasks.length - openTasks;
    const score = state.habits.length ? Math.round((completedHabits / state.habits.length) * 100) : 0;

    return {
      completedHabits,
      totalHabits: state.habits.length,
      openTasks,
      completedTasks,
      score,
    };
  }, [dayTasks, selectedDateKey, state.habits]);

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
      tasks: [{ id: createId(), title, done: false, createdAt: new Date().toISOString(), dateKey: selectedDateKey }, ...state.tasks],
    });
    setTaskTitle("");
  }

  function toggleHabit(habitId: string) {
    setState({
      ...state,
      habits: state.habits.map((habit) => {
        if (habit.id !== habitId) return habit;
        const checkins = { ...habit.checkins };
        if (checkins[selectedDateKey]) delete checkins[selectedDateKey];
        else checkins[selectedDateKey] = new Date().toISOString();
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
    <main className="min-h-screen bg-[#111111] px-3 py-3 font-mono text-[#f4f4f5]">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-7xl rounded-lg border border-[#3a3a3a] bg-[#111111] p-3">
        <DashboardWorkspace
          calendarDays={calendarDays}
          calendarMode={calendarMode}
          cloudReady={Boolean(supabase)}
          dayTasks={dayTasks}
          habitTitle={habitTitle}
          onAddHabit={addHabit}
          onAddTask={addTask}
          onCalendarModeChange={setCalendarMode}
          onDeleteHabit={deleteHabit}
          onDeleteTask={deleteTask}
          onHabitTitleChange={setHabitTitle}
          onLoadCloud={loadCloud}
          onNextCalendar={() => setSelectedDateKey((current) => shiftCalendar(current, calendarMode, 1))}
          onPreviousCalendar={() => setSelectedDateKey((current) => shiftCalendar(current, calendarMode, -1))}
          onSaveCloud={saveCloud}
          onSelectDay={setSelectedDateKey}
          onTaskTitleChange={setTaskTitle}
          onToday={() => setSelectedDateKey(todayKey)}
          onToggleHabit={toggleHabit}
          onToggleTask={toggleTask}
          selectedDateLabel={selectedDateLabel}
          selectedDateKey={selectedDateKey}
          state={state}
          stats={stats}
          status={status}
          taskTitle={taskTitle}
          todayLabel={todayLabel}
        />
      </div>
    </main>
  );
}
