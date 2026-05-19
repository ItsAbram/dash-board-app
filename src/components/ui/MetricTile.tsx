export function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#2d6f99] bg-[#0b2438] p-3">
      <span className="block text-xs font-black uppercase text-[#8fbad3]">{label}</span>
      <strong className="mt-1 block text-2xl font-black leading-none">{value}</strong>
    </div>
  );
}
