import React from "react";
import { Task } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { AvatarStack } from "@/components/ui/primitives";
import { PRIORITY_DOT, isOverdue, userById, cn } from "@/lib/utils";
import { Lock, CheckCircle2 } from "lucide-react";

interface Props {
  task: Task;
  onClick: () => void;
  compact?: boolean;
  draggable?: boolean;
}

export default function TaskCard({ task, onClick, compact, draggable = true }: Props) {
  const users = useAppStore((s) => s.users);
  const progress = useAppStore((s) => s.taskProgress(task.id));
  const assignees = task.assigneeIds.map((id) => userById(users, id)).filter(Boolean) as any[];
  const overdue = isOverdue(task.dueDate, task.status);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/task-id", task.id);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <button
      draggable={draggable}
      onDragStart={handleDragStart}
      onClick={onClick}
      className={cn(
        "group w-full rounded-card border border-slate-100 bg-white p-2 text-left shadow-card transition-shadow hover:shadow-pop",
        overdue && "border-clay-500/40",
        compact ? "space-y-1" : "space-y-1.5"
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[task.priority])} />
          <span className={cn("truncate font-medium text-ink", compact ? "text-xs" : "text-sm")}>
            {task.title}
          </span>
        </div>
        {task.isPrivate && <Lock size={12} className="shrink-0 text-slate-500" />}
      </div>

      {!compact && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-xs bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-0.5">
        <span className={cn("text-[11px]", overdue ? "font-semibold text-clay-600" : "text-slate-500")}>
          {overdue ? "Atrasada" : new Date(task.dueDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
        {task.status === "DONE" ? (
          <CheckCircle2 size={14} className="text-pine-500" />
        ) : (
          assignees.length > 0 && <AvatarStack users={assignees} max={3} />
        )}
      </div>
      {!compact && progress > 0 && task.status !== "DONE" && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-pine-300" style={{ width: `${progress}%` }} />
        </div>
      )}
    </button>
  );
}
