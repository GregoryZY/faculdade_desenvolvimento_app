import React, { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Task } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import TaskCard from "@/components/Task/TaskCard";
import { toDateKey, cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Props {
  refDate: Date;
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onQuickAdd: (dateKey: string) => void;
}

export default function MonthView({ refDate, tasks, onOpenTask, onQuickAdd }: Props) {
  const reschedule = useAppStore((s) => s.rescheduleTask);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const gridStart = startOfWeek(startOfMonth(refDate), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(refDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const tasksByDay = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = toDateKey(t.dueDate);
    if (!tasksByDay.has(key)) tasksByDay.set(key, []);
    tasksByDay.get(key)!.push(t);
  }

  function handleDrop(e: React.DragEvent, dateKey: string) {
    e.preventDefault();
    setDragOverKey(null);
    const taskId = e.dataTransfer.getData("text/task-id");
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const oldDue = new Date(task.dueDate);
    const [y, m, d] = dateKey.split("-").map(Number);
    const newDue = new Date(y, m - 1, d, oldDue.getHours(), oldDue.getMinutes());
    reschedule(task.id, dateKey, newDue.toISOString());
  }

  const weekDayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-panel border border-slate-100 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
        {weekDayLabels.map((d) => (
          <div key={d} className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6 overflow-y-auto">
        {days.map((day) => {
          const key = toDateKey(day);
          const dayTasks = (tasksByDay.get(key) ?? []).slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
          const inMonth = isSameMonth(day, refDate);
          return (
            <div
              key={key}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverKey(key);
              }}
              onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
              onDrop={(e) => handleDrop(e, key)}
              className={cn(
                "group flex min-h-[110px] flex-col gap-1 border-b border-r border-slate-100 p-1.5",
                !inMonth && "bg-slate-50/50",
                dragOverKey === key && "drop-target-active"
              )}
            >
              <div className="flex items-center justify-between px-0.5">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                    isToday(day) ? "bg-pine-500 font-semibold text-white" : inMonth ? "text-ink-soft" : "text-slate-400"
                  )}
                >
                  {format(day, "d")}
                </span>
                <button
                  onClick={() => onQuickAdd(key)}
                  className="hidden rounded p-0.5 text-slate-400 hover:bg-slate-100 group-hover:block"
                  aria-label="Adicionar tarefa"
                >
                  <Plus size={13} />
                </button>
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto">
                {dayTasks.slice(0, 3).map((t) => (
                  <TaskCard key={t.id} task={t} compact onClick={() => onOpenTask(t.id)} />
                ))}
                {dayTasks.length > 3 && (
                  <span className="px-1 text-[11px] text-slate-500">+{dayTasks.length - 3} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
