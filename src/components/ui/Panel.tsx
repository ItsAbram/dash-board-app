import { ReactNode } from "react";

export function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="border border-[#9ccfed] bg-[#d8efff] p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#0284c7]">{label}</p>
      {children}
    </section>
  );
}
