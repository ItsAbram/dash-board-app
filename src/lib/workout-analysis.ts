import {
  WorkoutBlock,
  WorkoutExercise,
  WorkoutExerciseCompletion,
  WorkoutExerciseSet,
  WorkoutSession,
  WorkoutSessionCompletion,
} from "@/types/workouts";

export type WorkoutAnalysisData = {
  blocks: WorkoutBlock[];
  sessions: WorkoutSession[];
  exercises: WorkoutExercise[];
  sessionCompletions: WorkoutSessionCompletion[];
  exerciseCompletions: WorkoutExerciseCompletion[];
  exerciseSets: WorkoutExerciseSet[];
};

export type LiftCategory = "squat" | "bench" | "deadlift" | "press" | "pull" | "accessory";
export type LiftFilter = LiftCategory | "all";

export type AnalysisMetrics = {
  scheduledSessions: number;
  completedSessions: number;
  skippedSessions: number;
  missedSessions: number;
  adherencePercent: number;
  blockProgressPercent: number;
  plannedWorkSets: number;
  completedWorkSets: number;
  plannedVolume: number;
  actualVolume: number;
  volumeCompletionPercent: number;
  topEstimatedOneRepMax: number;
  topSetLabel: string;
  averageRpe: number | null;
};

export type BlockSummary = {
  blockId: string;
  name: string;
  dateRange: string;
  goal: string;
  status: "current" | "past" | "upcoming";
  sessions: number;
  completed: number;
  skipped: number;
  missed: number;
  actualVolume: number;
  topEstimatedOneRepMax: number;
};

export type LiftSummary = {
  category: LiftCategory;
  label: string;
  completedSets: number;
  plannedSets: number;
  volume: number;
  topLoad: number;
  topEstimatedOneRepMax: number;
  averageRpe: number | null;
  latestDate: string;
};

export type WeekSummary = {
  week: number;
  dateRange: string;
  scheduledSessions: number;
  completedSessions: number;
  completedSets: number;
  plannedSets: number;
  actualVolume: number;
  plannedVolume: number;
  averageRpe: number | null;
};

export type ExerciseSummary = {
  exerciseId: string;
  name: string;
  category: LiftCategory;
  completedSets: number;
  plannedSets: number;
  totalReps: number;
  volume: number;
  bestLoad: number;
  topEstimatedOneRepMax: number;
  averageRpe: number | null;
  lastTrained: string;
};

export type SessionSummary = {
  sessionId: string;
  date: string;
  name: string;
  status: "complete" | "skipped" | "missed" | "planned";
  plannedSets: number;
  completedSets: number;
  actualVolume: number;
  topSetLabel: string;
  notes: string;
};

export type AttentionItem = {
  label: string;
  detail: string;
  tone: "good" | "warn" | "danger";
};

export type WorkoutAnalysis = {
  selectedBlock: WorkoutBlock | null;
  metrics: AnalysisMetrics;
  blockSummaries: BlockSummary[];
  liftSummaries: LiftSummary[];
  weekSummaries: WeekSummary[];
  exerciseSummaries: ExerciseSummary[];
  sessionSummaries: SessionSummary[];
  attentionItems: AttentionItem[];
};

type EnrichedSet = {
  set: WorkoutExerciseSet;
  exercise: WorkoutExercise;
  session: WorkoutSession;
  block: WorkoutBlock | null;
  category: LiftCategory;
  reps: number;
  load: number;
  rpe: number | null;
  volume: number;
  estimatedOneRepMax: number;
};

type PlannedRow = {
  exercise: WorkoutExercise;
  session: WorkoutSession;
  block: WorkoutBlock | null;
  category: LiftCategory;
  sets: number;
  reps: number;
  load: number;
  volume: number;
};

const liftLabels: Record<LiftCategory, string> = {
  squat: "Squat",
  bench: "Bench",
  deadlift: "Deadlift",
  press: "Press",
  pull: "Pull",
  accessory: "Accessory",
};

export function getLiftCategoryLabel(category: LiftCategory) {
  return liftLabels[category];
}

export function getDefaultWorkoutBlockId(blocks: WorkoutBlock[]) {
  const today = getLocalDateKey();
  const sortedBlocks = [...blocks].sort((a, b) => a.start_date.localeCompare(b.start_date));
  return (
    sortedBlocks.find((block) => block.start_date <= today && block.end_date >= today)?.block_id ??
    sortedBlocks.find((block) => block.end_date >= today)?.block_id ??
    sortedBlocks.at(-1)?.block_id ??
    ""
  );
}

