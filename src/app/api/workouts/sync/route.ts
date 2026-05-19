import { readWorkoutSheet } from "@/lib/workout-sheet";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Missing Supabase env vars." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const userId = userData.user.id;
    const parsed = await readWorkoutSheet();
    const now = new Date().toISOString();

    const blocks = parsed.blocks.map((block) => ({ ...block, user_id: userId, updated_at: now }));
    const sessions = parsed.sessions.map((session) => ({ ...session, user_id: userId, updated_at: now }));
    const exercises = parsed.exercises.map((exercise) => ({ ...exercise, user_id: userId, updated_at: now }));

    if (blocks.length) {
      const { error } = await supabase.from("workout_blocks").upsert(blocks, { onConflict: "user_id,block_id" });
      if (error) throw error;
    }
    if (sessions.length) {
      const { error } = await supabase.from("workout_sessions").upsert(sessions, { onConflict: "user_id,session_id" });
      if (error) throw error;
    }
    if (exercises.length) {
      const { error } = await supabase.from("workout_exercises").upsert(exercises, { onConflict: "user_id,exercise_id" });
      if (error) throw error;
    }

    const exerciseIds = exercises.map((exercise) => exercise.exercise_id);
    const exerciseDeleteQuery = supabase.from("workout_exercises").delete().eq("user_id", userId);
    const { error: exerciseDeleteError } = exerciseIds.length
      ? await exerciseDeleteQuery.not("exercise_id", "in", `(${exerciseIds.map(escapePostgrestValue).join(",")})`)
      : await exerciseDeleteQuery;
    if (exerciseDeleteError) throw exerciseDeleteError;

    const sessionIds = sessions.map((workoutSession) => workoutSession.session_id);
    const sessionDeleteQuery = supabase.from("workout_sessions").delete().eq("user_id", userId);
    const { error: sessionDeleteError } = sessionIds.length
      ? await sessionDeleteQuery.not("session_id", "in", `(${sessionIds.map(escapePostgrestValue).join(",")})`)
      : await sessionDeleteQuery;
    if (sessionDeleteError) throw sessionDeleteError;

    const blockIds = blocks.map((block) => block.block_id);
    const blockDeleteQuery = supabase.from("workout_blocks").delete().eq("user_id", userId);
    const { error: blockDeleteError } = blockIds.length
      ? await blockDeleteQuery.not("block_id", "in", `(${blockIds.map(escapePostgrestValue).join(",")})`)
      : await blockDeleteQuery;
    if (blockDeleteError) throw blockDeleteError;

    return NextResponse.json({
      ok: true,
      counts: { blocks: blocks.length, sessions: sessions.length, exercises: exercises.length },
      warnings: parsed.warnings,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapePostgrestValue(value: string) {
  return `"${value.replaceAll('"', '\\"')}"`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "Workout sync failed.";
}
