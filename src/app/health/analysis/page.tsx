"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import {
  buildWorkoutAnalysis,
  getDefaultWorkoutBlockId,
  getLiftCategoryLabel,
  LiftFilter,
  WorkoutAnalysisData,
} from "@/lib/workout-analysis";
import {
  WorkoutBlock,
  WorkoutExercise,
  WorkoutExerciseCompletion,
  WorkoutExerciseSet,
  WorkoutSession,
  WorkoutSessionCompletion,
} from "@/types/workouts";
import { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

const emptyData: WorkoutAnalysisData = {
  blocks: [],
  sessions: [],
  exercises: [],
  sessionCompletions: [],
  exerciseCompletions: [],
  exerciseSets: [],
};

const liftOptions: { value: LiftFilter; label: string }[] = [
  { value: "all", label: "All Lifts" },
  { value: "squat", label: "Squat" },
  { value: "bench", label: "Bench" },
  { value: "deadlift", label: "Deadlift" },
  { value: "press", label: "Press" },
  { value: "pull", label: "Pull" },
  { value: "accessory", label: "Accessory" },
];

export default function WorkoutAnalysisPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<WorkoutAnalysisData>(emptyData);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [liftFilter, setLiftFilter] = useState<LiftFilter>("all");
  const [status, setStatus] = useState(supabase ? "Loading analysis..." : "Supabase env vars are missing.");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;
    supabase.auth
      .getSession()
      .then(({ data: authData, error }) => {
        if (!isMounted) return;
        if (error) {
          setStatus(`Auth session failed: ${error.message}`);
          setSession(null);
          return;
        }
        setSession(authData.session);
        if (!authData.session) {
          setStatus("Open the main dashboard and sign in before viewing training analytics.");
        }
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        setStatus(`Auth session failed: ${error.message}`);
        setSession(null);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setStatus("Open the main dashboard and sign in before viewing training analytics.");
      }
    });
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    loadAnalysis(session.user.id);
  }, [session]);

  const activeBlockId = selectedBlockId || getDefaultWorkoutBlockId(data.blocks);
  const analysis = useMemo(() => buildWorkoutAnalysis(data, activeBlockId, liftFilter), [activeBlockId, data, liftFilter]);
  const maxWeeklyVolume = Math.max(1, ...analysis.weekSummaries.map((week) => Math.max(week.actualVolume, week.plannedVolume)));
  const maxLiftVolume = Math.max(1, ...analysis.liftSummaries.map((lift) => lift.volume));

  async function loadAnalysis(userId: string) {
    if (!supabase) return;
    setIsBusy(true);
    setStatus("Loading workout analysis...");

    const [blocksResult, sessionsResult, exercisesResult, sessionCompletionsResult, exerciseCompletionsResult, exerciseSetsResult] = await Promise.all([
      supabase.from("workout_blocks").select("*").eq("user_id", userId).order("start_date", { ascending: true }),
      supabase.from("workout_sessions").select("*").eq("user_id", userId).order("date", { ascending: true }),
      supabase.from("workout_exercises").select("*").eq("user_id", userId).order("order_index", { ascending: true }),
      supabase.from("workout_session_completions").select("*").eq("user_id", userId),
      supabase.from("workout_exercise_completions").select("*").eq("user_id", userId),
      supabase.from("workout_exercise_sets").select("*").eq("user_id", userId).order("set_number", { ascending: true }),
    ]);

    const error =
      blocksResult.error ??
      sessionsResult.error ??
      exercisesResult.error ??
      sessionCompletionsResult.error ??
      exerciseCompletionsResult.error ??
      exerciseSetsResult.error;

    if (error) {
      setStatus(`Load failed: ${error.message}`);
      setIsBusy(false);
      return;
    }

    const nextData: WorkoutAnalysisData = {
      blocks: (blocksResult.data ?? []) as WorkoutBlock[],
      sessions: (sessionsResult.data ?? []) as WorkoutSession[],
      exercises: (exercisesResult.data ?? []) as WorkoutExercise[],
      sessionCompletions: (sessionCompletionsResult.data ?? []) as WorkoutSessionCompletion[],
      exerciseCompletions: (exerciseCompletionsResult.data ?? []) as WorkoutExerciseCompletion[],
      exerciseSets: (exerciseSetsResult.data ?? []) as WorkoutExerciseSet[],
    };

    setData(nextData);
    setSelectedBlockId((current) => current || getDefaultWorkoutBlockId(nextData.blocks));
    setStatus(nextData.sessions.length ? "Analysis ready." : "No synced workout data yet. Sync the Sheet from the workout planner.");
    setIsBusy(false);
  }

  if (!session?.user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#111111] px-4 py-8 font-mono text-[#f4f4f5]">
        <section className="grid max-w-lg gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-5 text-center">
          <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Powerlifting Analysis</p>
          <h1 className="text-4xl font-black uppercase leading-none">Sign In Required</h1>
          <p className="text-sm uppercase leading-relaxed text-[#a1a1aa]">{status}</p>
          <Link className="outline-action grid place-items-center px-3" href="/">
            Back to Dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111111] px-3 py-3 font-mono text-[#f4f4f5]">
      <section className="grid min-h-[calc(100vh-24px)] content-start gap-3 rounded-lg border border-[#3a3a3a] bg-[#111111] p-3">
        <header className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Powerlifting Data</p>
            <h1 className="text-4xl font-black uppercase leading-none md:text-6xl">Analysis</h1>
            <p className="mt-2 max-w-5xl text-sm uppercase leading-relaxed text-[#a1a1aa]">
              Track mesocycles, adherence, volume, top sets, estimated maxes, RPE exposure, and exercise-level progress from logged workout data.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[520px]">
            <Link className="outline-action grid place-items-center px-3" href="/">
              Dashboard
            </Link>
            <Link className="outline-action grid place-items-center px-3" href="/health">
              Logger
            </Link>
            <button className="action px-4" disabled={isBusy} onClick={() => session?.user && loadAnalysis(session.user.id)} type="button">
              {isBusy ? "Loading" : "Refresh"}
            </button>
          </div>
        </header>

        <section className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3 lg:grid-cols-[1fr_220px_190px] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Selected Mesocycle</p>
            <h2 className="mt-1 text-2xl font-black uppercase leading-none">{analysis.selectedBlock?.block_name ?? "No Block Loaded"}</h2>
            <p className="mt-2 text-xs uppercase leading-relaxed text-[#a1a1aa]">
              {analysis.selectedBlock?.goal || "Sync or select a block to analyze training progress."}
            </p>
            <p className="mt-2 text-xs font-black uppercase text-[#f59e0b]">{status}</p>
          </div>
          <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
            Block
            <select
              className="min-h-10 rounded-lg border border-[#3a3a3a] bg-[#111111] px-3 text-xs uppercase text-[#f4f4f5] outline-none focus:border-[#f59e0b]"
              onChange={(event) => setSelectedBlockId(event.target.value)}
              value={activeBlockId}
            >
              {!data.blocks.length ? <option value="">No blocks synced</option> : null}
              {data.blocks.map((block) => (
                <option key={block.block_id} value={block.block_id}>
                  {block.block_name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
            Lift Focus
            <select
              className="min-h-10 rounded-lg border border-[#3a3a3a] bg-[#111111] px-3 text-xs uppercase text-[#f4f4f5] outline-none focus:border-[#f59e0b]"
              onChange={(event) => setLiftFilter(event.target.value as LiftFilter)}
              value={liftFilter}
            >
              {liftOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Adherence" value={`${analysis.metrics.adherencePercent}%`} detail={`${analysis.metrics.completedSessions}/${analysis.metrics.scheduledSessions} sessions complete`} />
          <MetricCard label="Block Progress" value={`${analysis.metrics.blockProgressPercent}%`} detail={`${analysis.metrics.skippedSessions} skipped, ${analysis.metrics.missedSessions} missed`} />
          <MetricCard label="Actual Volume" value={formatNumber(analysis.metrics.actualVolume)} detail={`${analysis.metrics.volumeCompletionPercent}% of planned tonnage`} />
          <MetricCard label="Top e1RM" value={analysis.metrics.topEstimatedOneRepMax ? formatNumber(analysis.metrics.topEstimatedOneRepMax) : "-"} detail={analysis.metrics.topSetLabel} />
          <MetricCard label="Completed Work Sets" value={formatNumber(analysis.metrics.completedWorkSets)} detail={`${analysis.metrics.plannedWorkSets} planned work sets`} />
          <MetricCard label="Avg RPE" value={formatDecimal(analysis.metrics.averageRpe)} detail="Completed work sets with RPE logged" />
          <MetricCard label="Planned Volume" value={formatNumber(analysis.metrics.plannedVolume)} detail="Calculated from Sheet sets, reps, and load" />
          <MetricCard label="Lift Filter" value={liftOptions.find((option) => option.value === liftFilter)?.label ?? "All"} detail="Category is inferred from exercise names" />
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Mesocycle Blocks</p>
                <h2 className="text-2xl font-black uppercase leading-none">Training History</h2>
              </div>
              <ProgressBar value={analysis.metrics.blockProgressPercent} />
            </div>
            <div className="mt-3 grid gap-2">
              {analysis.blockSummaries.map((block) => (
                <button
                  className={`grid gap-2 rounded-lg border p-3 text-left transition md:grid-cols-[1fr_auto] md:items-center ${
                    block.blockId === activeBlockId ? "border-[#f59e0b] bg-[#2a2a2a]" : "border-[#3a3a3a] bg-[#151515] hover:border-[#737373]"
                  }`}
                  key={block.blockId}
                  onClick={() => setSelectedBlockId(block.blockId)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-black uppercase">{block.name}</strong>
                      <StatusBadge label={block.status} />
                    </span>
                    <span className="mt-1 block text-xs uppercase leading-relaxed text-[#a1a1aa]">
                      {block.dateRange} | {block.goal || "No goal logged"}
                    </span>
                  </span>
                  <span className="grid grid-cols-3 gap-2 text-right text-xs uppercase text-[#d4d4d8]">
                    <span>
                      <strong className="block text-base text-[#f4f4f5]">{block.completed}/{block.sessions}</strong>
                      Sessions
                    </span>
                    <span>
                      <strong className="block text-base text-[#f4f4f5]">{formatNumber(block.actualVolume)}</strong>
                      Volume
                    </span>
                    <span>
                      <strong className="block text-base text-[#f4f4f5]">{block.topEstimatedOneRepMax ? formatNumber(block.topEstimatedOneRepMax) : "-"}</strong>
                      e1RM
                    </span>
                  </span>
                </button>
              ))}
              {!analysis.blockSummaries.length ? <EmptyState label="No blocks loaded. Sync the Google Sheet from the workout planner." /> : null}
            </div>
          </section>

          <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Attention Queue</p>
            <h2 className="mt-1 text-2xl font-black uppercase leading-none">Audit Flags</h2>
            <div className="mt-3 grid gap-2">
              {analysis.attentionItems.map((item) => (
                <div className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-3" key={item.label}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm font-black uppercase">{item.label}</strong>
                    <ToneBadge tone={item.tone} />
                  </div>
                  <p className="mt-2 text-xs uppercase leading-relaxed text-[#a1a1aa]">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Powerlifting Signals</p>
              <h2 className="text-2xl font-black uppercase leading-none">Lift Categories</h2>
            </div>
            <p className="text-xs uppercase text-[#a1a1aa]">Volume bars use completed work sets only.</p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
            {analysis.liftSummaries.map((lift) => (
              <button
                className={`grid gap-3 rounded-lg border p-3 text-left transition ${
                  liftFilter === lift.category ? "border-[#f59e0b] bg-[#2a2a2a]" : "border-[#3a3a3a] bg-[#151515] hover:border-[#737373]"
                }`}
                key={lift.category}
                onClick={() => setLiftFilter(lift.category)}
                type="button"
              >
                <span className="flex items-center justify-between gap-2">
                  <strong className="text-base font-black uppercase">{lift.label}</strong>
                  <span className="text-xs uppercase text-[#a1a1aa]">{lift.completedSets}/{lift.plannedSets} sets</span>
                </span>
                <span className="grid grid-cols-3 gap-2 text-xs uppercase text-[#d4d4d8]">
                  <span>
                    <strong className="block text-lg text-[#f4f4f5]">{formatNumber(lift.volume)}</strong>
                    Volume
                  </span>
                  <span>
                    <strong className="block text-lg text-[#f4f4f5]">{lift.topEstimatedOneRepMax ? formatNumber(lift.topEstimatedOneRepMax) : "-"}</strong>
                    e1RM
                  </span>
                  <span>
                    <strong className="block text-lg text-[#f4f4f5]">{formatDecimal(lift.averageRpe)}</strong>
                    RPE
                  </span>
                </span>
                <ProgressBar value={(lift.volume / maxLiftVolume) * 100} />
                <span className="text-xs uppercase text-[#a1a1aa]">
                  Last trained: {lift.latestDate ? formatDate(lift.latestDate) : "No completed sets"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Weekly Load</p>
              <h2 className="text-2xl font-black uppercase leading-none">Mesocycle Trend</h2>
            </div>
            <p className="text-xs uppercase text-[#a1a1aa]">Amber is actual volume. Gray is planned volume.</p>
          </div>
          <div className="mt-3 grid gap-2">
            {analysis.weekSummaries.map((week) => (
              <div className="grid gap-2 rounded-lg border border-[#3a3a3a] bg-[#151515] p-3 lg:grid-cols-[110px_1fr_220px] lg:items-center" key={week.week}>
                <div>
                  <strong className="block text-sm font-black uppercase">Week {week.week}</strong>
                  <span className="text-xs uppercase text-[#a1a1aa]">{week.dateRange}</span>
                </div>
                <div className="grid gap-1">
                  <BarLine label="Actual" value={week.actualVolume} max={maxWeeklyVolume} accent="#f59e0b" />
                  <BarLine label="Planned" value={week.plannedVolume} max={maxWeeklyVolume} accent="#71717a" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-right text-xs uppercase text-[#d4d4d8]">
                  <span>
                    <strong className="block text-base text-[#f4f4f5]">{week.completedSessions}/{week.scheduledSessions}</strong>
                    Days
                  </span>
                  <span>
                    <strong className="block text-base text-[#f4f4f5]">{week.completedSets}/{week.plannedSets}</strong>
                    Sets
                  </span>
                  <span>
                    <strong className="block text-base text-[#f4f4f5]">{formatDecimal(week.averageRpe)}</strong>
                    RPE
                  </span>
                </div>
              </div>
            ))}
            {!analysis.weekSummaries.length ? <EmptyState label="No weekly data available for this block." /> : null}
          </div>
        </section>

        <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Exercise Progress</p>
              <h2 className="text-2xl font-black uppercase leading-none">Performance Table</h2>
            </div>
            {liftFilter !== "all" ? (
              <button className="outline-action px-3" onClick={() => setLiftFilter("all")} type="button">
                Show All Lifts
              </button>
            ) : null}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-xs uppercase">
              <thead className="text-[#a1a1aa]">
                <tr>
                  <th className="px-3 py-1">Exercise</th>
                  <th className="px-3 py-1">Category</th>
                  <th className="px-3 py-1 text-right">Sets</th>
                  <th className="px-3 py-1 text-right">Reps</th>
                  <th className="px-3 py-1 text-right">Volume</th>
                  <th className="px-3 py-1 text-right">Best Load</th>
                  <th className="px-3 py-1 text-right">Top e1RM</th>
                  <th className="px-3 py-1 text-right">Avg RPE</th>
                  <th className="px-3 py-1 text-right">Last</th>
                </tr>
              </thead>
              <tbody>
                {analysis.exerciseSummaries.map((exercise) => (
                  <tr className="bg-[#151515] text-[#f4f4f5]" key={exercise.exerciseId}>
                    <td className="rounded-l-lg border-y border-l border-[#3a3a3a] px-3 py-3 font-black">{exercise.name}</td>
                    <td className="border-y border-[#3a3a3a] px-3 py-3 text-[#a1a1aa]">{getLiftCategoryLabel(exercise.category)}</td>
                    <td className="border-y border-[#3a3a3a] px-3 py-3 text-right">{exercise.completedSets}/{exercise.plannedSets}</td>
                    <td className="border-y border-[#3a3a3a] px-3 py-3 text-right">{formatNumber(exercise.totalReps)}</td>
                    <td className="border-y border-[#3a3a3a] px-3 py-3 text-right">{formatNumber(exercise.volume)}</td>
                    <td className="border-y border-[#3a3a3a] px-3 py-3 text-right">{exercise.bestLoad ? formatNumber(exercise.bestLoad) : "-"}</td>
                    <td className="border-y border-[#3a3a3a] px-3 py-3 text-right">{exercise.topEstimatedOneRepMax ? formatNumber(exercise.topEstimatedOneRepMax) : "-"}</td>
                    <td className="border-y border-[#3a3a3a] px-3 py-3 text-right">{formatDecimal(exercise.averageRpe)}</td>
                    <td className="rounded-r-lg border-y border-r border-[#3a3a3a] px-3 py-3 text-right">{exercise.lastTrained ? formatDate(exercise.lastTrained) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!analysis.exerciseSummaries.length ? <EmptyState label="No exercise data matches this filter." /> : null}
          </div>
        </section>

        <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
          <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Session Audit</p>
          <h2 className="mt-1 text-2xl font-black uppercase leading-none">Training Log Integrity</h2>
          <div className="mt-3 grid gap-2">
            {analysis.sessionSummaries.map((workoutSession) => (
              <div className="grid gap-2 rounded-lg border border-[#3a3a3a] bg-[#151515] p-3 lg:grid-cols-[170px_1fr_230px] lg:items-center" key={workoutSession.sessionId}>
                <div>
                  <strong className="block text-sm font-black uppercase">{formatDate(workoutSession.date)}</strong>
                  <StatusBadge label={workoutSession.status} />
                </div>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black uppercase">{workoutSession.name}</strong>
                  <p className="mt-1 truncate text-xs uppercase text-[#a1a1aa]" title={workoutSession.notes}>
                    {workoutSession.notes || "No notes"}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-right text-xs uppercase text-[#d4d4d8]">
                  <span>
                    <strong className="block text-base text-[#f4f4f5]">{workoutSession.completedSets}/{workoutSession.plannedSets}</strong>
                    Sets
                  </span>
                  <span>
                    <strong className="block text-base text-[#f4f4f5]">{formatNumber(workoutSession.actualVolume)}</strong>
                    Volume
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-base text-[#f4f4f5]" title={workoutSession.topSetLabel}>
                      {workoutSession.topSetLabel.includes(":") ? workoutSession.topSetLabel.split(":")[0] : "-"}
                    </strong>
                    Top
                  </span>
                </div>
              </div>
            ))}
            {!analysis.sessionSummaries.length ? <EmptyState label="No sessions loaded for this block." /> : null}
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="grid min-h-32 content-between rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
      <span className="text-xs font-black uppercase text-[#a1a1aa]">{label}</span>
      <strong className="mt-2 block text-3xl font-black uppercase leading-none">{value}</strong>
      <span className="mt-2 line-clamp-2 text-xs uppercase leading-relaxed text-[#f59e0b]" title={detail}>
        {detail}
      </span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <span className="block h-2 min-w-32 overflow-hidden rounded-full bg-[#27272a]">
      <span className="block h-full rounded-full bg-[#f59e0b]" style={{ width: `${clampPercent(value)}%` }} />
    </span>
  );
}

function BarLine({ label, value, max, accent }: { label: string; value: number; max: number; accent: string }) {
  return (
    <div className="grid grid-cols-[64px_1fr_86px] items-center gap-2 text-xs uppercase text-[#a1a1aa]">
      <span>{label}</span>
      <span className="block h-3 overflow-hidden rounded-full bg-[#27272a]">
        <span className="block h-full rounded-full" style={{ width: `${clampPercent((value / max) * 100)}%`, background: accent }} />
      </span>
      <strong className="text-right text-[#f4f4f5]">{formatNumber(value)}</strong>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  const classes =
    label === "complete" || label === "current"
      ? "border-[#22c55e] bg-[#142317] text-[#86efac]"
      : label === "skipped" || label === "missed"
        ? "border-[#ef4444] bg-[#2b1515] text-[#fca5a5]"
        : label === "upcoming" || label === "planned"
          ? "border-[#f59e0b] bg-[#2b2110] text-[#fbbf24]"
          : "border-[#525252] bg-[#151515] text-[#d4d4d8]";
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase ${classes}`}>{label}</span>;
}

function ToneBadge({ tone }: { tone: "good" | "warn" | "danger" }) {
  const label = tone === "good" ? "Good" : tone === "warn" ? "Watch" : "Fix";
  const classes =
    tone === "good"
      ? "border-[#22c55e] bg-[#142317] text-[#86efac]"
      : tone === "warn"
        ? "border-[#f59e0b] bg-[#2b2110] text-[#fbbf24]"
        : "border-[#ef4444] bg-[#2b1515] text-[#fca5a5]";
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${classes}`}>{label}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <p className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-4 text-sm uppercase leading-relaxed text-[#a1a1aa]">{label}</p>;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function formatDecimal(value: number | null) {
  return value === null ? "-" : value.toFixed(1);
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
}
