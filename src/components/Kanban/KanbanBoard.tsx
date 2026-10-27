import React, { useState } from "react";
import { KANBAN_COLUMNS, STATUS_LABEL, Task, TaskStatus } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import TaskCard from "@/components/Task/TaskCard";
import { cn } from "@/lib/utils";

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  TODO: "border-t-slate-400",
  IN_PROGRESS: "border-t-amber-400",
  REVIEW: "border-t-pine-300",
  DONE: "border-t-pine-500",
};

export default function KanbanBoard({ tasks, onOpenTask }: { tasks: Task[]; onOpenTask: (id: string) => void }) {
  const updateStatus = useAppStore((s) => s.updateTaskStatus);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("text/task-id");
    if (taskId) updateStatus(taskId, status);
  }

  return (
    <div className="grid h-full grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4">
      {KANBAN_COLUMNS.map((status) => {
        const colTasks = tasks.filter((t) => t.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(status);
            }}
            onDragLeave={() => setDragOverCol((c) => (c === status ? null : c))}
            onDrop={(e) => handleDrop(e, status)}
            className={cn(
              "flex min-h-[50vh] flex-col gap-2 rounded-panel border border-t-4 border-slate-100 bg-slate-50/60 p-2.5",
              COLUMN_ACCENT[status],
              dragOverCol === status && "drop-target-active"
            )}
          >
            <div className="flex items-center justify-between px-1 pb-1">
              <h3 className="text-sm font-semibold text-ink">{STATUS_LABEL[status]}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-card">
                {colTasks.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {colTasks.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => onOpenTask(t.id)} />
              ))}
              {colTasks.length === 0 && (
                <p className="pt-6 text-center text-xs text-slate-400">Arraste tarefas para cá</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
