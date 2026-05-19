import { ConsoleBlock } from "@/components/dashboard/ConsoleBlock";
import { DashboardStats } from "@/types/dashboard";

type OperatorCanvasProps = {
  todayLabel: string;
  selectedDateLabel: string;
  focus: string;
  stats: DashboardStats;
  cloudReady: boolean;
};

export function OperatorCanvas({ todayLabel, selectedDateLabel, focus, stats, cloudReady }: OperatorCanvasProps) {
  return (
    <div className="relative min-h-[540px] border-b border-[#9ccfed] p-3 lg:min-h-0 lg:border-b-0 lg:border-r">
      <div className="grid h-full grid-cols-6 grid-rows-[0.9fr_1.1fr_1fr_1fr_1fr_1fr] gap-2 text-[#44789a]">
        <ConsoleBlock className="col-span-3 row-span-1" label="01 // Operator" title="Online" detail="Personal OS" />
        <ConsoleBlock className="col-span-3 row-span-1" label="02 // Session" title={selectedDateLabel} detail={`Today is ${todayLabel}`} />

        <ConsoleBlock
          className="col-span-6 row-span-1"
          label="03 // Focus"
          title={focus || "Set today's one thing"}
          detail="Daily capture"
          tone="warm"
        />

        <ConsoleBlock
          className="col-span-2 row-span-1"
          label="04 // Habits"
          title={`${stats.completedHabits}/${stats.totalHabits}`}
          detail={`${stats.score}% daily score`}
        />
        <ConsoleBlock className="col-span-2 row-span-1" label="05 // Tasks" title={`${stats.openTasks} open`} detail={`${stats.completedTasks} completed`} />
        <ConsoleBlock className="col-span-2 row-span-1" label="06 // Cloud" title={cloudReady ? "Ready" : "Needs env"} detail="Supabase" tone={cloudReady ? "default" : "hot"} />

        <section className="col-span-6 row-span-2 grid border border-[#9ccfed] bg-[#c7e8fb] p-3">
          <div className="grid grid-cols-4 gap-2 text-xs uppercase">
            <div>
              <p className="font-black text-[#0284c7]">07 // Memory</p>
              <strong className="mt-2 block text-2xl font-black uppercase leading-none text-[#0b3558]">Cloud-backed seed</strong>
            </div>
            <MiniReadout label="Mode" value="Build" />
            <MiniReadout label="Scope" value="Habits / Tasks" />
            <MiniReadout label="Next" value="Auth" />
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 self-end">
            {Array.from({ length: 28 }).map((_, index) => (
              <span
                className={`h-6 border border-[#9ccfed] ${index < stats.score / 4 ? "bg-[#0284c7]" : "bg-[#eaf7ff]"}`}
                key={index}
              />
            ))}
          </div>
        </section>

        <ConsoleBlock className="col-span-3 row-span-1" label="08 // Blockers" title={`${stats.openTasks} active`} detail="Tasks become blockers later" />
        <ConsoleBlock className="col-span-3 row-span-1" label="09 // Review" title="Weekly soon" detail="Pattern memory later" />
      </div>
    </div>
  );
}

function MiniReadout({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#9ccfed] bg-[#eaf7ff] p-2">
      <span className="block text-[#44789a]">{label}</span>
      <strong className="block text-[#0b3558]">{value}</strong>
    </div>
  );
}
