import React from "react";
import { format, isToday } from "date-fns";
import { Task } from "@/types";
import TaskCard from "@/components/Task/TaskCard";
import { toDateKey } from "@/lib/utils";
import { Plus, CalendarDays } from "lucide-react";

interface Props {
  refDate: Date;
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onQuickAdd: (dateKey: string) => void;
}

export default function DayView({ refDate, tasks, onOpenTask, onQuickAdd }: Props) {
  const key = toDateKey(refDate);
  const dayTasks = tasks
    .filter((t) => toDateKey(t.dueDate) === key)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-panel border border-slate-100 bg-white p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-pine-500" />
          <div>
            <p className={isToday(refDate) ? "font-display text-lg font-semibold text-pine-600" : "font-display text-lg font-semibold text-ink"}>
              {format(refDate, "EEEE, d 'de' MMMM")}
            </p>
            <p className="text-xs text-slate-500">{dayTasks.length} tarefa(s) com prazo neste dia</p>
          </div>
        </div>
        <button
          onClick={() => onQuickAdd(key)}
          className="flex items-center gap-1 rounded-card border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-slate-100"
        >
          <Plus size={13} /> Nova tarefa
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {dayTasks.map((t) => (
          <TaskCard key={t.id} task={t} onClick={() => onOpenTask(t.id)} draggable={false} />
        ))}
        {dayTasks.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">Nenhuma tarefa para este dia. Aproveite! 🎉</p>
        )}
      </div>
    </div>
  );
}
