import { ReactNode } from "react";

export function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#2d6f99] bg-[#0b2438] p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#7dd3fc]">{label}</p>
      {children}
    </section>
  );
}
