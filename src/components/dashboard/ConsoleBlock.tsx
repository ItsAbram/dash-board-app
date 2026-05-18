type ConsoleBlockProps = {
  label: string;
  title: string;
  detail: string;
  className: string;
  tone?: "default" | "hot" | "warm";
};

const toneClasses = {
  default: "border-[#9ccfed] bg-[#c7e8fb]",
  hot: "border-[#0369a1]/60 bg-[#cdeafe]",
  warm: "border-[#38bdf8]/60 bg-[#dff3ff]",
};

export function ConsoleBlock({ label, title, detail, className, tone = "default" }: ConsoleBlockProps) {
  return (
    <div className={`${className} grid content-between border p-3 ${toneClasses[tone]}`}>
      <p className="text-xs font-black uppercase tracking-wide text-[#0284c7]">{label}</p>
      <div>
        <strong className="block break-words text-lg font-black uppercase leading-tight text-[#0b3558]">{title}</strong>
        <span className="text-xs uppercase text-[#44789a]">{detail}</span>
      </div>
    </div>
  );
}
