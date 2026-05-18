type ToggleListItemProps = {
  title: string;
  meta: string;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

export function ToggleListItem({ title, meta, done, onToggle, onDelete }: ToggleListItemProps) {
  return (
    <div className="grid min-h-12 grid-cols-[30px_1fr_28px] items-center gap-2 border border-[#2b302c] bg-[#080a0a] p-2">
      <button
        className={`h-[30px] font-black ${done ? "bg-[#d8ff63] text-[#080a0a]" : "bg-[#171c19] text-[#d8ff63]"}`}
        type="button"
        onClick={onToggle}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done ? "OK" : ""}
      </button>
      <div className="min-w-0">
        <p className={`break-words text-sm font-bold ${done ? "text-[#8f948d] line-through" : ""}`}>{title}</p>
        <span className="text-[11px] uppercase text-[#8f948d]">{meta}</span>
      </div>
      <button className="h-7 text-lg text-[#ff6d7a]" type="button" onClick={onDelete} aria-label={`Delete ${title}`}>
        x
      </button>
    </div>
  );
}