export function buildWorkoutAnalysis(data: WorkoutAnalysisData, selectedBlockId: string, liftFilter: LiftFilter): WorkoutAnalysis {
  const blocks = [...data.blocks].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const selectedBlock = blocks.find((block) => block.block_id === selectedBlockId) ?? blocks[0] ?? null;
  const blockSessions = selectedBlock
    ? data.sessions.filter((session) => session.block_id === selectedBlock.block_id)
    : data.sessions;
  const blockSessionIds = new Set(blockSessions.map((session) => session.session_id));
  const blockExercises = data.exercises.filter((exercise) => blockSessionIds.has(exercise.session_id));
  const selectedExercises = blockExercises.filter((exercise) => liftFilter === "all" || inferLiftCategory(exercise.exercise_name) === liftFilter);
  const selectedExerciseIds = new Set(selectedExercises.map((exercise) => exercise.exercise_id));
  const selectedSets = enrichSets(data, (set) => selectedExerciseIds.has(set.exercise_id));
  const plannedRows = buildPlannedRows(data, selectedExercises);
  const completedWorkSets = selectedSets.filter((item) => item.set.set_type === "work" && item.set.done && item.reps > 0 && item.load > 0);
  const plannedWorkSets = plannedRows.reduce((total, row) => total + row.sets, 0);
  const plannedVolume = plannedRows.reduce((total, row) => total + row.volume, 0);
  const actualVolume = completedWorkSets.reduce((total, item) => total + item.volume, 0);
  const topSet = findTopSet(completedWorkSets);
  const sessionCompletionsById = new Map(data.sessionCompletions.map((completion) => [completion.session_id, completion]));
  const completedSessions = blockSessions.filter((session) => sessionCompletionsById.get(session.session_id)?.status === "complete").length;
  const skippedSessions = blockSessions.filter((session) => sessionCompletionsById.get(session.session_id)?.status === "skipped").length;
  const missedSessions = blockSessions.filter((session) => session.date < getLocalDateKey() && !sessionCompletionsById.has(session.session_id)).length;

  return {
    selectedBlock,
    metrics: {
      scheduledSessions: blockSessions.length,
      completedSessions,
      skippedSessions,
      missedSessions,
      adherencePercent: percent(completedSessions, blockSessions.length),
      blockProgressPercent: selectedBlock ? getBlockProgressPercent(selectedBlock) : 0,
      plannedWorkSets,
      completedWorkSets: completedWorkSets.length,
      plannedVolume,
      actualVolume,
      volumeCompletionPercent: percent(actualVolume, plannedVolume),
      topEstimatedOneRepMax: topSet?.estimatedOneRepMax ?? 0,
      topSetLabel: topSet ? formatSetLabel(topSet) : "No completed work sets",
      averageRpe: average(completedWorkSets.map((item) => item.rpe).filter((value): value is number => value !== null)),
    },
    blockSummaries: buildBlockSummaries(data, blocks),
    liftSummaries: buildLiftSummaries(plannedRows, completedWorkSets),
    weekSummaries: buildWeekSummaries(selectedBlock, blockSessions, plannedRows, completedWorkSets, sessionCompletionsById),
    exerciseSummaries: buildExerciseSummaries(selectedExercises, plannedRows, completedWorkSets),
    sessionSummaries: buildSessionSummaries(blockSessions, plannedRows, completedWorkSets, sessionCompletionsById),
    attentionItems: buildAttentionItems(blockSessions, selectedExercises, plannedRows, completedWorkSets, sessionCompletionsById),
  };
}

