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
import { toDateKey, cn, PRIORITY_DOT } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Props {
  refDate: Date;
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onQuickAdd: (dateKey: string) => void;
  onSelectDay: (day: Date) => void; // seleciona o dia (usado pela lista do celular e pelo botão "Nova tarefa")
}

export default function MonthView({ refDate, tasks, onOpenTask, onQuickAdd, onSelectDay }: Props) {
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

  const selectedKey = toDateKey(refDate);
  const selectedTasks = (tasksByDay.get(selectedKey) ?? [])
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="flex flex-col gap-3 sm:h-full">
      <div className="flex flex-col overflow-hidden rounded-panel border border-slate-100 bg-white sm:min-h-0 sm:flex-1">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
          {weekDayLabels.map((d) => (
            <div
              key={d}
              className="px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-3 sm:text-xs"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 sm:flex-1 sm:grid-rows-6 sm:overflow-y-auto">
          {days.map((day) => {
            const key = toDateKey(day);
            const dayTasks = (tasksByDay.get(key) ?? []).slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
            const inMonth = isSameMonth(day, refDate);
            const selected = key === selectedKey;
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
                  "group flex min-h-[56px] flex-col gap-1 border-b border-r border-slate-100 p-0.5 sm:min-h-[110px] sm:p-1.5",
                  !inMonth && "bg-slate-50/50",
                  dragOverKey === key && "drop-target-active"
                )}
              >
                {/* Celular: só o número do dia + bolinhas de prioridade; toque seleciona o dia */}
                <button
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-card py-1 sm:hidden",
                    selected && "bg-pine-50 ring-1 ring-pine-300"
                  )}
                  aria-label={`Selecionar dia ${format(day, "d 'de' MMMM", { locale: ptBR })}`}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isToday(day) ? "bg-pine-500 font-semibold text-white" : inMonth ? "text-ink-soft" : "text-slate-400"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <span className="flex flex-wrap justify-center gap-0.5">
                    {dayTasks.slice(0, 4).map((t) => (
                      <span key={t.id} className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[t.priority])} />
                    ))}
                  </span>
                </button>

                {/* Tablet/desktop: cartões completos */}
                <div className="hidden items-center justify-between px-0.5 sm:flex">
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      isToday(day) ? "bg-pine-500 font-semibold text-white" : inMonth ? "text-ink-soft" : "text-slate-400"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                  <button
                    onClick={() => onQuickAdd(key)}
                    className="touch-visible rounded p-0.5 text-slate-400 opacity-0 hover:bg-slate-100 focus:opacity-100 group-hover:opacity-100"
                    aria-label="Adicionar tarefa"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <div className="hidden flex-col gap-1 overflow-y-auto sm:flex">
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

      {/* Celular: lista do dia selecionado */}
      <section className="space-y-2 sm:hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink first-letter:uppercase">
            {format(refDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          <button
            onClick={() => onQuickAdd(selectedKey)}
            className="flex items-center gap-1 rounded-card border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-slate-100"
          >
            <Plus size={13} /> Adicionar
          </button>
        </div>
        {selectedTasks.map((t) => (
          <TaskCard key={t.id} task={t} onClick={() => onOpenTask(t.id)} draggable={false} />
        ))}
        {selectedTasks.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">Nenhuma tarefa neste dia.</p>
        )}
      </section>
    </div>
  );
}
