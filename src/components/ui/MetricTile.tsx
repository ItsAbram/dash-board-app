export function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#9ccfed] bg-[#d8efff] p-3">
      <span className="block text-xs font-black uppercase text-[#44789a]">{label}</span>
      <strong className="mt-1 block text-2xl font-black leading-none">{value}</strong>
    </div>
  );
}