function buildBlockSummaries(data: WorkoutAnalysisData, blocks: WorkoutBlock[]) {
  const completionsBySessionId = new Map(data.sessionCompletions.map((completion) => [completion.session_id, completion]));
  const allSets = enrichSets(data, () => true).filter((item) => item.set.set_type === "work" && item.set.done && item.reps > 0 && item.load > 0);
  const today = getLocalDateKey();

  return blocks.map((block) => {
    const sessions = data.sessions.filter((session) => session.block_id === block.block_id);
    const sessionIds = new Set(sessions.map((session) => session.session_id));
    const sets = allSets.filter((item) => sessionIds.has(item.session.session_id));
    const topSet = findTopSet(sets);
    return {
      blockId: block.block_id,
      name: block.block_name,
      dateRange: `${formatShortDate(block.start_date)} - ${formatShortDate(block.end_date)}`,
      goal: block.goal,
      status: block.start_date <= today && block.end_date >= today ? "current" : block.end_date < today ? "past" : "upcoming",
      sessions: sessions.length,
      completed: sessions.filter((session) => completionsBySessionId.get(session.session_id)?.status === "complete").length,
      skipped: sessions.filter((session) => completionsBySessionId.get(session.session_id)?.status === "skipped").length,
      missed: sessions.filter((session) => session.date < today && !completionsBySessionId.has(session.session_id)).length,
      actualVolume: sets.reduce((total, item) => total + item.volume, 0),
      topEstimatedOneRepMax: topSet?.estimatedOneRepMax ?? 0,
    } satisfies BlockSummary;
  });
}

function buildLiftSummaries(plannedRows: PlannedRow[], completedWorkSets: EnrichedSet[]) {
  return (Object.keys(liftLabels) as LiftCategory[]).map((category) => {
    const planned = plannedRows.filter((row) => row.category === category);
    const completed = completedWorkSets.filter((item) => item.category === category);
    return {
      category,
      label: liftLabels[category],
      completedSets: completed.length,
      plannedSets: planned.reduce((total, row) => total + row.sets, 0),
      volume: completed.reduce((total, item) => total + item.volume, 0),
      topLoad: Math.max(0, ...completed.map((item) => item.load)),
      topEstimatedOneRepMax: Math.max(0, ...completed.map((item) => item.estimatedOneRepMax)),
      averageRpe: average(completed.map((item) => item.rpe).filter((value): value is number => value !== null)),
      latestDate: completed.sort((a, b) => b.session.date.localeCompare(a.session.date))[0]?.session.date ?? "",
    };
  });
}

function buildWeekSummaries(
  selectedBlock: WorkoutBlock | null,
  sessions: WorkoutSession[],
  plannedRows: PlannedRow[],
  completedWorkSets: EnrichedSet[],
  completionsBySessionId: Map<string, WorkoutSessionCompletion>,
) {
  if (!selectedBlock && !sessions.length) return [];

  const startDate = selectedBlock?.start_date ?? sessions.map((session) => session.date).sort()[0];
  const endDate = selectedBlock?.end_date ?? sessions.map((session) => session.date).sort().at(-1) ?? startDate;
  const weekCount = Math.max(1, Math.floor(daysBetween(startDate, endDate) / 7) + 1);

  return Array.from({ length: weekCount }, (_, index) => {
    const week = index + 1;
    const weekStart = addDays(startDate, index * 7);
    const weekEnd = addDays(weekStart, 6);
    const weekSessions = sessions.filter((session) => getWeekNumber(startDate, session.date) === week);
    const weekSessionIds = new Set(weekSessions.map((session) => session.session_id));
    const planned = plannedRows.filter((row) => weekSessionIds.has(row.session.session_id));
    const completed = completedWorkSets.filter((item) => weekSessionIds.has(item.session.session_id));

    return {
      week,
      dateRange: `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`,
      scheduledSessions: weekSessions.length,
      completedSessions: weekSessions.filter((session) => completionsBySessionId.get(session.session_id)?.status === "complete").length,
      completedSets: completed.length,
      plannedSets: planned.reduce((total, row) => total + row.sets, 0),
      actualVolume: completed.reduce((total, item) => total + item.volume, 0),
      plannedVolume: planned.reduce((total, row) => total + row.volume, 0),
      averageRpe: average(completed.map((item) => item.rpe).filter((value): value is number => value !== null)),
    } satisfies WeekSummary;
  });
}

