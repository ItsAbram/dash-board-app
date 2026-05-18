"use client";

import { createClient } from "@supabase/supabase-js";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Habit = {
  id: string;
  title: string;
  checkins: Record<string, string>;
};

type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
};

type DashboardState = {
  habits: Habit[];
  tasks: Task[];
  focus: Record<string, string>;
};

const todayKey = new Date().toISOString().slice(0, 10);
const localStorageKey = "dash-board-next-state-v1";
const cloudRowId = "main";

const starterState: DashboardState = {
  habits: [
    { id: createId(), title: "Drink water", checkins: {} },
    { id: createId(), title: "Plan the day", checkins: {} },
    { id: createId(), title: "Move for 10 minutes", checkins: {} },
  ],
  tasks: [
    { id: createId(), title: "Create Supabase project", done: false, createdAt: new Date().toISOString() },
    { id: createId(), title: "Deploy dashboard to Vercel", done: false, createdAt: new Date().toISOString() },
  ],
  focus: {},
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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

  const completedHabits = state.habits.filter((habit) => habit.checkins[todayKey]).length;
  const openTasks = state.tasks.filter((task) => !task.done).length;
  const completedTasks = state.tasks.length - openTasks;
  const score = state.habits.length ? Math.round((completedHabits / state.habits.length) * 100) : 0;

  function updateState(nextState: DashboardState) {
    setState(nextState);
  }

  function setFocus(value: string) {
    updateState({ ...state, focus: { ...state.focus, [todayKey]: value } });
  }

  function addHabit(event: FormEvent) {
    event.preventDefault();
    const title = habitTitle.trim();
    if (!title) return;
    updateState({ ...state, habits: [{ id: createId(), title, checkins: {} }, ...state.habits] });
    setHabitTitle("");
  }

  function addTask(event: FormEvent) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    updateState({
      ...state,
      tasks: [{ id: createId(), title, done: false, createdAt: new Date().toISOString() }, ...state.tasks],
    });
    setTaskTitle("");
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
    updateState(normalizeState(data.data));
    setStatus("Loaded from Supabase.");
  }

  return (
    <main className="min-h-screen bg-[#080a0a] px-3 py-3 font-mono text-[#f2f0e8]">
      <section className="mx-auto grid min-h-[calc(100vh-24px)] max-w-7xl grid-rows-[auto_1fr] border border-[#2b302c] bg-[#0b0d0d] lg:grid-cols-[1fr_390px] lg:grid-rows-1">
        <div className="relative min-h-[420px] border-b border-[#2b302c] p-4 lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="grid h-full grid-cols-6 grid-rows-6 gap-2 text-xs uppercase text-[#8f948d]">
            <ConsoleBlock className="col-span-3 row-span-1" label="01 // Operator" title="Online" detail="Personal OS" />
            <ConsoleBlock className="col-span-3 row-span-1" label="02 // Session" title={todayLabel} detail="Local time" />
            <ConsoleBlock className="col-span-6 row-span-2" label="03 // Focus" title={state.focus[todayKey] || "Set today's one thing"} detail="Daily capture" />
            <ConsoleBlock className="col-span-2 row-span-1" label="04 // Habits" title={`${completedHabits}/${state.habits.length}`} detail={`${score}% daily score`} />
            <ConsoleBlock className="col-span-2 row-span-1" label="05 // Tasks" title={`${openTasks} open`} detail={`${completedTasks} completed`} />
            <ConsoleBlock className="col-span-2 row-span-1" label="06 // Cloud" title={supabase ? "Ready" : "Needs env"} detail="Supabase" />
            <ConsoleBlock className="col-span-6 row-span-2" label="07 // Memory" title="Cloud-backed dashboard seed" detail="Habits, tasks, focus first. More later." />
          </div>
        </div>

        <aside className="grid content-start gap-3 overflow-auto border-[#d8ff63]/40 bg-[#080a0a]/95 p-3">
          <header className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#2b302c] pb-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#d8ff63]">Live Layer</p>
              <h1 className="text-3xl font-black uppercase leading-none">Dash Board</h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-[#8f948d]">{todayLabel}</p>
              <strong className="text-2xl font-black text-[#d8ff63]">{score}%</strong>
            </div>
          </header>

          <div className="grid grid-cols-3 gap-2">
            <Metric label="Habits" value={`${completedHabits}/${state.habits.length}`} />
            <Metric label="Open" value={String(openTasks)} />
            <Metric label="Done" value={String(completedTasks)} />
          </div>

          <Panel label="Today I Will">
            <input
              className="field"
              value={state.focus[todayKey] || ""}
              onChange={(event) => setFocus(event.target.value)}
              placeholder="Set today's one thing"
            />
          </Panel>

          <Panel label="Habits">
            <form className="mb-2 grid grid-cols-[1fr_42px] gap-2" onSubmit={addHabit}>
              <input className="field" value={habitTitle} onChange={(event) => setHabitTitle(event.target.value)} placeholder="Add habit" />
              <button className="action" type="submit">+</button>
            </form>
            <div className="grid gap-2">
              {state.habits.map((habit) => (
                <Item
                  key={habit.id}
                  title={habit.title}
                  meta={habit.checkins[todayKey] ? "Done today" : "Waiting"}
                  done={Boolean(habit.checkins[todayKey])}
                  onToggle={() => {
                    const checkins = { ...habit.checkins };
                    if (checkins[todayKey]) delete checkins[todayKey];
                    else checkins[todayKey] = new Date().toISOString();
                    updateState({
                      ...state,
                      habits: state.habits.map((entry) => (entry.id === habit.id ? { ...entry, checkins } : entry)),
                    });
                  }}
                  onDelete={() => updateState({ ...state, habits: state.habits.filter((entry) => entry.id !== habit.id) })}
                />
              ))}
            </div>
          </Panel>

          <Panel label="Tasks">
            <form className="mb-2 grid grid-cols-[1fr_42px] gap-2" onSubmit={addTask}>
              <input className="field" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add task" />
              <button className="action" type="submit">+</button>
            </form>
            <div className="grid gap-2">
              {state.tasks.map((task) => (
                <Item
                  key={task.id}
                  title={task.title}
                  meta={task.done ? "Completed" : "Open"}
                  done={task.done}
                  onToggle={() =>
                    updateState({
                      ...state,
                      tasks: state.tasks.map((entry) => (entry.id === task.id ? { ...entry, done: !entry.done } : entry)),
                    })
                  }
                  onDelete={() => updateState({ ...state, tasks: state.tasks.filter((entry) => entry.id !== task.id) })}
                />
              ))}
            </div>
          </Panel>

          <footer className="grid gap-2 border border-[#2b302c] bg-[#0b0d0d] p-3">
            <p className="text-xs text-[#8f948d]">{status}</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="outline-action" type="button" onClick={loadCloud}>Load Cloud</button>
              <button className="outline-action" type="button" onClick={saveCloud}>Save Cloud</button>
            </div>
          </footer>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#2b302c] bg-[#0b0d0d] p-3">
      <span className="block text-xs font-black uppercase text-[#8f948d]">{label}</span>
      <strong className="mt-1 block text-2xl font-black leading-none">{value}</strong>
    </div>
  );
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="border border-[#2b302c] bg-[#0b0d0d] p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#d8ff63]">{label}</p>
      {children}
    </section>
  );
}

