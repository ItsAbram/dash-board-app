"use client";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";
import { buildCalendarDays, formatLongDate, shiftCalendar } from "@/lib/calendar";
import { createId, createStarterState, localStorageKey, normalizeState, todayKey } from "@/lib/dashboard-state";
import { supabase } from "@/lib/supabase-client";
import { Session } from "@supabase/supabase-js";
import { CalendarMode, DashboardState } from "@/types/dashboard";
import { FormEvent, useEffect, useMemo, useState } from "react";

const starterState = createStarterState();

export default function Home() {
  const [state, setState] = useState<DashboardState>(starterState);
  const [habitTitle, setHabitTitle] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [status, setStatus] = useState("Local memory ready.");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasLoadedCloud, setHasLoadedCloud] = useState(false);
  const [lastSavedState, setLastSavedState] = useState("");
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("week");
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("Use your email and password to open the dashboard.");
  const [authBusy, setAuthBusy] = useState(false);

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
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      window.localStorage.setItem(localStorageKey, JSON.stringify(state));
    }
  }, [isLoaded, state]);

  useEffect(() => {
    if (!session?.user) {
      const timeout = window.setTimeout(() => {
        setHasLoadedCloud(false);
        setLastSavedState("");
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    const userId = session.user.id;
    const timeout = window.setTimeout(() => {
      loadCloudForUser(userId);
    }, 0);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [session]);

  useEffect(() => {
    if (!session?.user || !isLoaded || !hasLoadedCloud) return;

    const userId = session.user.id;
    const serialized = JSON.stringify(state);
    if (serialized === lastSavedState) return;

    const statusTimeout = window.setTimeout(() => {
      setStatus("Local changes.");
    }, 0);
    const saveTimeout = window.setTimeout(() => {
      saveCloudForUser(userId, state, serialized);
    }, 900);

    return () => {
      window.clearTimeout(statusTimeout);
      window.clearTimeout(saveTimeout);
    };
  }, [hasLoadedCloud, isLoaded, lastSavedState, session, state]);

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

  async function signUp() {
    if (!supabase) {
      setAuthStatus("Supabase env vars are missing.");
      return;
    }
    if (!authEmail.trim() || !authPassword) {
      setAuthStatus("Enter an email and password first.");
      return;
    }

    setAuthBusy(true);
    setAuthStatus("Creating account...");
    const { error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword });
    setAuthBusy(false);
    setAuthStatus(error ? authMessage(error.message) : "Account created. If email confirmation is enabled, check your inbox before signing in.");
  }

  async function signIn() {
    if (!supabase) {
      setAuthStatus("Supabase env vars are missing.");
      return;
    }
    if (!authEmail.trim() || !authPassword) {
      setAuthStatus("Enter an email and password first.");
      return;
    }

    setAuthBusy(true);
    setAuthStatus("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
    setAuthBusy(false);
    setAuthStatus(error ? authMessage(error.message) : "Signed in.");
  }

  async function signOut() {
    if (!supabase) return;
    setAuthBusy(true);
    const { error } = await supabase.auth.signOut();
    setAuthBusy(false);
    setStatus(error ? `Sign out failed: ${error.message}` : "Signed out.");
  }

  async function saveCloudForUser(userId: string, nextState: DashboardState, serialized = JSON.stringify(nextState)) {
    if (!supabase) {
      setStatus("Add Supabase env vars, then restart the dev server.");
      return;
    }

    setStatus("Saving...");
    const { error } = await supabase
      .from("dashboard_state")
      .upsert({ id: userId, user_id: userId, data: nextState, updated_at: new Date().toISOString() });

    if (error) {
      setStatus(`Save failed: ${error.message}`);
      return;
    }

    setLastSavedState(serialized);
    setStatus("Saved.");
  }

  async function loadCloudForUser(userId: string) {
    if (!supabase) {
      setStatus("Add Supabase env vars, then restart the dev server.");
      return;
    }

    setStatus("Loading cloud data...");
    const { data, error } = await supabase.from("dashboard_state").select("data").eq("id", userId).maybeSingle();
    if (error) {
      setStatus(`Load failed: ${error.message}`);
      setHasLoadedCloud(true);
      return;
    }
    if (!data?.data) {
      setStatus("No cloud save yet. Local state ready.");
      setHasLoadedCloud(true);
      return;
    }

    const nextState = normalizeState(data.data);
    setState(nextState);
    setLastSavedState(JSON.stringify(nextState));
    setHasLoadedCloud(true);
    setStatus("Loaded from cloud.");
  }

  async function saveCloud() {
    if (!session?.user) {
      setStatus("Sign in before saving to cloud.");
      return;
    }
    await saveCloudForUser(session.user.id, state);
  }

  async function loadCloud() {
    if (!session?.user) {
      setStatus("Sign in before loading cloud data.");
      return;
    }
    await loadCloudForUser(session.user.id);
  }

  function authMessage(message: string) {
    if (message.toLowerCase().includes("email not confirmed")) {
      return "Email is not confirmed. Check your inbox, or turn off email confirmations in Supabase while testing.";
    }
    if (message.toLowerCase().includes("security purposes")) {
      return "Supabase is rate limiting signup. Wait 10 seconds, then try again.";
    }
    return message;
  }

  if (!session?.user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#111111] px-4 py-8 font-mono text-[#f4f4f5]">
        <section className="grid w-full max-w-md gap-4 text-center">
          <header className="grid gap-3">
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Private Dashboard</p>
            <h1 className="text-5xl font-black uppercase leading-none">Sign In</h1>
            <p className="mx-auto max-w-sm text-sm uppercase leading-relaxed text-[#a1a1aa]">
              This dashboard is private. Sign in before loading calendar, habits, tasks, and cloud memory.
            </p>
          </header>
          <AuthPanel
            email={authEmail}
            isBusy={authBusy}
            isSignedIn={false}
            onEmailChange={setAuthEmail}
            onPasswordChange={setAuthPassword}
            onSignIn={signIn}
            onSignOut={signOut}
            onSignUp={signUp}
            password={authPassword}
            status={authStatus}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111111] px-3 py-3 font-mono text-[#f4f4f5]">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-7xl rounded-lg border border-[#3a3a3a] bg-[#111111] p-3">
        <DashboardWorkspace
          authEmail={authEmail}
          authBusy={authBusy}
          authPassword={authPassword}
          authStatus={authStatus}
          calendarDays={calendarDays}
          calendarMode={calendarMode}
          cloudReady={Boolean(supabase)}
          dayTasks={dayTasks}
          habitTitle={habitTitle}
          isSignedIn={Boolean(session?.user)}
          onAddHabit={addHabit}
          onAddTask={addTask}
          onAuthEmailChange={setAuthEmail}
          onAuthPasswordChange={setAuthPassword}
          onCalendarModeChange={setCalendarMode}
          onDeleteHabit={deleteHabit}
          onDeleteTask={deleteTask}
          onHabitTitleChange={setHabitTitle}
          onLoadCloud={loadCloud}
          onNextCalendar={() => setSelectedDateKey((current) => shiftCalendar(current, calendarMode, 1))}
          onPreviousCalendar={() => setSelectedDateKey((current) => shiftCalendar(current, calendarMode, -1))}
          onSaveCloud={saveCloud}
          onSelectDay={setSelectedDateKey}
          onSignIn={signIn}
          onSignOut={signOut}
          onSignUp={signUp}
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
          userEmail={session?.user.email}
        />
      </div>
    </main>
  );
}