function buildExerciseSummaries(exercises: WorkoutExercise[], plannedRows: PlannedRow[], completedWorkSets: EnrichedSet[]) {
  return exercises
    .map((exercise) => {
      const planned = plannedRows.filter((row) => row.exercise.exercise_id === exercise.exercise_id);
      const completed = completedWorkSets.filter((item) => item.exercise.exercise_id === exercise.exercise_id);
      return {
        exerciseId: exercise.exercise_id,
        name: exercise.exercise_name,
        category: inferLiftCategory(exercise.exercise_name),
        completedSets: completed.length,
        plannedSets: planned.reduce((total, row) => total + row.sets, 0),
        totalReps: completed.reduce((total, item) => total + item.reps, 0),
        volume: completed.reduce((total, item) => total + item.volume, 0),
        bestLoad: Math.max(0, ...completed.map((item) => item.load)),
        topEstimatedOneRepMax: Math.max(0, ...completed.map((item) => item.estimatedOneRepMax)),
        averageRpe: average(completed.map((item) => item.rpe).filter((value): value is number => value !== null)),
        lastTrained: completed.sort((a, b) => b.session.date.localeCompare(a.session.date))[0]?.session.date ?? "",
      } satisfies ExerciseSummary;
    })
    .sort((a, b) => b.volume - a.volume || b.topEstimatedOneRepMax - a.topEstimatedOneRepMax || a.name.localeCompare(b.name));
}

