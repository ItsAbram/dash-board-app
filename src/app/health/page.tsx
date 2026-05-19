"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type WorkoutStatus = "planned" | "complete" | "open" | "recovery";

type WorkoutDay = {
  id: string;
  date: string;
  day: string;
  focus: string;
  status: WorkoutStatus;
  volume: number;
  rpe: number | null;
  tags: string[];
  notes: string;
  source: string;
};

type BlockWeek = {
  id: string;
  label: string;
  phase: string;
  targetVolume: number;
  targetRpe: number;
};

const initialWorkouts: WorkoutDay[] = [
  {
    id: "2026-05-18",
    date: "2026-05-18",
    day: "Mon",
    focus: "Lower Strength",
    status: "complete",
    volume: 14250,
    rpe: 8,
    tags: ["Squat", "Heavy"],
    notes: "Top set moved well. Keep hinge work controlled.",
    source: "Jefit",
  },
  {
    id: "2026-05-19",
    date: "2026-05-19",
    day: "Tue",
    focus: "Upper Volume",
    status: "planned",
    volume: 9800,
    rpe: 7,
    tags: ["Bench", "Back"],
    notes: "Add one back-off set if shoulder feels clean.",
    source: "Manual",
  },
  {
    id: "2026-05-20",
    date: "2026-05-20",
    day: "Wed",
    focus: "Recovery",
    status: "recovery",
    volume: 0,
    rpe: null,
    tags: ["Sleep", "Mobility"],
    notes: "Pull Garmin sleep, steps, and readiness before adjusting Thursday.",
    source: "Garmin",
  },
  {
    id: "2026-05-21",
    date: "2026-05-21",
    day: "Thu",
    focus: "Deadlift",
    status: "open",
    volume: 11800,
    rpe: 8,
    tags: ["Pull", "Posterior"],
    notes: "Choose conventional or RDL based on recovery trend.",
    source: "Manual",
  },
  {
    id: "2026-05-22",
    date: "2026-05-22",
    day: "Fri",
    focus: "Conditioning",
    status: "planned",
    volume: 3200,
    rpe: 6,
    tags: ["Zone 2", "Intervals"],
    notes: "Keep this below threshold unless sleep score rebounds.",
    source: "Garmin",
  },
  {
    id: "2026-05-23",
    date: "2026-05-23",
    day: "Sat",
    focus: "Accessories",
    status: "open",
    volume: 7600,
    rpe: 7,
    tags: ["Arms", "Core"],
    notes: "Optional session. Use as volume buffer.",
    source: "Sheets",
  },
  {
    id: "2026-05-24",
    date: "2026-05-24",
    day: "Sun",
    focus: "Off",
    status: "recovery",
    volume: 0,
    rpe: null,
    tags: ["Rest"],
    notes: "Review weekly totals and build next week.",
    source: "Manual",
  },
];

const initialBlockWeeks: BlockWeek[] = [
  { id: "week-1", label: "Week 1", phase: "Base", targetVolume: 42000, targetRpe: 6.8 },
  { id: "week-2", label: "Week 2", phase: "Build", targetVolume: 51000, targetRpe: 7.3 },
  { id: "week-3", label: "Week 3", phase: "Peak", targetVolume: 58000, targetRpe: 8.1 },
  { id: "week-4", label: "Week 4", phase: "Deload", targetVolume: 31000, targetRpe: 5.9 },
];

const dataSources = [
  { name: "Garmin", payload: "sleep, readiness, HR, cardio load", status: "bridge" },
  { name: "Jefit", payload: "strength sessions, exercises, sets", status: "export" },
  { name: "Sheets", payload: "first import adapter and cleanup layer", status: "first" },
  { name: "MyNetDiary", payload: "nutrition totals and body weight", status: "later" },
];

function statusClass(status: WorkoutStatus) {
  if (status === "complete") return "border-[#22c55e] bg-[#142317] text-[#86efac]";
  if (status === "planned") return "border-[#f59e0b] bg-[#2b2110] text-[#fbbf24]";
  if (status === "recovery") return "border-[#38bdf8] bg-[#10232b] text-[#7dd3fc]";
  return "border-[#525252] bg-[#1f1f1f] text-[#d4d4d8]";
}

function dayLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("en-US", { weekday: "short" });
}

function displayDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function tagsFromInput(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function HealthPage() {
  const [blockName, setBlockName] = useState("Hypertrophy Block");
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [blockWeeks, setBlockWeeks] = useState(initialBlockWeeks);
  const [selectedId, setSelectedId] = useState(initialWorkouts[1].id);
  const selectedWorkout = workouts.find((workout) => workout.id === selectedId) ?? workouts[0];

  const totals = useMemo(() => {
    const trainingDays = workouts.filter((workout) => workout.status !== "recovery");
    const rpeDays = workouts.filter((workout) => workout.rpe !== null);
    const volume = workouts.reduce((sum, workout) => sum + workout.volume, 0);
    const averageRpe = rpeDays.length ? rpeDays.reduce((sum, workout) => sum + (workout.rpe ?? 0), 0) / rpeDays.length : 0;

    return {
      volume,
      averageRpe: averageRpe.toFixed(1),
      completed: workouts.filter((workout) => workout.status === "complete").length,
      trainingDays: trainingDays.length,
    };
  }, [workouts]);

  function updateSelectedWorkout(patch: Partial<WorkoutDay>) {
    setWorkouts((current) =>
      current.map((workout) => {
        if (workout.id !== selectedWorkout.id) return workout;
        const nextDate = patch.date ?? workout.date;
        return {
          ...workout,
          ...patch,
          day: patch.date ? dayLabel(nextDate) : workout.day,
        };
      }),
    );
  }

  function addWorkout(event: FormEvent) {
    event.preventDefault();
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + workouts.length);
    const date = nextDate.toISOString().slice(0, 10);
    const workout = {
      id: `${date}-${Date.now()}`,
      date,
      day: dayLabel(date),
      focus: "New Workout",
      status: "open" as const,
      volume: 0,
      rpe: null,
      tags: [],
      notes: "",
      source: "Manual",
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
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Dashboard / Workouts</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black uppercase leading-none md:text-6xl">Workout Manager</h1>
              <input
                aria-label="Block name"
                className="field max-w-sm font-black uppercase"
                onChange={(event) => setBlockName(event.target.value)}
                value={blockName}
              />
            </div>
            <p className="mt-2 max-w-5xl text-sm uppercase leading-relaxed text-[#a1a1aa]">
              Manage imported workouts, assign training days, tag context, track weekly volume and RPE, and keep notes tied to the day.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]">
            <Metric label="Volume" value={`${Math.round(totals.volume / 1000)}k`} />
            <Metric label="Avg RPE" value={totals.averageRpe} />
            <Metric label="Done" value={`${totals.completed}/${workouts.length}`} />
            <Metric label="Days" value={`${totals.trainingDays}`} />
          </div>
        </header>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.8fr)]">
          <section className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Calendar View</p>
                <h2 className="text-2xl font-black uppercase leading-none">{blockName}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="outline-action px-3" type="button">
                  Import Data
                </button>
                <button className="action px-3" onClick={addWorkout} type="button">
                  Add Day
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
              {workouts.map((workout) => (
                <button
                  className={`grid min-h-44 content-between rounded-lg border p-3 text-left transition ${
                    selectedWorkout.id === workout.id ? "border-[#f59e0b] bg-[#2a2a2a]" : "border-[#3a3a3a] bg-[#151515] hover:border-[#737373]"
                  }`}
                  key={workout.id}
                  onClick={() => setSelectedId(workout.id)}
                  type="button"
                >
                  <span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase text-[#a1a1aa]">{workout.day}</span>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusClass(workout.status)}`}>{workout.status}</span>
                    </span>
                    <span className="mt-3 block text-2xl font-black uppercase leading-none">{displayDate(workout.date)}</span>
                    <span className="mt-2 block text-sm font-black uppercase leading-tight text-[#d4d4d8]">{workout.focus}</span>
                  </span>
                  <span className="grid gap-2 text-xs uppercase text-[#a1a1aa]">
                    <span className="flex justify-between gap-3">
                      <span>{workout.volume.toLocaleString()} lb</span>
                      <span>{workout.rpe ? `RPE ${workout.rpe}` : "No RPE"}</span>
                    </span>
                    <span className="truncate">Tags: {workout.tags.length ? workout.tags.join(", ") : "none"}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <aside className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Day Editor</p>
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
              Workout
              <input className="field" onChange={(event) => updateSelectedWorkout({ focus: event.target.value })} value={selectedWorkout.focus} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
                Status
                <select
                  className="field"
                  onChange={(event) => updateSelectedWorkout({ status: event.target.value as WorkoutStatus })}
                  value={selectedWorkout.status}
                >
                  <option value="open">Open</option>
                  <option value="planned">Planned</option>
                  <option value="complete">Complete</option>
                  <option value="recovery">Recovery</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
                Source
                <select className="field" onChange={(event) => updateSelectedWorkout({ source: event.target.value })} value={selectedWorkout.source}>
                  <option>Manual</option>
                  <option>Garmin</option>
                  <option>Jefit</option>
                  <option>Sheets</option>
                  <option>MyNetDiary</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
                Volume
                <input
                  className="field"
                  min="0"
                  onChange={(event) => updateSelectedWorkout({ volume: Number(event.target.value) || 0 })}
                  type="number"
                  value={selectedWorkout.volume}
                />
              </label>
              <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
                RPE
                <input
                  className="field"
                  max="10"
                  min="0"
                  onChange={(event) => updateSelectedWorkout({ rpe: event.target.value ? Number(event.target.value) : null })}
                  step="0.5"
                  type="number"
                  value={selectedWorkout.rpe ?? ""}
                />
              </label>
            </div>
            <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
              Tags
              <input className="field" onChange={(event) => updateSelectedWorkout({ tags: tagsFromInput(event.target.value) })} value={selectedWorkout.tags.join(", ")} />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
              Notes
              <textarea
                className="min-h-28 w-full resize-none rounded-lg border border-[#3a3a3a] bg-[#111111] p-3 text-sm uppercase leading-relaxed text-[#f4f4f5] outline-none focus:border-[#f59e0b]"
                onChange={(event) => updateSelectedWorkout({ notes: event.target.value })}
                value={selectedWorkout.notes}
              />
            </label>
          </aside>
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Block Builder</p>
            <div className="mt-3 grid gap-2">
              {blockWeeks.map((week) => (
                <div className="grid gap-2 rounded-lg border border-[#3a3a3a] bg-[#151515] p-3 lg:grid-cols-[1fr_1fr_120px_90px]" key={week.id}>
                  <input className="field" onChange={(event) => updateBlockWeek(week.id, { label: event.target.value })} value={week.label} />
                  <input className="field" onChange={(event) => updateBlockWeek(week.id, { phase: event.target.value })} value={week.phase} />
                  <input
                    className="field"
                    min="0"
                    onChange={(event) => updateBlockWeek(week.id, { targetVolume: Number(event.target.value) || 0 })}
                    type="number"
                    value={week.targetVolume}
                  />
                  <input
                    className="field"
                    max="10"
                    min="0"
                    onChange={(event) => updateBlockWeek(week.id, { targetRpe: Number(event.target.value) || 0 })}
                    step="0.1"
                    type="number"
                    value={week.targetRpe}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Data Sources</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {dataSources.map((source) => (
                <article className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-3" key={source.name}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black uppercase leading-none">{source.name}</h3>
                    <span className="rounded-full border border-[#525252] px-2 py-1 text-[10px] font-black uppercase text-[#d4d4d8]">{source.status}</span>
                  </div>
                  <p className="mt-2 text-xs uppercase leading-relaxed text-[#a1a1aa]">{source.payload}</p>
                </article>
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
