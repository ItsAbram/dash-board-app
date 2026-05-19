"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import {
  WorkoutBlock,
  WorkoutExercise,
  WorkoutExerciseCompletion,
  WorkoutExerciseSet,
  WorkoutSession,
  WorkoutSessionCompletion,
  WorkoutSyncResult,
  WorkoutSyncWarning,
} from "@/types/workouts";
import { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

type LoadState = {
  blocks: WorkoutBlock[];
  sessions: WorkoutSession[];
  exercises: WorkoutExercise[];
  sessionCompletions: WorkoutSessionCompletion[];
  exerciseCompletions: WorkoutExerciseCompletion[];
  exerciseSets: WorkoutExerciseSet[];
};

const emptyLoadState: LoadState = {
  blocks: [],
  sessions: [],
  exercises: [],
  sessionCompletions: [],
  exerciseCompletions: [],
  exerciseSets: [],
};

export default function HealthPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<LoadState>(emptyLoadState);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [status, setStatus] = useState(supabase ? "Loading workouts..." : "Supabase env vars are missing.");
  const [syncWarnings, setSyncWarnings] = useState<WorkoutSyncWarning[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [completionNotesBySession, setCompletionNotesBySession] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: authData }) => setSession(authData.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    loadWorkouts(session.user.id);
  }, [session]);

  const currentBlock = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return data.blocks.find((block) => block.start_date <= today && block.end_date >= today) ?? data.blocks[0] ?? null;
  }, [data.blocks]);

  const visibleSessions = useMemo(() => {
    const blockSessions = currentBlock ? data.sessions.filter((workoutSession) => workoutSession.block_id === currentBlock.block_id) : data.sessions;
    return [...blockSessions].sort((a, b) => a.date.localeCompare(b.date));
  }, [currentBlock, data.sessions]);

  const selectedSession = useMemo(() => {
    return visibleSessions.find((workoutSession) => workoutSession.session_id === selectedSessionId) ?? visibleSessions[0] ?? null;
  }, [selectedSessionId, visibleSessions]);

  const selectedExercises = useMemo(() => {
    if (!selectedSession) return [];
    return data.exercises
      .filter((exercise) => exercise.session_id === selectedSession.session_id)
      .sort((a, b) => a.order_index - b.order_index);
  }, [data.exercises, selectedSession]);

  const selectedCompletion = useMemo(() => {
    if (!selectedSession) return null;
    return data.sessionCompletions.find((completion) => completion.session_id === selectedSession.session_id) ?? null;
  }, [data.sessionCompletions, selectedSession]);

  const completionNotes = selectedSession
    ? completionNotesBySession[selectedSession.session_id] ?? selectedCompletion?.notes ?? ""
    : "";

  async function loadWorkouts(userId: string) {
    if (!supabase) return;
    setStatus("Loading synced workouts...");

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
      return;
    }

    const nextData = {
      blocks: (blocksResult.data ?? []) as WorkoutBlock[],
      sessions: (sessionsResult.data ?? []) as WorkoutSession[],
      exercises: (exercisesResult.data ?? []) as WorkoutExercise[],
      sessionCompletions: (sessionCompletionsResult.data ?? []) as WorkoutSessionCompletion[],
      exerciseCompletions: (exerciseCompletionsResult.data ?? []) as WorkoutExerciseCompletion[],
      exerciseSets: (exerciseSetsResult.data ?? []) as WorkoutExerciseSet[],
    };

    setData(nextData);
    setSelectedSessionId((current) => current || nextData.sessions[0]?.session_id || "");
    setStatus(nextData.sessions.length ? "Workouts loaded." : "No synced workouts yet. Run Sync Sheet after setup.");
  }

  async function syncSheet() {
    if (!session?.access_token || !session.user) return;

    setIsBusy(true);
    setStatus("Syncing Google Sheet...");
    setSyncWarnings([]);

    const response = await fetch("/api/workouts/sync", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = (await response.json()) as Partial<WorkoutSyncResult> & { error?: string };

    if (!response.ok || !result.ok) {
      setStatus(`Sync failed: ${result.error ?? "Unknown error"}`);
      setIsBusy(false);
      return;
    }

    setSyncWarnings(result.warnings ?? []);
    setStatus(`Synced ${result.counts?.blocks ?? 0} blocks, ${result.counts?.sessions ?? 0} sessions, ${result.counts?.exercises ?? 0} exercises.`);
    await loadWorkouts(session.user.id);
    setIsBusy(false);
  }

  async function markSession(statusValue: "complete" | "skipped") {
    if (!supabase || !session?.user || !selectedSession) return;

    const completion: WorkoutSessionCompletion = {
      user_id: session.user.id,
      session_id: selectedSession.session_id,
      status: statusValue,
      completed_at: new Date().toISOString(),
      notes: completionNotes,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("workout_session_completions").upsert(completion, { onConflict: "user_id,session_id" });
    if (error) {
      setStatus(`Save failed: ${error.message}`);
      return;
    }

    setData((current) => ({
      ...current,
      sessionCompletions: [...current.sessionCompletions.filter((item) => item.session_id !== selectedSession.session_id), completion],
    }));
    setStatus(`Session marked ${statusValue}.`);
  }

  async function unmarkSession() {
    if (!supabase || !session?.user || !selectedSession) return;

    const { error } = await supabase
      .from("workout_session_completions")
      .delete()
      .eq("user_id", session.user.id)
      .eq("session_id", selectedSession.session_id);

    if (error) {
      setStatus(`Save failed: ${error.message}`);
      return;
    }

    setData((current) => ({
      ...current,
      sessionCompletions: current.sessionCompletions.filter((item) => item.session_id !== selectedSession.session_id),
    }));
    setStatus("Session unmarked.");
  }

  async function toggleExercise(exercise: WorkoutExercise) {
    if (!supabase || !session?.user) return;

    const existing = data.exerciseCompletions.find((completion) => completion.exercise_id === exercise.exercise_id);
    const nextDone = !existing?.done;
    const completion: WorkoutExerciseCompletion = {
      user_id: session.user.id,
      exercise_id: exercise.exercise_id,
      done: nextDone,
      completed_at: nextDone ? new Date().toISOString() : null,
      actual_sets: existing?.actual_sets ?? exercise.sets,
      actual_reps: existing?.actual_reps ?? exercise.reps,
      actual_load: existing?.actual_load ?? exercise.target_load,
      actual_rpe: existing?.actual_rpe ?? "",
      notes: existing?.notes ?? "",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("workout_exercise_completions").upsert(completion, { onConflict: "user_id,exercise_id" });
    if (error) {
      setStatus(`Save failed: ${error.message}`);
      return;
    }

    setData((current) => ({
      ...current,
      exerciseCompletions: [...current.exerciseCompletions.filter((item) => item.exercise_id !== exercise.exercise_id), completion],
    }));
  }

  async function addExerciseSet(exercise: WorkoutExercise, setType: WorkoutExerciseSet["set_type"]) {
    if (!supabase || !session?.user) return;

    const currentSets = data.exerciseSets.filter((set) => set.exercise_id === exercise.exercise_id);
    const setNumber = currentSets.length ? Math.max(...currentSets.map((set) => set.set_number)) + 1 : 1;
    const set: WorkoutExerciseSet = {
      user_id: session.user.id,
      set_id: `${exercise.exercise_id}-${Date.now()}`,
      exercise_id: exercise.exercise_id,
      set_number: setNumber,
      set_type: setType,
      reps: setType === "work" ? exercise.reps : "",
      load: setType === "work" ? exercise.target_load : "",
      rpe: "",
      done: false,
      notes: "",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("workout_exercise_sets").upsert(set, { onConflict: "user_id,set_id" });
    if (error) {
      setStatus(`Save failed: ${error.message}`);
      return;
    }

    setData((current) => ({
      ...current,
      exerciseSets: [...current.exerciseSets, set],
    }));
  }

  async function updateExerciseSet(set: WorkoutExerciseSet, patch: Partial<WorkoutExerciseSet>) {
    if (!supabase) return;

    const nextSet = { ...set, ...patch, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("workout_exercise_sets").upsert(nextSet, { onConflict: "user_id,set_id" });
    if (error) {
      setStatus(`Save failed: ${error.message}`);
      return;
    }

    setData((current) => ({
      ...current,
      exerciseSets: current.exerciseSets.map((item) => (item.set_id === set.set_id ? nextSet : item)),
    }));
  }

  async function deleteExerciseSet(set: WorkoutExerciseSet) {
    if (!supabase || !session?.user) return;

    const { error } = await supabase.from("workout_exercise_sets").delete().eq("user_id", session.user.id).eq("set_id", set.set_id);
    if (error) {
      setStatus(`Save failed: ${error.message}`);
      return;
    }

    setData((current) => ({
      ...current,
      exerciseSets: current.exerciseSets.filter((item) => item.set_id !== set.set_id),
    }));
  }

  if (!session?.user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#111111] px-4 py-8 font-mono text-[#f4f4f5]">
        <section className="grid max-w-lg gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-5 text-center">
          <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Workout Planner</p>
          <h1 className="text-4xl font-black uppercase leading-none">Sign In Required</h1>
          <p className="text-sm uppercase leading-relaxed text-[#a1a1aa]">Open the main dashboard and sign in before syncing or checking off workouts.</p>
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
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Spreadsheet Workout Sync</p>
            <h1 className="text-4xl font-black uppercase leading-none md:text-6xl">Workout Planner</h1>
            <p className="mt-2 max-w-5xl text-sm uppercase leading-relaxed text-[#a1a1aa]">
              Plan blocks in Google Sheets, sync them here, then mark sessions and exercises off in the app.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] xl:min-w-[520px]">
            <div className="rounded-lg border border-[#3a3a3a] bg-[#111111] p-3">
              <p className="text-xs font-black uppercase text-[#a1a1aa]">Current Block</p>
              <p className="mt-1 text-xl font-black uppercase leading-none">{currentBlock?.block_name ?? "No Block"}</p>
              <p className="mt-2 text-xs uppercase text-[#f59e0b]">{status}</p>
            </div>
            <button className="action px-4" disabled={isBusy} onClick={syncSheet} type="button">
              {isBusy ? "Syncing" : "Sync Sheet"}
            </button>
          </div>
        </header>

        {syncWarnings.length ? (
          <section className="rounded-lg border border-[#f59e0b] bg-[#2b2110] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Sync Warnings</p>
            <div className="mt-2 grid gap-1 text-xs uppercase leading-relaxed text-[#fbbf24]">
              {syncWarnings.slice(0, 8).map((warning) => (
                <p key={`${warning.sheet}-${warning.row}-${warning.message}`}>
                  {warning.sheet} row {warning.row}: {warning.message}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
          <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">This Block</p>
                <h2 className="text-2xl font-black uppercase leading-none">{visibleSessions.length} Sessions</h2>
              </div>
              <Link className="outline-action grid place-items-center px-3" href="/">
                Dashboard
              </Link>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
              {visibleSessions.map((workoutSession) => {
                const completion = data.sessionCompletions.find((item) => item.session_id === workoutSession.session_id);
                return (
                  <button
                    className={`grid min-h-36 content-start gap-3 rounded-lg border p-3 text-left transition ${
                      selectedSession?.session_id === workoutSession.session_id
                        ? "border-[#f59e0b] bg-[#2a2a2a]"
                        : "border-[#3a3a3a] bg-[#151515] hover:border-[#737373]"
                    }`}
                    key={workoutSession.session_id}
                    onClick={() => setSelectedSessionId(workoutSession.session_id)}
                    type="button"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase text-[#a1a1aa]">{formatDate(workoutSession.date)}</span>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${completion ? "border-[#22c55e] text-[#86efac]" : "border-[#525252] text-[#d4d4d8]"}`}>
                        {completion?.status ?? "planned"}
                      </span>
                    </span>
                    <span>
                      <span className="block text-xl font-black uppercase leading-tight">{workoutSession.session_name}</span>
                      <span className="mt-1 block text-xs uppercase text-[#a1a1aa]">{workoutSession.template_name || "No template"}</span>
                    </span>
                    <span className="grid gap-1 text-xs uppercase text-[#a1a1aa]">
                      <span>{workoutSession.estimated_minutes ? `${workoutSession.estimated_minutes} min` : "No time target"}</span>
                      <span className="truncate">Tags: {workoutSession.tags.length ? workoutSession.tags.join(", ") : "none"}</span>
                    </span>
                  </button>
                );
              })}
              {!visibleSessions.length ? (
                <p className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-4 text-sm uppercase leading-relaxed text-[#a1a1aa]">
                  No sessions loaded. Run the Supabase schema, set Google env vars, share the sheet with the service account, then sync.
                </p>
              ) : null}
            </div>
          </section>

          <aside className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
            {selectedSession ? (
              <>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Selected Session</p>
                  <h2 className="mt-1 text-3xl font-black uppercase leading-none">{selectedSession.session_name}</h2>
                  <p className="mt-2 text-xs uppercase leading-relaxed text-[#a1a1aa]">{selectedSession.notes || "No session notes."}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <Info label="Date" value={formatDate(selectedSession.date)} />
                  <Info label="Priority" value={selectedSession.priority || "normal"} />
                  <Info label="Time" value={selectedSession.estimated_minutes ? `${selectedSession.estimated_minutes} min` : "-"} />
                </div>

                <section className="grid gap-2">
                  <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Exercises</p>
                  {selectedExercises.map((exercise) => {
                    const completion = data.exerciseCompletions.find((item) => item.exercise_id === exercise.exercise_id);
                    const exerciseSets = data.exerciseSets
                      .filter((set) => set.exercise_id === exercise.exercise_id)
                      .sort((a, b) => a.set_number - b.set_number);
                    return (
                      <div
                        className={`grid gap-2 rounded-lg border p-3 text-left ${
                          completion?.done ? "border-[#22c55e] bg-[#142317]" : "border-[#3a3a3a] bg-[#151515]"
                        }`}
                        key={exercise.exercise_id}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span>
                            <strong className="block text-sm font-black uppercase">{exercise.exercise_name}</strong>
                            <span className="mt-1 block text-xs uppercase text-[#a1a1aa]">
                              Plan: {exercise.sets || "-"} sets / {exercise.reps || "-"} reps / {exercise.target_load || "no load target"}
                            </span>
                          </span>
                          <button className="outline-action min-h-8 px-2" onClick={() => toggleExercise(exercise)} type="button">
                            {completion?.done ? "Unmark" : "Done"}
                          </button>
                        </span>
                        <div className="grid gap-1">
                          {exerciseSets.map((set) => (
                            <div className="grid grid-cols-[48px_70px_1fr_1fr_1fr_34px_34px] items-end gap-1" key={set.set_id}>
                              <button
                                className={`min-h-9 rounded-md border px-2 text-[10px] font-black uppercase ${
                                  set.done ? "border-[#22c55e] bg-[#142317] text-[#86efac]" : "border-[#3a3a3a] bg-[#111111] text-[#a1a1aa]"
                                }`}
                                onClick={() => updateExerciseSet(set, { done: !set.done })}
                                type="button"
                              >
                                {set.set_number}
                              </button>
                              <select
                                className="min-h-9 rounded-md border border-[#3a3a3a] bg-[#111111] px-1 text-[10px] uppercase text-[#f4f4f5] outline-none focus:border-[#f59e0b]"
                                onChange={(event) => updateExerciseSet(set, { set_type: event.target.value as WorkoutExerciseSet["set_type"] })}
                                value={set.set_type}
                              >
                                <option value="warmup">Warm</option>
                                <option value="work">Work</option>
                              </select>
                              <SetField label="Reps" value={set.reps} onChange={(value) => updateExerciseSet(set, { reps: value })} />
                              <SetField label="Load" value={set.load} onChange={(value) => updateExerciseSet(set, { load: value })} />
                              <SetField label="RPE" value={set.rpe} onChange={(value) => updateExerciseSet(set, { rpe: value })} />
                              <button className="outline-action min-h-9 px-1" onClick={() => updateExerciseSet(set, { done: !set.done })} type="button">
                                OK
                              </button>
                              <button className="outline-action min-h-9 border-[#ef4444] px-1 text-[#ef4444]" onClick={() => deleteExerciseSet(set)} type="button">
                                X
                              </button>
                            </div>
                          ))}
                          {!exerciseSets.length ? <p className="rounded-md border border-[#3a3a3a] bg-[#111111] p-2 text-xs uppercase text-[#a1a1aa]">No actual sets yet.</p> : null}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="outline-action min-h-8 px-2" onClick={() => addExerciseSet(exercise, "warmup")} type="button">
                            + Warmup
                          </button>
                          <button className="outline-action min-h-8 px-2" onClick={() => addExerciseSet(exercise, "work")} type="button">
                            + Set
                          </button>
                        </div>
                        {exercise.notes ? <span className="text-xs uppercase leading-relaxed text-[#a1a1aa]">{exercise.notes}</span> : null}
                      </div>
                    );
                  })}
                  {!selectedExercises.length ? <p className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-3 text-sm uppercase text-[#a1a1aa]">No exercises for this session.</p> : null}
                </section>

                <label className="grid gap-1 text-xs font-black uppercase text-[#a1a1aa]">
                  Completion Notes
                  <textarea
                    className="min-h-24 w-full resize-none rounded-lg border border-[#3a3a3a] bg-[#111111] p-3 text-sm uppercase leading-relaxed text-[#f4f4f5] outline-none focus:border-[#f59e0b]"
                    onChange={(event) =>
                      setCompletionNotesBySession((current) => ({
                        ...current,
                        [selectedSession.session_id]: event.target.value,
                      }))
                    }
                    value={completionNotes}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="outline-action px-3" onClick={() => markSession("skipped")} type="button">
                    Mark Skipped
                  </button>
                  <button className="action px-3" onClick={() => markSession("complete")} type="button">
                    Mark Complete
                  </button>
                </div>
                {selectedCompletion ? (
                  <button className="outline-action border-[#ef4444] px-3 text-[#ef4444]" onClick={unmarkSession} type="button">
                    Unmark Session
                  </button>
                ) : null}
              </>
            ) : (
              <p className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-4 text-sm uppercase leading-relaxed text-[#a1a1aa]">Select a synced session to start checking it off.</p>
            )}
          </aside>
        </section>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#3a3a3a] bg-[#151515] p-3">
      <p className="text-xs font-black uppercase text-[#a1a1aa]">{label}</p>
      <p className="mt-1 text-sm font-black uppercase text-[#f4f4f5]">{value}</p>
    </div>
  );
}

function SetField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-[10px] font-black uppercase text-[#a1a1aa]">
      {label}
      <input
        className="min-h-9 min-w-0 rounded-md border border-[#3a3a3a] bg-[#111111] px-2 text-xs uppercase text-[#f4f4f5] outline-none focus:border-[#f59e0b]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
}
