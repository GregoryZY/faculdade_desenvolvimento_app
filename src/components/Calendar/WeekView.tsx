import React, { useState } from "react";
import { startOfWeek, addDays, isToday, format } from "date-fns";
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

export default function WeekView({ refDate, tasks, onOpenTask, onQuickAdd }: Props) {
  const reschedule = useAppStore((s) => s.rescheduleTask);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const weekStart = startOfWeek(refDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const oldDue = new Date(task.dueDate);
    const [y, m, d] = dateKey.split("-").map(Number);
    const newDue = new Date(y, m - 1, d, oldDue.getHours(), oldDue.getMinutes());
    reschedule(task.id, dateKey, newDue.toISOString());
  }

  return (
    <div className="grid h-full grid-cols-7 gap-2 overflow-y-auto">
      {days.map((day) => {
        const key = toDateKey(day);
        const dayTasks = (tasksByDay.get(key) ?? []).slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
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
              "flex min-h-[60vh] flex-col gap-1.5 rounded-panel border border-slate-100 bg-white p-2.5",
              dragOverKey === key && "drop-target-active"
            )}
          >
            <div className="mb-1 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  {format(day, "EEE", {})}
                </p>
                <p className={cn("text-sm font-semibold", isToday(day) ? "text-pine-600" : "text-ink")}>
                  {format(day, "d MMM")}
                </p>
              </div>
              <button
                onClick={() => onQuickAdd(key)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Adicionar tarefa"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
              {dayTasks.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => onOpenTask(t.id)} />
              ))}
              {dayTasks.length === 0 && (
                <p className="pt-4 text-center text-xs text-slate-400">Sem tarefas</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
