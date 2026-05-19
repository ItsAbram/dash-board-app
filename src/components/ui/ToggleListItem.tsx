type ToggleListItemProps = {
  title: string;
  meta: string;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

export function ToggleListItem({ title, meta, done, onToggle, onDelete }: ToggleListItemProps) {
  return (
    <div className="grid min-h-12 grid-cols-[30px_1fr_28px] items-center gap-2 rounded-lg border border-[#3a3a3a] bg-[#111111] p-2">
      <button
        className={`h-[30px] rounded-md font-black ${done ? "bg-[#f59e0b] text-[#111111]" : "bg-[#333333] text-[#f59e0b]"}`}
        type="button"
        onClick={onToggle}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done ? "OK" : ""}
      </button>
      <div className="min-w-0">
        <p className={`break-words text-sm font-bold ${done ? "text-[#a1a1aa] line-through" : ""}`}>{title}</p>
        <span className="text-[11px] uppercase text-[#a1a1aa]">{meta}</span>
      </div>
      <button className="h-7 rounded-md text-lg text-[#ef4444]" type="button" onClick={onDelete} aria-label={`Delete ${title}`}>
        x
      </button>
    </div>
  );
}