function buildSessionSummaries(
  sessions: WorkoutSession[],
  plannedRows: PlannedRow[],
  completedWorkSets: EnrichedSet[],
  completionsBySessionId: Map<string, WorkoutSessionCompletion>,
) {
  const today = getLocalDateKey();
  return [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((session) => {
      const planned = plannedRows.filter((row) => row.session.session_id === session.session_id);
      const completed = completedWorkSets.filter((item) => item.session.session_id === session.session_id);
      const completion = completionsBySessionId.get(session.session_id);
      const topSet = findTopSet(completed);
      return {
        sessionId: session.session_id,
        date: session.date,
        name: session.session_name,
        status: completion?.status ?? (session.date < today ? "missed" : "planned"),
        plannedSets: planned.reduce((total, row) => total + row.sets, 0),
        completedSets: completed.length,
        actualVolume: completed.reduce((total, item) => total + item.volume, 0),
        topSetLabel: topSet ? formatSetLabel(topSet) : "No completed sets",
        notes: completion?.notes || session.notes,
      } satisfies SessionSummary;
    });
}

function buildAttentionItems(
  sessions: WorkoutSession[],
  exercises: WorkoutExercise[],
  plannedRows: PlannedRow[],
  completedWorkSets: EnrichedSet[],
  completionsBySessionId: Map<string, WorkoutSessionCompletion>,
) {
  const today = getLocalDateKey();
  const missed = sessions.filter((session) => session.date < today && !completionsBySessionId.has(session.session_id)).length;
  const highRpeSets = completedWorkSets.filter((item) => item.rpe !== null && item.rpe >= 9).length;
  const noSetExercises = exercises.filter((exercise) => !plannedRows.some((row) => row.exercise.exercise_id === exercise.exercise_id)).length;
  const completedSessions = sessions.filter((session) => completionsBySessionId.get(session.session_id)?.status === "complete");
  const completedNoVolume = completedSessions.filter(
    (session) => !completedWorkSets.some((item) => item.session.session_id === session.session_id),
  ).length;

  const items: AttentionItem[] = [];
  items.push({
    label: missed ? "Missed sessions" : "Session adherence",
    detail: missed ? `${missed} past session${missed === 1 ? "" : "s"} have no complete or skipped mark.` : "No unmarked past sessions in this block.",
    tone: missed ? "danger" : "good",
  });
  items.push({
    label: highRpeSets ? "High strain sets" : "RPE exposure",
    detail: highRpeSets ? `${highRpeSets} completed work set${highRpeSets === 1 ? "" : "s"} are at RPE 9 or higher.` : "No completed RPE 9+ work sets logged.",
    tone: highRpeSets >= 6 ? "danger" : highRpeSets ? "warn" : "good",
  });
  items.push({
    label: completedNoVolume ? "Completed with no set data" : "Set logging",
    detail: completedNoVolume
      ? `${completedNoVolume} completed session${completedNoVolume === 1 ? "" : "s"} have no completed work-set volume.`
      : "Completed sessions have matching work-set data.",
    tone: completedNoVolume ? "warn" : "good",
  });
  items.push({
    label: noSetExercises ? "Plan parsing gaps" : "Planned work",
    detail: noSetExercises
      ? `${noSetExercises} exercise${noSetExercises === 1 ? "" : "s"} could not produce planned-set counts from Sheet values.`
      : "Every filtered exercise has a planned set count.",
    tone: noSetExercises ? "warn" : "good",
  });

  return items;
}

function buildPlannedRows(data: WorkoutAnalysisData, exercises: WorkoutExercise[]) {
  const sessionsById = new Map(data.sessions.map((session) => [session.session_id, session]));
  const blocksById = new Map(data.blocks.map((block) => [block.block_id, block]));

  return exercises.flatMap((exercise) => {
    const session = sessionsById.get(exercise.session_id);
    if (!session) return [];

    const sets = parseFirstNumber(exercise.sets);
    if (!sets) return [];

    const reps = parseFirstNumber(exercise.reps);
    const load = parseFirstNumber(exercise.target_load);
    return [
      {
        exercise,
        session,
        block: blocksById.get(session.block_id) ?? null,
        category: inferLiftCategory(exercise.exercise_name),
        sets,
        reps,
        load,
        volume: sets * reps * load,
      },
    ];
  });
}

function enrichSets(data: WorkoutAnalysisData, filter: (set: WorkoutExerciseSet) => boolean) {
  const exercisesById = new Map(data.exercises.map((exercise) => [exercise.exercise_id, exercise]));
  const sessionsById = new Map(data.sessions.map((session) => [session.session_id, session]));
  const blocksById = new Map(data.blocks.map((block) => [block.block_id, block]));

  return data.exerciseSets.flatMap((set) => {
    if (!filter(set)) return [];

    const exercise = exercisesById.get(set.exercise_id);
    if (!exercise) return [];

    const session = sessionsById.get(exercise.session_id);
    if (!session) return [];

    const reps = parseFirstNumber(set.reps);
    const load = parseFirstNumber(set.load);
    return [
      {
        set,
        exercise,
        session,
        block: blocksById.get(session.block_id) ?? null,
        category: inferLiftCategory(exercise.exercise_name),
        reps,
        load,
        rpe: parseOptionalNumber(set.rpe),
        volume: reps * load,
        estimatedOneRepMax: estimateOneRepMax(load, reps),
      },
    ];
  });
}

function inferLiftCategory(name: string): LiftCategory {
  const value = name.toLowerCase();
  if (/\b(squat|ssb|front squat|pause squat|box squat)\b/.test(value)) return "squat";
  if (/\b(bench|incline|decline|close grip|spoto|pin press)\b/.test(value)) return "bench";
  if (/\b(deadlift|pull from|rdl|romanian|sumo|conventional|block pull|rack pull)\b/.test(value)) return "deadlift";
  if (/\b(overhead|ohp|military|strict press|shoulder press)\b/.test(value)) return "press";
  if (/\b(row|pulldown|pull-up|pullup|chin|lat|face pull)\b/.test(value)) return "pull";
  return "accessory";
}

function findTopSet(sets: EnrichedSet[]) {
  return [...sets].sort((a, b) => b.estimatedOneRepMax - a.estimatedOneRepMax || b.load - a.load)[0] ?? null;
}

function formatSetLabel(item: EnrichedSet) {
  return `${item.exercise.exercise_name}: ${formatNumber(item.load)} x ${formatNumber(item.reps)} (${formatNumber(item.estimatedOneRepMax)} e1RM)`;
}

function estimateOneRepMax(load: number, reps: number) {
  if (!load || !reps) return 0;
  return load * (1 + reps / 30);
}

function parseFirstNumber(value: string) {
  const match = value.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : 0;
}

function parseOptionalNumber(value: string) {
  const parsed = parseFirstNumber(value);
  return parsed > 0 ? parsed : null;
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function getBlockProgressPercent(block: WorkoutBlock) {
  const today = getLocalDateKey();
  if (today <= block.start_date) return 0;
  if (today >= block.end_date) return 100;
  return percent(daysBetween(block.start_date, today) + 1, daysBetween(block.start_date, block.end_date) + 1);
}

function getWeekNumber(startDate: string, date: string) {
  return Math.floor(daysBetween(startDate, date) / 7) + 1;
}

function daysBetween(startDate: string, endDate: string) {
  const start = parseDate(startDate).getTime();
  const end = parseDate(endDate).getTime();
  return Math.max(0, Math.floor((end - start) / 86400000));
}

function addDays(date: string, days: number) {
  const nextDate = parseDate(date);
  nextDate.setDate(nextDate.getDate() + days);
  return toDateKey(nextDate);
}

function parseDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalDateKey() {
  return toDateKey(new Date());
}

function formatShortDate(date: string) {
  return parseDate(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-US");
}
