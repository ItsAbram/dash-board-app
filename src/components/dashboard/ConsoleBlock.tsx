type ConsoleBlockProps = {
  label: string;
  title: string;
  detail: string;
  className: string;
  tone?: "default" | "hot" | "warm";
};

const toneClasses = {
  default: "border-[#2b302c] bg-[#101312]",
  hot: "border-[#ff6d7a]/60 bg-[#171010]",
  warm: "border-[#e0a84d]/60 bg-[#171410]",
};

export function ConsoleBlock({ label, title, detail, className, tone = "default" }: ConsoleBlockProps) {
  return (
    <div className={`${className} grid content-between border p-3 ${toneClasses[tone]}`}>
      <p className="text-xs font-black uppercase tracking-wide text-[#d8ff63]">{label}</p>
      <div>
        <strong className="block break-words text-lg font-black uppercase leading-tight text-[#f2f0e8]">{title}</strong>
        <span className="text-xs uppercase text-[#8f948d]">{detail}</span>
      </div>
    </div>
  );
}
