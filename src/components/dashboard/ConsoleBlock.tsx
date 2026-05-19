type ConsoleBlockProps = {
  label: string;
  title: string;
  detail: string;
  className: string;
  tone?: "default" | "hot" | "warm";
};

const toneClasses = {
  default: "border-[#3a3a3a] bg-[#2a2a2a]",
  hot: "border-[#ef4444]/60 bg-[#2a1a1a]",
  warm: "border-[#ef4444]/60 bg-[#2a2418]",
};

export function ConsoleBlock({ label, title, detail, className, tone = "default" }: ConsoleBlockProps) {
  return (
    <div className={`${className} grid content-between border p-3 ${toneClasses[tone]}`}>
      <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">{label}</p>
      <div>
        <strong className="block break-words text-lg font-black uppercase leading-tight text-[#f4f4f5]">{title}</strong>
        <span className="text-xs uppercase text-[#a1a1aa]">{detail}</span>
      </div>
    </div>
  );
}
