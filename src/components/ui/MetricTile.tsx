export function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#2b302c] bg-[#0b0d0d] p-3">
      <span className="block text-xs font-black uppercase text-[#8f948d]">{label}</span>
      <strong className="mt-1 block text-2xl font-black leading-none">{value}</strong>
    </div>
  );
}
