import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ProgressBar } from "@/components/ui/primitives";
import { roleIn, canChangeStatus } from "@/lib/permissions";
import { Plus, X } from "lucide-react";

export default function SubtaskList({ taskId }: { taskId: string }) {
  const subtasks = useAppStore((s) => s.subtasksForTask(taskId));
  const toggle = useAppStore((s) => s.toggleSubtask);
  const remove = useAppStore((s) => s.removeSubtask);
  const add = useAppStore((s) => s.addSubtask);
  const progress = useAppStore((s) => s.taskProgress(taskId));
  const [draft, setDraft] = useState("");

  // Quem pode mexer no checklist: líder, co-líder e o colaborador dono/responsável pela tarefa.
  const canAct = useAppStore((s) => {
    const t = s.tasks.find((x) => x.id === taskId);
    if (!t) return false;
    return canChangeStatus(roleIn(s.memberships, t.projectId, s.currentUserId), t, s.currentUserId);
  });

  function submit() {
    if (!draft.trim()) return;
    add(taskId, draft.trim());
    setDraft("");
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          {subtasks.filter((s) => s.done).length} de {subtasks.length} concluídos
        </span>
        <span className="text-xs font-semibold text-pine-600">{progress}%</span>
      </div>
      <ProgressBar value={progress} />

      <ul className="space-y-1.5 pt-1">
        {subtasks.map((st) => (
          <li key={st.id} className="group flex items-center gap-2">
            <input
              type="checkbox"
              checked={st.done}
              disabled={!canAct}
              onChange={() => toggle(st.id)}
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-pine-500 focus:ring-pine-500"
            />
            <span className={st.done ? "flex-1 text-sm text-slate-400 line-through" : "flex-1 text-sm text-ink"}>
              {st.title}
            </span>
            {canAct && (
            <button
              onClick={() => remove(st.id)}
              className="touch-visible p-1 text-slate-400 opacity-100 hover:text-clay-500 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
              aria-label="Remover item"
            >
              <X size={14} />
            </button>
            )}
          </li>
        ))}
      </ul>

      {!canAct && (
        <p className="text-xs text-slate-400">Apenas os responsáveis, o líder e os co-líderes alteram o checklist.</p>
      )}

      {canAct && (
      <div className="flex items-center gap-2 pt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Adicionar item…"
          className="flex-1 rounded-card border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-pine-500"
        />
        <button
          onClick={submit}
          className="rounded-card border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"
          aria-label="Adicionar subtarefa"
        >
          <Plus size={14} />
        </button>
      </div>
      )}
    </div>
  );
}
