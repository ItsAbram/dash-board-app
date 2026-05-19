import { FormEvent } from "react";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { MetricTile } from "@/components/ui/MetricTile";
import { Panel } from "@/components/ui/Panel";
import { ToggleListItem } from "@/components/ui/ToggleListItem";
import { CalendarDay, CalendarMode, DashboardState, DashboardStats, Task } from "@/types/dashboard";

type DashboardWorkspaceProps = {
  state: DashboardState;
  dayTasks: Task[];
  stats: DashboardStats;
  calendarDays: CalendarDay[];
  calendarMode: CalendarMode;
  selectedDateKey: string;
  todayLabel: string;
  selectedDateLabel: string;
  status: string;
  habitTitle: string;
  taskTitle: string;
  cloudReady: boolean;
  onCalendarModeChange: (mode: CalendarMode) => void;
  onSelectDay: (dateKey: string) => void;
  onPreviousCalendar: () => void;
  onNextCalendar: () => void;
  onToday: () => void;
  onFocusChange: (value: string) => void;
  onHabitTitleChange: (value: string) => void;
  onTaskTitleChange: (value: string) => void;
  onAddHabit: (event: FormEvent) => void;
  onAddTask: (event: FormEvent) => void;
  onToggleHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onLoadCloud: () => void;
  onSaveCloud: () => void;
};

export function DashboardWorkspace({
  state,
  dayTasks,
  stats,
  calendarDays,
  calendarMode,
  selectedDateKey,
  todayLabel,
  selectedDateLabel,
  status,
  habitTitle,
  taskTitle,
  cloudReady,
  onCalendarModeChange,
  onSelectDay,
  onPreviousCalendar,
  onNextCalendar,
  onToday,
  onFocusChange,
  onHabitTitleChange,
  onTaskTitleChange,
  onAddHabit,
  onAddTask,
  onToggleHabit,
  onDeleteHabit,
  onToggleTask,
  onDeleteTask,
  onLoadCloud,
  onSaveCloud,
}: DashboardWorkspaceProps) {
  return (
    <section className="grid gap-3">
      <header className="grid gap-3 border border-[#9ccfed] bg-[#d8efff] p-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#0284c7]">Personal OS</p>
          <h1 className="text-4xl font-black uppercase leading-none text-[#0b3558] md:text-6xl">Dash Board</h1>
          <p className="mt-2 text-sm uppercase text-[#44789a]">Viewing {selectedDateLabel}. Today is {todayLabel}.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MetricTile label="Habits" value={`${stats.completedHabits}/${stats.totalHabits}`} />
          <MetricTile label="Open" value={String(stats.openTasks)} />
          <MetricTile label="Score" value={`${stats.score}%`} />
        </div>
      </header>

      <CalendarView
        days={calendarDays}
        mode={calendarMode}
        onModeChange={onCalendarModeChange}
        onNext={onNextCalendar}
        onPrevious={onPreviousCalendar}
        onSelectDay={onSelectDay}
        onToday={onToday}
        selectedLabel={selectedDateLabel}
      />

      <section className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr]">
        <Panel label="Focus">
          <input
            className="field"
            value={state.focus[selectedDateKey] || ""}
            onChange={(event) => onFocusChange(event.target.value)}
            placeholder="Set this day's one thing"
          />
        </Panel>

        <Panel label="Habits">
          <form className="mb-2 grid grid-cols-[1fr_42px] gap-2" onSubmit={onAddHabit}>
            <input className="field" value={habitTitle} onChange={(event) => onHabitTitleChange(event.target.value)} placeholder="Add habit" />
            <button className="action" type="submit">+</button>
          </form>
          <div className="grid gap-2">
            {state.habits.map((habit) => (
              <ToggleListItem
                key={habit.id}
                title={habit.title}
                meta={habit.checkins[selectedDateKey] ? "Done this day" : "Waiting"}
                done={Boolean(habit.checkins[selectedDateKey])}
                onToggle={() => onToggleHabit(habit.id)}
                onDelete={() => onDeleteHabit(habit.id)}
              />
            ))}
          </div>
        </Panel>

        <Panel label="Tasks">
          <form className="mb-2 grid grid-cols-[1fr_42px] gap-2" onSubmit={onAddTask}>
            <input className="field" value={taskTitle} onChange={(event) => onTaskTitleChange(event.target.value)} placeholder="Add task for selected day" />
            <button className="action" type="submit">+</button>
          </form>
          <div className="grid gap-2">
            {dayTasks.map((task) => (
              <ToggleListItem
                key={task.id}
                title={task.title}
                meta={task.done ? "Completed" : "Open"}
                done={task.done}
                onToggle={() => onToggleTask(task.id)}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}
            {dayTasks.length === 0 ? <p className="border border-[#9ccfed] bg-[#eaf7ff] p-3 text-sm uppercase text-[#44789a]">No tasks for this day.</p> : null}
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <SecondaryModule label="Memory" title={cloudReady ? "Cloud ready" : "Needs env"} detail={status} />
        <SecondaryModule label="Review" title="Weekly review later" detail="This will summarize patterns once there is enough daily history." />
        <SecondaryModule label="Blockers" title={`${stats.openTasks} active`} detail="For now, open tasks are the blocker source." />
      </section>

      <footer className="grid gap-2 border border-[#9ccfed] bg-[#d8efff] p-3 md:grid-cols-[1fr_auto] md:items-center">
        <p className="text-xs uppercase text-[#44789a]">{status}</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="outline-action px-3" type="button" onClick={onLoadCloud}>Load Cloud</button>
          <button className="outline-action px-3" type="button" onClick={onSaveCloud}>Save Cloud</button>
        </div>
      </footer>
    </section>
  );
}

function SecondaryModule({ label, title, detail }: { label: string; title: string; detail: string }) {
  return (
    <article className="border border-[#9ccfed] bg-[#c7e8fb] p-3">
      <p className="text-xs font-black uppercase tracking-wide text-[#0284c7]">{label}</p>
      <strong className="mt-2 block text-xl font-black uppercase leading-tight text-[#0b3558]">{title}</strong>
      <p className="mt-2 text-xs uppercase leading-relaxed text-[#44789a]">{detail}</p>
    </article>
  );
}
