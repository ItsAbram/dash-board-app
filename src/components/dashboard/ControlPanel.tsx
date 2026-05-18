import { FormEvent } from "react";
import { MetricTile } from "@/components/ui/MetricTile";
import { Panel } from "@/components/ui/Panel";
import { ToggleListItem } from "@/components/ui/ToggleListItem";
import { DashboardState, DashboardStats } from "@/types/dashboard";

type ControlPanelProps = {
  state: DashboardState;
  stats: DashboardStats;
  todayKey: string;
  todayLabel: string;
  status: string;
  habitTitle: string;
  taskTitle: string;
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

export function ControlPanel({
  state,
  stats,
  todayKey,
  todayLabel,
  status,
  habitTitle,
  taskTitle,
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
}: ControlPanelProps) {
  return (
    <aside className="grid content-start gap-3 overflow-auto border-[#d8ff63]/40 bg-[#080a0a]/95 p-3">
      <header className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#2b302c] pb-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#d8ff63]">Live Layer</p>
          <h1 className="text-3xl font-black uppercase leading-none">Dash Board</h1>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase text-[#8f948d]">{todayLabel}</p>
          <strong className="text-2xl font-black text-[#d8ff63]">{stats.score}%</strong>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <MetricTile label="Habits" value={`${stats.completedHabits}/${stats.totalHabits}`} />
        <MetricTile label="Open" value={String(stats.openTasks)} />
        <MetricTile label="Done" value={String(stats.completedTasks)} />
      </div>

      <Panel label="Today I Will">
        <input
          className="field"
          value={state.focus[todayKey] || ""}
          onChange={(event) => onFocusChange(event.target.value)}
          placeholder="Set today's one thing"
        />
      </Panel>

      <Panel label="Habits">
        <form className="mb-2 grid grid-cols-[1fr_42px] gap-2" onSubmit={onAddHabit}>
          <input className="field" value={habitTitle} onChange={(event) => onHabitTitleChange(event.target.value)} placeholder="Add habit" />
          <button className="action" type="submit">
            +
          </button>
        </form>
        <div className="grid gap-2">
          {state.habits.map((habit) => (
            <ToggleListItem
              key={habit.id}
              title={habit.title}
              meta={habit.checkins[todayKey] ? "Done today" : "Waiting"}
              done={Boolean(habit.checkins[todayKey])}
              onToggle={() => onToggleHabit(habit.id)}
              onDelete={() => onDeleteHabit(habit.id)}
            />
          ))}
        </div>
      </Panel>

      <Panel label="Tasks">
        <form className="mb-2 grid grid-cols-[1fr_42px] gap-2" onSubmit={onAddTask}>
          <input className="field" value={taskTitle} onChange={(event) => onTaskTitleChange(event.target.value)} placeholder="Add task" />
          <button className="action" type="submit">
            +
          </button>
        </form>
        <div className="grid gap-2">
          {state.tasks.map((task) => (
            <ToggleListItem
              key={task.id}
              title={task.title}
              meta={task.done ? "Completed" : "Open"}
              done={task.done}
              onToggle={() => onToggleTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      </Panel>

      <footer className="grid gap-2 border border-[#2b302c] bg-[#0b0d0d] p-3">
        <p className="text-xs text-[#8f948d]">{status}</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="outline-action" type="button" onClick={onLoadCloud}>
            Load Cloud
          </button>
          <button className="outline-action" type="button" onClick={onSaveCloud}>
            Save Cloud
          </button>
        </div>
      </footer>
    </aside>
  );
}
