type ConsoleBlockProps = {
  label: string;
  title: string;
  detail: string;
  className: string;
  tone?: "default" | "hot" | "warm";
};

const toneClasses = {
  default: "border-[#2d6f99] bg-[#102f47]",
  hot: "border-[#38bdf8]/60 bg-[#cdeafe]",
  warm: "border-[#38bdf8]/60 bg-[#dff3ff]",
};

export function ConsoleBlock({ label, title, detail, className, tone = "default" }: ConsoleBlockProps) {
  return (
    <div className={`${className} grid content-between border p-3 ${toneClasses[tone]}`}>
      <p className="text-xs font-black uppercase tracking-wide text-[#7dd3fc]">{label}</p>
      <div>
        <strong className="block break-words text-lg font-black uppercase leading-tight text-[#d9f3ff]">{title}</strong>
        <span className="text-xs uppercase text-[#8fbad3]">{detail}</span>
      </div>
    </div>
  );
}
