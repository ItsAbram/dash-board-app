import { ReactNode } from "react";

export function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="border border-[#2b302c] bg-[#0b0d0d] p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#d8ff63]">{label}</p>
      {children}
    </section>
  );
}
