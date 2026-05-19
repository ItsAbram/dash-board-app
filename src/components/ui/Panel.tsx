import { ReactNode } from "react";

export function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#f59e0b]">{label}</p>
      {children}
    </section>
  );
}
