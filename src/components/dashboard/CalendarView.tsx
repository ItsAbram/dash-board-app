import { CalendarDay, CalendarMode } from "@/types/dashboard";

type CalendarViewProps = {
  days: CalendarDay[];
  mode: CalendarMode;
  selectedLabel: string;
  onModeChange: (mode: CalendarMode) => void;
  onSelectDay: (dateKey: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function CalendarView({ days, mode, selectedLabel, onModeChange, onSelectDay, onPrevious, onNext, onToday }: CalendarViewProps) {
  return (
    <section className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Calendar</p>
          <h2 className="text-2xl font-black uppercase leading-none text-[#f4f4f5]">{selectedLabel}</h2>
        </div>
        <div className="grid grid-cols-[auto_auto_auto_auto_auto] gap-2">
          <button className="outline-action min-h-9 px-3" type="button" onClick={onPrevious} aria-label="Previous calendar range">
            &lt;
          </button>
          <button className={`outline-action min-h-9 px-3 ${mode === "week" ? "is-selected" : ""}`} type="button" onClick={() => onModeChange("week")}>
            Week
          </button>
          <button className={`outline-action min-h-9 px-3 ${mode === "month" ? "is-selected" : ""}`} type="button" onClick={() => onModeChange("month")}>
            Month
          </button>
          <button className="outline-action min-h-9 px-3" type="button" onClick={onToday}>
            Today
          </button>
          <button className="outline-action min-h-9 px-3" type="button" onClick={onNext} aria-label="Next calendar range">
            &gt;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <button
            className={`min-h-[104px] rounded-lg border p-2 text-left uppercase ${
              day.isSelected ? "border-[#f59e0b] bg-[#f59e0b] text-[#111111]" : "border-[#3a3a3a] bg-[#111111] text-[#f4f4f5]"
            }`}
            key={day.key}
            type="button"
            onClick={() => onSelectDay(day.key)}
          >
            <span className={`block text-[10px] font-black ${day.isSelected ? "text-[#111111]" : "text-[#a1a1aa]"}`}>{day.dayName}</span>
            <strong className="block text-2xl leading-none">{day.dayNumber}</strong>
            <span className={`block text-[10px] ${day.isSelected ? "text-[#111111]" : "text-[#a1a1aa]"}`}>{day.monthName}</span>
            <span className={`mt-3 block text-[10px] ${day.isSelected ? "text-[#111111]" : "text-[#a1a1aa]"}`}>
              {day.score}% habits
            </span>
            <span className={`block text-[10px] ${day.isSelected ? "text-[#111111]" : "text-[#a1a1aa]"}`}>{day.taskCount} tasks</span>
            {day.isToday ? <span className="mt-1 block text-[10px] font-black">Today</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