function Item({
  title,
  meta,
  done,
  onToggle,
  onDelete,
}: {
  title: string;
  meta: string;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid min-h-12 grid-cols-[30px_1fr_28px] items-center gap-2 border border-[#2b302c] bg-[#080a0a] p-2">
      <button className={`h-[30px] font-black ${done ? "bg-[#d8ff63] text-[#080a0a]" : "bg-[#171c19] text-[#d8ff63]"}`} type="button" onClick={onToggle}>
        {done ? "OK" : ""}
      </button>
      <div className="min-w-0">
        <p className={`break-words text-sm font-bold ${done ? "text-[#8f948d] line-through" : ""}`}>{title}</p>
        <span className="text-[11px] uppercase text-[#8f948d]">{meta}</span>
      </div>
      <button className="h-7 text-lg text-[#ff6d7a]" type="button" onClick={onDelete}>x</button>
    </div>
  );
}

function ConsoleBlock({ label, title, detail, className }: { label: string; title: string; detail: string; className: string }) {
  return (
    <div className={`${className} grid content-between border border-[#2b302c] bg-[#101312] p-3`}>
      <p className="font-black text-[#d8ff63]">{label}</p>
      <div>
        <strong className="block break-words text-lg font-black text-[#f2f0e8]">{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

function normalizeState(value: unknown): DashboardState {
  const input = value as Partial<DashboardState>;
  return {
    habits: Array.isArray(input.habits) ? input.habits : [],
    tasks: Array.isArray(input.tasks) ? input.tasks : [],
    focus: input.focus && typeof input.focus === "object" ? input.focus : {},
  };
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
