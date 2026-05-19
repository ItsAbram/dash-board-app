import { CalendarDay } from "@/types/dashboard";

type CalendarStripProps = {
  days: CalendarDay[];
  selectedLabel: string;
  onSelectDay: (dateKey: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
};

export function CalendarStrip({ days, selectedLabel, onSelectDay, onPreviousWeek, onNextWeek, onToday }: CalendarStripProps) {
  return (
    <section className="grid gap-2 border border-[#9ccfed] bg-[#d8efff] p-3">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2">
        <button className="outline-action min-h-8 px-2" type="button" onClick={onPreviousWeek} aria-label="Previous days">
          &lt;
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#0284c7]">Calendar View</p>
          <strong className="block text-sm uppercase leading-tight text-[#0b3558]">{selectedLabel}</strong>
        </div>
        <button className="outline-action min-h-8 px-2" type="button" onClick={onToday}>
          Today
        </button>
        <button className="outline-action min-h-8 px-2" type="button" onClick={onNextWeek} aria-label="Next days">
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <button
            className={`min-h-[82px] border p-2 text-left uppercase ${
              day.isSelected ? "border-[#0284c7] bg-[#0284c7] text-[#eaf7ff]" : "border-[#9ccfed] bg-[#eaf7ff] text-[#0b3558]"
            }`}
            key={day.key}
            type="button"
            onClick={() => onSelectDay(day.key)}
          >
            <span className={`block text-[10px] font-black ${day.isSelected ? "text-[#eaf7ff]" : "text-[#44789a]"}`}>{day.dayName}</span>
            <strong className="block text-xl leading-none">{day.dayNumber}</strong>
            <span className={`block text-[10px] ${day.isSelected ? "text-[#eaf7ff]" : "text-[#44789a]"}`}>{day.monthName}</span>
            <span className={`mt-2 block text-[10px] ${day.isSelected ? "text-[#eaf7ff]" : "text-[#44789a]"}`}>
              {day.score}% / {day.taskCount} tasks
            </span>
            {day.isToday ? <span className="mt-1 block text-[10px] font-black">Today</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
