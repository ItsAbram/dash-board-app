export function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
      <span className="block text-xs font-black uppercase text-[#a1a1aa]">{label}</span>
      <strong className="mt-1 block text-2xl font-black leading-none">{value}</strong>
    </div>
  );
}
