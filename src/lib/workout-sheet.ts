import { google } from "googleapis";
import { WorkoutBlock, WorkoutExercise, WorkoutSession, WorkoutSyncWarning } from "@/types/workouts";

type SheetRows = Record<string, string[][]>;

type ParsedWorkoutSheet = {
  blocks: Omit<WorkoutBlock, "user_id">[];
  sessions: Omit<WorkoutSession, "user_id">[];
  exercises: Omit<WorkoutExercise, "user_id">[];
  warnings: WorkoutSyncWarning[];
};

const requiredHeaders = {
  Blocks: ["block_id", "block_name", "start_date", "end_date"],
  Sessions: ["session_id", "block_id", "date", "session_name"],
  Exercises: ["exercise_id", "session_id", "exercise_name"],
};

export async function readWorkoutSheet() {
  const { sheets, spreadsheetId } = getWorkoutSheetsClient();
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: ["Blocks!A:F", "Sessions!A:I", "Exercises!A:H"],
  });

  const rows: SheetRows = {};
  for (const valueRange of response.data.valueRanges ?? []) {
    const name = valueRange.range?.split("!")[0]?.replaceAll("'", "");
    if (name) rows[name] = valueRange.values ?? [];
  }

  return parseWorkoutSheet(rows);
}

function getWorkoutSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_WORKOUT_SHEET_ID;

  if (!email || !key || !spreadsheetId) {
    throw new Error("Missing Google Sheets env vars.");
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, spreadsheetId };
}

export function parseWorkoutSheet(rows: SheetRows): ParsedWorkoutSheet {
  const warnings: WorkoutSyncWarning[] = [];
  const blockRows = readRows("Blocks", rows.Blocks ?? [], warnings);
  const sessionRows = readRows("Sessions", rows.Sessions ?? [], warnings);
  const exerciseRows = readRows("Exercises", rows.Exercises ?? [], warnings);

  const blocks = blockRows.flatMap(({ row, rowNumber }) => {
    if (!row.block_id || !row.block_name || !row.start_date || !row.end_date) {
      warnings.push({ sheet: "Blocks", row: rowNumber, message: "Missing block_id, block_name, start_date, or end_date." });
      return [];
    }

    return [
      {
        block_id: row.block_id,
        block_name: row.block_name,
        start_date: row.start_date,
        end_date: row.end_date,
        goal: row.goal ?? "",
        notes: row.notes ?? "",
      },
    ];
  });

  const validBlockIds = new Set(blocks.map((block) => block.block_id));
  const sessions = sessionRows.flatMap(({ row, rowNumber }) => {
    if (!row.session_id || !row.block_id || !row.date || !row.session_name) {
      warnings.push({ sheet: "Sessions", row: rowNumber, message: "Missing session_id, block_id, date, or session_name." });
      return [];
    }
    if (!validBlockIds.has(row.block_id)) {
      warnings.push({ sheet: "Sessions", row: rowNumber, message: `Unknown block_id "${row.block_id}".` });
      return [];
    }

    return [
      {
        session_id: row.session_id,
        block_id: row.block_id,
        date: row.date,
        session_name: row.session_name,
        template_name: row.template_name ?? "",
        priority: row.priority ?? "normal",
        estimated_minutes: row.estimated_minutes ? Number(row.estimated_minutes) || null : null,
        tags: splitTags(row.tags),
        notes: row.notes ?? "",
      },
    ];
  });

  const validSessionIds = new Set(sessions.map((session) => session.session_id));
  const exercises = exerciseRows.flatMap(({ row, rowNumber }) => {
    if (!row.exercise_id || !row.session_id || !row.exercise_name) {
      warnings.push({ sheet: "Exercises", row: rowNumber, message: "Missing exercise_id, session_id, or exercise_name." });
      return [];
    }
    if (!validSessionIds.has(row.session_id)) {
      warnings.push({ sheet: "Exercises", row: rowNumber, message: `Unknown session_id "${row.session_id}".` });
      return [];
    }

    return [
      {
        exercise_id: row.exercise_id,
        session_id: row.session_id,
        order_index: row.order ? Number(row.order) || 0 : 0,
        exercise_name: row.exercise_name,
        sets: row.sets ?? "",
        reps: row.reps ?? "",
        target_load: row.target_load ?? "",
        notes: row.notes ?? "",
      },
    ];
  });

  return { blocks, sessions, exercises, warnings };
}

function readRows(sheet: keyof typeof requiredHeaders, rows: string[][], warnings: WorkoutSyncWarning[]) {
  if (rows.length === 0) {
    warnings.push({ sheet, row: 1, message: "Sheet is empty." });
    return [];
  }

  const headers = rows[0].map((header) => header.trim());
  const missingHeaders = requiredHeaders[sheet].filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    warnings.push({ sheet, row: 1, message: `Missing headers: ${missingHeaders.join(", ")}.` });
    return [];
  }

  return rows.slice(1).flatMap((values, index) => {
    const rowNumber = index + 2;
    if (values.every((value) => !value?.trim())) return [];

    const row = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex]?.trim() ?? ""]));
    return [{ row, rowNumber }];
  });
}

function splitTags(value?: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
