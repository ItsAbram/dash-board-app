import { FormEvent } from "react";
import Link from "next/link";
import { AuthPanel } from "@/components/auth/AuthPanel";
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
  authEmail: string;
  authPassword: string;
  userEmail?: string;
  isSignedIn: boolean;
  onAuthEmailChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignOut: () => void;
  onCalendarModeChange: (mode: CalendarMode) => void;
  onSelectDay: (dateKey: string) => void;
  onPreviousCalendar: () => void;
  onNextCalendar: () => void;
  onToday: () => void;
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
  authEmail,
  authPassword,
  userEmail,
  isSignedIn,
  onAuthEmailChange,
  onAuthPasswordChange,
  onSignIn,
  onSignUp,
  onSignOut,
  onCalendarModeChange,
  onSelectDay,
  onPreviousCalendar,
  onNextCalendar,
  onToday,
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
      <header className="grid gap-3 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Personal OS</p>
          <h1 className="text-4xl font-black uppercase leading-none text-[#f4f4f5] md:text-6xl">Dash Board</h1>
          <p className="mt-2 text-sm uppercase text-[#a1a1aa]">Viewing {selectedDateLabel}. Today is {todayLabel}.</p>
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
        <Panel label="Health Workspace">
          <div className="grid gap-3">
            <p className="text-sm uppercase leading-relaxed text-[#a1a1aa]">
              Workouts, health notes, and body metrics will live in their own workspace.
            </p>
            <Link
              className="grid min-h-[132px] content-between rounded-lg border border-[#f59e0b] bg-[#2a2a2a] p-4 uppercase text-[#f4f4f5]"
              href="/health"
            >
              <span className="text-xs font-black tracking-wide text-[#f59e0b]">Open</span>
              <strong className="text-2xl font-black leading-none">Workout + Health</strong>
              <span className="text-xs text-[#a1a1aa]">Build plans, logs, recovery, and metrics</span>
            </Link>
          </div>
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
            {dayTasks.length === 0 ? <p className="rounded-lg border border-[#3a3a3a] bg-[#111111] p-3 text-sm uppercase text-[#a1a1aa]">No tasks for this day.</p> : null}
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <SecondaryModule label="Memory" title={cloudReady ? "Cloud ready" : "Needs env"} detail={status} />
        <SecondaryModule label="Review" title="Weekly review later" detail="This will summarize patterns once there is enough daily history." />
        <SecondaryModule label="Blockers" title={`${stats.openTasks} active`} detail="For now, open tasks are the blocker source." />
      </section>

      <footer className="grid gap-2 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3 md:grid-cols-[1fr_auto] md:items-center">
        <p className="text-xs uppercase text-[#a1a1aa]">{status}</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="outline-action px-3" type="button" onClick={onLoadCloud}>Load Cloud</button>
          <button className="outline-action px-3" type="button" onClick={onSaveCloud}>Save Cloud</button>
        </div>
      </footer>

      <AuthPanel
        email={authEmail}
        isSignedIn={isSignedIn}
        onEmailChange={onAuthEmailChange}
        onPasswordChange={onAuthPasswordChange}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        onSignUp={onSignUp}
        password={authPassword}
        userEmail={userEmail}
      />
    </section>
  );
}

function SecondaryModule({ label, title, detail }: { label: string; title: string; detail: string }) {
  return (
    <article className="rounded-lg border border-[#3a3a3a] bg-[#2a2a2a] p-3">
      <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">{label}</p>
      <strong className="mt-2 block text-xl font-black uppercase leading-tight text-[#f4f4f5]">{title}</strong>
      <p className="mt-2 text-xs uppercase leading-relaxed text-[#a1a1aa]">{detail}</p>
    </article>
  );
}
