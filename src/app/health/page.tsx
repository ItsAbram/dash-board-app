"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type WorkoutDay = {
  date: string;
  day: string;
  focus: string;
  status: "planned" | "complete" | "open" | "recovery";
  volume: number;
  rpe: number | null;
  tags: string[];
  notes: string;
};

const trainingDays: WorkoutDay[] = [
  {
    date: "May 18",
    day: "Mon",
    focus: "Lower Strength",
    status: "complete",
    volume: 14250,
    rpe: 8,
    tags: ["Squat", "Heavy"],
    notes: "Top set moved well. Keep hinge work controlled.",
  },
  {
    date: "May 19",
    day: "Tue",
    focus: "Upper Volume",
    status: "planned",
    volume: 9800,
    rpe: 7,
    tags: ["Bench", "Back"],
    notes: "Add one back-off set if shoulder feels clean.",
  },
  {
    date: "May 20",
    day: "Wed",
    focus: "Recovery",
    status: "recovery",
    volume: 0,
    rpe: null,
    tags: ["Sleep", "Mobility"],
    notes: "Pull Garmin sleep, steps, and readiness before adjusting Thursday.",
  },
  {
    date: "May 21",
    day: "Thu",
    focus: "Deadlift",
    status: "open",
    volume: 11800,
    rpe: 8,
    tags: ["Pull", "Posterior"],
    notes: "Choose conventional or RDL based on recovery trend.",
  },
  {
    date: "May 22",
    day: "Fri",
    focus: "Conditioning",
    status: "planned",
    volume: 3200,
    rpe: 6,
    tags: ["Zone 2", "Intervals"],
    notes: "Keep this below threshold unless sleep score rebounds.",
  },
  {
    date: "May 23",
    day: "Sat",
    focus: "Accessories",
    status: "open",
    volume: 7600,
    rpe: 7,
    tags: ["Arms", "Core"],
    notes: "Optional session. Use as volume buffer.",
  },
  {
    date: "May 24",
    day: "Sun",
    focus: "Off",
    status: "recovery",
    volume: 0,
    rpe: null,
    tags: ["Rest"],
    notes: "Review weekly totals and build next week.",
  },
];

const importSources = [
  { name: "Garmin", detail: "Sleep, readiness, HR, activity load", state: "Bridge" },
  { name: "Jefit", detail: "Strength log export or sheet import", state: "Manual" },
  { name: "Sheets", detail: "Fast first API for normalized imports", state: "First" },
  { name: "MyNetDiary", detail: "Nutrition export or Health Connect bridge", state: "Later" },
];

const blockWeeks = [
  { label: "Week 1", load: "Base", volume: "42k", rpe: "6.8" },
  { label: "Week 2", load: "Build", volume: "51k", rpe: "7.3" },
  { label: "Week 3", load: "Peak", volume: "58k", rpe: "8.1" },
  { label: "Week 4", load: "Deload", volume: "31k", rpe: "5.9" },
];

function statusClass(status: WorkoutDay["status"]) {
  if (status === "complete") return "border-[#22c55e] bg-[#142317] text-[#86efac]";
  if (status === "planned") return "border-[#f59e0b] bg-[#2b2110] text-[#fbbf24]";
  if (status === "recovery") return "border-[#38bdf8] bg-[#10232b] text-[#7dd3fc]";
  return "border-[#525252] bg-[#1f1f1f] text-[#d4d4d8]";
}

