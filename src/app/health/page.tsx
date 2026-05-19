import Link from "next/link";

const workoutSections = [
  { label: "Training", title: "Workout Log", detail: "Track sessions, sets, reps, load, and notes." },
  { label: "Recovery", title: "Readiness", detail: "Sleep, soreness, energy, stress, and recovery signals." },
  { label: "Body", title: "Health Metrics", detail: "Weight, measurements, symptoms, and daily health observations." },
];

export default function HealthPage() {
  return (
    <main className="min-h-screen bg-[#111111] px-3 py-3 font-mono text-[#f4f4f5]">
      <section className="mx-auto grid min-h-[calc(100vh-24px)] max-w-7xl content-start gap-3 rounded-lg border border-[#3a3a3a] bg-[#111111] p-3">
        <header className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Workspace</p>
            <h1 className="text-4xl font-black uppercase leading-none md:text-6xl">Health</h1>
            <p className="mt-2 text-sm uppercase text-[#a1a1aa]">Workout and health tracking will be built here.</p>
          </div>
          <Link className="outline-action grid min-h-10 place-items-center px-4" href="/">
            Back to Dashboard
          </Link>
        </header>

        <section className="grid gap-3 lg:grid-cols-3">
          {workoutSections.map((section) => (
            <article className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-4" key={section.label}>
              <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">{section.label}</p>
              <h2 className="mt-2 text-2xl font-black uppercase leading-none">{section.title}</h2>
              <p className="mt-3 text-sm uppercase leading-relaxed text-[#a1a1aa]">{section.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#2a2a2a] p-4">
          <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Next Build</p>
          <div className="grid gap-2 text-sm uppercase text-[#a1a1aa]">
            <p>1. Workout templates</p>
            <p>2. Daily workout logging</p>
            <p>3. Health notes and recovery metrics</p>
            <p>4. Supabase tables for long-term history</p>
          </div>
        </section>
      </section>
    </main>
  );
}
