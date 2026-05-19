"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type WorkoutStatus = "draft" | "planned" | "complete" | "rest";
type Priority = "low" | "normal" | "high";

type WorkoutDay = {
  id: string;
  date: string;
  day: string;
  title: string;
  template: string;
  status: WorkoutStatus;
  priority: Priority;
  duration: number;
  exercises: string[];
  tags: string[];
  notes: string;
};

type BlockWeek = {
  id: string;
  label: string;
  phase: string;
  focus: string;
  sessions: number;
};

const initialWorkouts: WorkoutDay[] = [
  {
    id: "2026-05-18",
    date: "2026-05-18",
    day: "Mon",
    title: "Lower Strength",
    template: "Strength A",
    status: "complete",
    priority: "high",
    duration: 75,
    exercises: ["Back squat", "Romanian deadlift", "Leg press", "Calf raise"],
    tags: ["Squat", "Heavy"],
    notes: "Keep hinge work controlled. Use this as the anchor day.",
  },
  {
    id: "2026-05-19",
    date: "2026-05-19",
    day: "Tue",
    title: "Upper Hypertrophy",
    template: "Upper B",
    status: "planned",
    priority: "normal",
    duration: 65,
    exercises: ["Bench press", "Chest-supported row", "Incline dumbbell press", "Lat pulldown"],
    tags: ["Bench", "Back"],
    notes: "Add one back-off set only if shoulders feel clean.",
  },
  {
    id: "2026-05-20",
    date: "2026-05-20",
    day: "Wed",
    title: "Recovery",
    template: "Recovery",
    status: "rest",
    priority: "low",
    duration: 30,
    exercises: ["Walk", "Hip mobility", "T-spine rotation"],
    tags: ["Mobility", "Easy"],
    notes: "Keep it light. This day protects the second half of the week.",
  },
  {
    id: "2026-05-21",
    date: "2026-05-21",
    day: "Thu",
    title: "Deadlift Focus",
    template: "Strength B",
    status: "draft",
    priority: "high",
    duration: 70,
    exercises: ["Deadlift", "Front squat", "Hamstring curl", "Loaded carry"],
    tags: ["Pull", "Posterior"],
    notes: "Choose conventional or RDL based on how Wednesday feels.",
  },
  {
    id: "2026-05-22",
    date: "2026-05-22",
    day: "Fri",
    title: "Conditioning",
    template: "Engine",
    status: "planned",
    priority: "normal",
    duration: 40,
    exercises: ["Zone 2 bike", "Intervals", "Core circuit"],
    tags: ["Zone 2", "Intervals"],
    notes: "Keep this below threshold unless recovery looks strong.",
  },
  {
    id: "2026-05-23",
    date: "2026-05-23",
    day: "Sat",
    title: "Accessories",
    template: "Pump",
    status: "draft",
    priority: "low",
    duration: 45,
    exercises: ["Lateral raise", "Cable curl", "Triceps pressdown", "Ab wheel"],
    tags: ["Arms", "Core"],
    notes: "Optional session. Use as a flexible accessory slot.",
  },
  {
    id: "2026-05-24",
    date: "2026-05-24",
    day: "Sun",
    title: "Off",
    template: "Rest",
    status: "rest",
    priority: "low",
    duration: 0,
    exercises: [],
    tags: ["Rest"],
    notes: "Review the block and set the next week.",
  },
];

const initialBlockWeeks: BlockWeek[] = [
  { id: "week-1", label: "Week 1", phase: "Base", focus: "Technique and repeatable sessions", sessions: 4 },
  { id: "week-2", label: "Week 2", phase: "Build", focus: "Add one hard set to priority lifts", sessions: 5 },
  { id: "week-3", label: "Week 3", phase: "Peak", focus: "Keep intensity high, reduce junk work", sessions: 4 },
  { id: "week-4", label: "Week 4", phase: "Deload", focus: "Reduce stress and keep movement quality", sessions: 3 },
];

const templates = ["Strength A", "Upper B", "Recovery", "Strength B", "Engine", "Pump", "Rest"];

function statusClass(status: WorkoutStatus) {
  if (status === "complete") return "border-[#22c55e] bg-[#142317] text-[#86efac]";
  if (status === "planned") return "border-[#f59e0b] bg-[#2b2110] text-[#fbbf24]";
  if (status === "rest") return "border-[#38bdf8] bg-[#10232b] text-[#7dd3fc]";
  return "border-[#525252] bg-[#1f1f1f] text-[#d4d4d8]";
}

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
}

function displayDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function splitList(value: string) {
  return value
    .split("\n")
    .flatMap((line) => line.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function HealthPage() {
  const [blockName, setBlockName] = useState("Hypertrophy Block");
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [blockWeeks, setBlockWeeks] = useState(initialBlockWeeks);
  const [selectedId, setSelectedId] = useState(initialWorkouts[1].id);
  const selectedWorkout = workouts.find((workout) => workout.id === selectedId) ?? workouts[0];

  const totals = useMemo(() => {
    const planned = workouts.filter((workout) => workout.status === "planned").length;
    const draft = workouts.filter((workout) => workout.status === "draft").length;
    const trainingDays = workouts.filter((workout) => workout.status !== "rest").length;
    const exerciseCount = workouts.reduce((sum, workout) => sum + workout.exercises.length, 0);

    return { planned, draft, trainingDays, exerciseCount };
  }, [workouts]);

  function updateSelectedWorkout(patch: Partial<WorkoutDay>) {
    setWorkouts((current) =>
      current.map((workout) => {
        if (workout.id !== selectedWorkout.id) return workout;
        const nextDate = patch.date ?? workout.date;
        return { ...workout, ...patch, day: patch.date ? dayLabel(nextDate) : workout.day };
      }),
    );
  }

  function addWorkout() {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + workouts.length);
    const date = nextDate.toISOString().slice(0, 10);
    const workout: WorkoutDay = {
      id: `${date}-${Date.now()}`,
      date,
      day: dayLabel(date),
      title: "New Session",
      template: "Strength A",
      status: "draft",
      priority: "normal",
      duration: 60,
      exercises: [],
      tags: [],
      notes: "",
    };
    setWorkouts((current) => [...current, workout]);
    setSelectedId(workout.id);
  }

  function deleteSelectedWorkout() {
    if (workouts.length === 1) return;
    const nextWorkouts = workouts.filter((workout) => workout.id !== selectedWorkout.id);
    setWorkouts(nextWorkouts);
    setSelectedId(nextWorkouts[0].id);
  }

  function updateBlockWeek(id: string, patch: Partial<BlockWeek>) {
    setBlockWeeks((current) => current.map((week) => (week.id === id ? { ...week, ...patch } : week)));
  }

  return (
    <main className="min-h-screen bg-[#111111] px-3 py-3 font-mono text-[#f4f4f5]">
      <section className="grid min-h-[calc(100vh-24px)] content-start gap-3 rounded-lg border border-[#3a3a3a] bg-[#111111] p-3">
        <header className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Dashboard / Workout Planning</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black uppercase leading-none md:text-6xl">Workout Planner</h1>
              <input aria-label="Block name" className="field max-w-sm font-black uppercase" onChange={(event) => setBlockName(event.target.value)} value={blockName} />
            </div>
            <p className="mt-2 max-w-5xl text-sm uppercase leading-relaxed text-[#a1a1aa]">
              Create sessions, assign days, build blocks, manage templates, tags, and notes. Performance data can come later in a separate analysis view.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]">
            <Metric label="Planned" value={String(totals.planned)} />
            <Metric label="Drafts" value={String(totals.draft)} />
            <Metric label="Train Days" value={String(totals.trainingDays)} />
            <Metric label="Exercises" value={String(totals.exerciseCount)} />
          </div>
        </header>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(380px,0.85fr)]">
          <section className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Week View</p>
                <h2 className="text-2xl font-black uppercase leading-none">{blockName}</h2>
              </div>
              <button className="action px-3" onClick={addWorkout} type="button">
                Add Day
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
              {workouts.map((workout) => (
                <button
                  className={`grid min-h-36 content-start gap-3 rounded-lg border p-3 text-left transition ${
                    selectedWorkout.id === workout.id ? "border-[#f59e0b] bg-[#2a2a2a]" : "border-[#3a3a3a] bg-[#151515] hover:border-[#737373]"
                  }`}
                  key={workout.id}
                  onClick={() => setSelectedId(workout.id)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase text-[#a1a1aa]">{workout.day}</span>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusClass(workout.status)}`}>{workout.status}</span>
                  </span>
                  <span>
                    <span className="block text-2xl font-black uppercase leading-none">{displayDate(workout.date)}</span>
                    <span className="mt-2 block text-sm font-black uppercase leading-tight text-[#d4d4d8]">{workout.title}</span>
                  </span>
                  <span className="grid gap-1 text-xs uppercase text-[#a1a1aa]">
                    <span>{workout.template}</span>
                    <span>{workout.duration ? `${workout.duration} min` : "No duration"}</span>
                    <span className="truncate">Tags: {workout.tags.length ? workout.tags.join(", ") : "none"}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <aside className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Session Editor</p>
                <h2 className="mt-1 text-2xl font-black uppercase leading-none">{displayDate(selectedWorkout.date)}</h2>
              </div>
              <button className="outline-action border-[#ef4444] px-3 text-[#ef4444]" onClick={deleteSelectedWorkout} type="button">
                Delete
              </button>
            </div>

            <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
              Date
              <input className="field" onChange={(event) => updateSelectedWorkout({ date: event.target.value })} type="date" value={selectedWorkout.date} />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
              Session Name
              <input className="field" onChange={(event) => updateSelectedWorkout({ title: event.target.value })} value={selectedWorkout.title} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
                Status
                <select className="field" onChange={(event) => updateSelectedWorkout({ status: event.target.value as WorkoutStatus })} value={selectedWorkout.status}>
                  <option value="draft">Draft</option>
                  <option value="planned">Planned</option>
                  <option value="complete">Complete</option>
                  <option value="rest">Rest</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
                Priority
                <select className="field" onChange={(event) => updateSelectedWorkout({ priority: event.target.value as Priority })} value={selectedWorkout.priority}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-2">
              <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
                Template
                <select className="field" onChange={(event) => updateSelectedWorkout({ template: event.target.value })} value={selectedWorkout.template}>
                  {templates.map((template) => (
                    <option key={template}>{template}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
                Minutes
                <input
                  className="field"
                  min="0"
                  onChange={(event) => updateSelectedWorkout({ duration: Number(event.target.value) || 0 })}
                  type="number"
                  value={selectedWorkout.duration}
                />
              </label>
            </div>
            <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
              Exercises
              <textarea
                className="min-h-28 w-full resize-none rounded-lg border border-[#3a3a3a] bg-[#111111] p-3 text-sm uppercase leading-relaxed text-[#f4f4f5] outline-none focus:border-[#f59e0b]"
                onChange={(event) => updateSelectedWorkout({ exercises: splitList(event.target.value) })}
                value={selectedWorkout.exercises.join("\n")}
              />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
              Tags
              <input className="field" onChange={(event) => updateSelectedWorkout({ tags: splitList(event.target.value) })} value={selectedWorkout.tags.join(", ")} />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
              Notes
              <textarea
                className="min-h-24 w-full resize-none rounded-lg border border-[#3a3a3a] bg-[#111111] p-3 text-sm uppercase leading-relaxed text-[#f4f4f5] outline-none focus:border-[#f59e0b]"
                onChange={(event) => updateSelectedWorkout({ notes: event.target.value })}
                value={selectedWorkout.notes}
              />
            </label>
          </aside>
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Block Builder</p>
            <div className="mt-3 grid gap-2">
              {blockWeeks.map((week) => (
                <div className="grid gap-2 rounded-lg border border-[#3a3a3a] bg-[#151515] p-3 lg:grid-cols-[0.7fr_0.8fr_1.8fr_120px]" key={week.id}>
                  <input className="field" onChange={(event) => updateBlockWeek(week.id, { label: event.target.value })} value={week.label} />
                  <input className="field" onChange={(event) => updateBlockWeek(week.id, { phase: event.target.value })} value={week.phase} />
                  <input className="field" onChange={(event) => updateBlockWeek(week.id, { focus: event.target.value })} value={week.focus} />
                  <input
                    className="field"
                    min="0"
                    onChange={(event) => updateBlockWeek(week.id, { sessions: Number(event.target.value) || 0 })}
                    type="number"
                    value={week.sessions}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Template Library</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {templates.map((template) => (
                <button
                  className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-3 text-left text-sm font-black uppercase text-[#d4d4d8] hover:border-[#f59e0b]"
                  key={template}
                  onClick={() => updateSelectedWorkout({ template })}
                  type="button"
                >
                  {template}
                </button>
              ))}
            </div>
            <Link className="outline-action mt-3 grid place-items-center px-3" href="/">
              Back to Main Dashboard
            </Link>
          </section>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-[#3a3a3a] bg-[#111111] p-3">
      <p className="text-xs font-black uppercase tracking-wide text-[#a1a1aa]">{label}</p>
      <p className="mt-2 text-3xl font-black uppercase leading-none">{value}</p>
    </article>
  );
}