export default function HealthPage() {
  const [selectedDate, setSelectedDate] = useState(trainingDays[1].date);
  const selectedDay = trainingDays.find((day) => day.date === selectedDate) ?? trainingDays[0];

  const totals = useMemo(() => {
    const completed = trainingDays.filter((day) => day.status === "complete").length;
    const plannedVolume = trainingDays.reduce((sum, day) => sum + day.volume, 0);
    const rpeDays = trainingDays.filter((day) => day.rpe !== null);
    const averageRpe = rpeDays.reduce((sum, day) => sum + (day.rpe ?? 0), 0) / rpeDays.length;

    return {
      completed,
      plannedVolume,
      averageRpe: averageRpe.toFixed(1),
      taggedDays: trainingDays.filter((day) => day.tags.length).length,
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#111111] px-3 py-3 font-mono text-[#f4f4f5]">
      <section className="mx-auto grid min-h-[calc(100vh-24px)] max-w-7xl content-start gap-3 rounded-lg border border-[#3a3a3a] bg-[#111111] p-3">
        <header className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Training Data</p>
            <h1 className="text-4xl font-black uppercase leading-none md:text-6xl">Workout Overview</h1>
            <p className="mt-2 max-w-3xl text-sm uppercase leading-relaxed text-[#a1a1aa]">
              Pull workouts, recovery, sleep, and nutrition into one place, then manage training blocks from the calendar.
            </p>
          </div>
          <Link className="outline-action grid min-h-10 place-items-center px-4" href="/">
            Back to Dashboard
          </Link>
        </header>

        <section className="grid gap-3 lg:grid-cols-4">
          <Metric label="Week Volume" value={`${Math.round(totals.plannedVolume / 1000)}k`} detail="planned pounds" />
          <Metric label="Avg RPE" value={totals.averageRpe} detail="logged training days" />
          <Metric label="Complete" value={`${totals.completed}/7`} detail="sessions this week" />
          <Metric label="Tagged" value={`${totals.taggedDays}`} detail="days with context" />
        </section>

        <section className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Block Calendar</p>
                <h2 className="text-2xl font-black uppercase leading-none">Hypertrophy Block</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="outline-action px-3" type="button">
                  Import
                </button>
                <button className="action px-3" type="button">
                  Build Block
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
              {trainingDays.map((day) => (
                <button
                  className={`grid min-h-40 content-between rounded-lg border p-3 text-left transition ${
                    selectedDay.date === day.date ? "border-[#f59e0b] bg-[#2a2a2a]" : "border-[#3a3a3a] bg-[#151515] hover:border-[#737373]"
                  }`}
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  type="button"
                >
                  <span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase text-[#a1a1aa]">{day.day}</span>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusClass(day.status)}`}>{day.status}</span>
                    </span>
                    <span className="mt-2 block text-lg font-black uppercase leading-tight">{day.date}</span>
                    <span className="mt-1 block text-sm uppercase leading-tight text-[#d4d4d8]">{day.focus}</span>
                  </span>
                  <span className="grid gap-1 text-xs uppercase text-[#a1a1aa]">
                    <span>{day.volume.toLocaleString()} lb</span>
                    <span>{day.rpe ? `RPE ${day.rpe}` : "No RPE"}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <aside className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Selected Day</p>
              <h2 className="mt-1 text-2xl font-black uppercase leading-none">
                {selectedDay.day} {selectedDay.date}
              </h2>
            </div>
            <div className="grid gap-2">
              <Field label="Workout" value={selectedDay.focus} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Volume" value={`${selectedDay.volume.toLocaleString()} lb`} />
                <Field label="RPE" value={selectedDay.rpe ? `${selectedDay.rpe}` : "Recovery"} />
              </div>
              <div className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-3">
                <p className="text-xs font-black uppercase text-[#a1a1aa]">Tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedDay.tags.map((tag) => (
                    <span className="rounded-full border border-[#525252] px-2 py-1 text-xs font-black uppercase text-[#d4d4d8]" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-3">
                <p className="text-xs font-black uppercase text-[#a1a1aa]">Notes</p>
                <p className="mt-2 text-sm uppercase leading-relaxed text-[#d4d4d8]">{selectedDay.notes}</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Block Builder</p>
            <div className="mt-3 grid gap-2">
              {blockWeeks.map((week) => (
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-[#3a3a3a] bg-[#151515] p-3" key={week.label}>
                  <div>
                    <p className="text-sm font-black uppercase">{week.label}</p>
                    <p className="text-xs uppercase text-[#a1a1aa]">{week.load}</p>
                  </div>
                  <p className="text-right text-sm font-black uppercase text-[#d4d4d8]">{week.volume}</p>
                  <p className="text-right text-sm font-black uppercase text-[#f59e0b]">RPE {week.rpe}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Data Sources</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {importSources.map((source) => (
                <div className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-3" key={source.name}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black uppercase leading-none">{source.name}</h3>
                    <span className="rounded-full border border-[#525252] px-2 py-1 text-[10px] font-black uppercase text-[#d4d4d8]">{source.state}</span>
                  </div>
                  <p className="mt-2 text-xs uppercase leading-relaxed text-[#a1a1aa]">{source.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[#a1a1aa]">{label}</p>
      <p className="mt-2 text-4xl font-black uppercase leading-none text-[#f4f4f5]">{value}</p>
      <p className="mt-2 text-xs uppercase text-[#f59e0b]">{detail}</p>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-3">
      <p className="text-xs font-black uppercase text-[#a1a1aa]">{label}</p>
      <p className="mt-2 text-sm font-black uppercase text-[#f4f4f5]">{value}</p>
    </div>
  );
}
