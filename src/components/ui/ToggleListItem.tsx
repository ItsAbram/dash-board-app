type ToggleListItemProps = {
  title: string;
  meta: string;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

export function ToggleListItem({ title, meta, done, onToggle, onDelete }: ToggleListItemProps) {
  return (
    <div className="grid min-h-12 grid-cols-[30px_1fr_28px] items-center gap-2 rounded-lg border border-[#2d6f99] bg-[#071827] p-2">
      <button
        className={`h-[30px] rounded-md font-black ${done ? "bg-[#7dd3fc] text-[#071827]" : "bg-[#123a56] text-[#7dd3fc]"}`}
        type="button"
        onClick={onToggle}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done ? "OK" : ""}
      </button>
      <div className="min-w-0">
        <p className={`break-words text-sm font-bold ${done ? "text-[#8fbad3] line-through" : ""}`}>{title}</p>
        <span className="text-[11px] uppercase text-[#8fbad3]">{meta}</span>
      </div>
      <button className="h-7 rounded-md text-lg text-[#38bdf8]" type="button" onClick={onDelete} aria-label={`Delete ${title}`}>
        x
      </button>
    </div>
  );
}
