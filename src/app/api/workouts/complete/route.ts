import { appendWorkoutCompletion } from "@/lib/workout-sheet";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CompleteRequest = {
  session_id?: string;
  status?: "complete" | "skipped";
  notes?: string;
  completed_exercises?: string[];
};

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Missing Supabase env vars." }, { status: 500 });
  }

  const body = (await request.json()) as CompleteRequest;
  if (!body.session_id || !body.status) {
    return NextResponse.json({ error: "Missing session_id or status." }, { status: 400 });
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
    const completedAt = new Date().toISOString();
    const completion = {
      user_id: userData.user.id,
      session_id: body.session_id,
      status: body.status,
      completed_at: completedAt,
      notes: body.notes ?? "",
      updated_at: completedAt,
    };

    const { error } = await supabase.from("workout_session_completions").upsert(completion, { onConflict: "user_id,session_id" });
    if (error) throw error;

    await appendWorkoutCompletion({
      completed_at: completedAt,
      session_id: body.session_id,
      status: body.status,
      notes: body.notes ?? "",
      completed_exercises: body.completed_exercises ?? [],
    });

    return NextResponse.json({ ok: true, completion });
  } catch (error) {
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "Workout completion failed.";
}
