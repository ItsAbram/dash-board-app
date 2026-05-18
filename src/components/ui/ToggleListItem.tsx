type ToggleListItemProps = {
  title: string;
  meta: string;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

export function ToggleListItem({ title, meta, done, onToggle, onDelete }: ToggleListItemProps) {
  return (
    <div className="grid min-h-12 grid-cols-[30px_1fr_28px] items-center gap-2 border border-[#9ccfed] bg-[#eaf7ff] p-2">
      <button
        className={`h-[30px] font-black ${done ? "bg-[#0284c7] text-[#eaf7ff]" : "bg-[#b9e2f7] text-[#0284c7]"}`}
        type="button"
        onClick={onToggle}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done ? "OK" : ""}
      </button>
      <div className="min-w-0">
        <p className={`break-words text-sm font-bold ${done ? "text-[#44789a] line-through" : ""}`}>{title}</p>
        <span className="text-[11px] uppercase text-[#44789a]">{meta}</span>
      </div>
      <button className="h-7 text-lg text-[#0369a1]" type="button" onClick={onDelete} aria-label={`Delete ${title}`}>
        x
      </button>
    </div>
  );
}
