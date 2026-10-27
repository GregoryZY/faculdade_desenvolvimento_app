import React, { useState } from "react";
import { Task, TaskStatus, TaskPriority, PRIORITY_LABEL, STATUS_LABEL, KANBAN_COLUMNS } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { Modal, Button, Avatar, Badge } from "@/components/ui/primitives";
import SubtaskList from "./SubtaskList";
import CommentsThread from "./CommentsThread";
import ActivityLog from "./ActivityLog";
import { PRIORITY_BADGE, userById, cn, isOverdue } from "@/lib/utils";
import { X, Calendar, Trash2, Lock } from "lucide-react";

type Tab = "details" | "checklist" | "comments" | "activity";

export default function TaskModal({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const task = useAppStore((s) => s.tasks.find((t) => t.id === taskId));
  const users = useAppStore((s) => s.users);
  const projects = useAppStore((s) => s.projects);
  const me = useAppStore((s) => s.currentUser());
  const isLeader = useAppStore((s) => s.isLeader());
  const updateStatus = useAppStore((s) => s.updateTaskStatus);
  const updateFields = useAppStore((s) => s.updateTaskFields);
  const reschedule = useAppStore((s) => s.rescheduleTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const [tab, setTab] = useState<Tab>("details");
  const [editingTitle, setEditingTitle] = useState(false);

  if (!task) return null;

  const canManage = isLeader || task.creatorId === me.id;
  const canAssign = isLeader && !task.isPrivate;
  const overdue = isOverdue(task.dueDate, task.status);

  function handleClose() {
    setTab("details");
    onClose();
  }

  function toggleAssignee(userId: string) {
    if (!task) return;
    const set = new Set(task.assigneeIds);
    if (set.has(userId)) set.delete(userId);
    else set.add(userId);
    updateFields(task.id, { assigneeIds: Array.from(set) });
  }

  return (
    <Modal open onClose={handleClose} widthClass="max-w-3xl">
      <div className="flex max-h-[88vh] flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-500">
              {task.isPrivate ? (
                <span className="flex items-center gap-1"><Lock size={12} /> Tarefa pessoal</span>
              ) : (
                <span>{projects.find((p) => p.id === task.projectId)?.name ?? "Sem projeto"}</span>
              )}
              {overdue && <Badge className="bg-clay-100 text-clay-600">Atrasada</Badge>}
            </div>
            {editingTitle ? (
              <input
                autoFocus
                defaultValue={task.title}
                onBlur={(e) => {
                  updateFields(task.id, { title: e.target.value || task.title });
                  setEditingTitle(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="w-full rounded-card border border-pine-500 px-2 py-1 font-display text-xl font-semibold outline-none"
              />
            ) : (
              <h2
                onClick={() => canManage && setEditingTitle(true)}
                className={cn("font-display text-xl font-semibold text-ink", canManage && "cursor-text hover:opacity-80")}
              >
                {task.title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canManage && (
              <button
                onClick={() => {
                  deleteTask(task.id);
                  handleClose();
                }}
                className="rounded-card p-2 text-slate-400 hover:bg-clay-100 hover:text-clay-600"
                aria-label="Excluir tarefa"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={handleClose} className="rounded-card p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-100 px-5">
          {(
            [
              ["details", "Detalhes"],
              ["checklist", "Checklist"],
              ["comments", "Comentários"],
              ["activity", "Histórico"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                tab === key ? "border-pine-500 text-pine-600" : "border-transparent text-slate-500 hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "details" && (
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Descrição</label>
                <textarea
                  defaultValue={task.description}
                  disabled={!canManage}
                  onBlur={(e) => updateFields(task.id, { description: e.target.value })}
                  rows={4}
                  className="w-full resize-none rounded-card border border-slate-300 px-3 py-2 text-sm outline-none focus:border-pine-500 disabled:bg-slate-100"
                  placeholder="Descreva os detalhes da tarefa (suporta markdown simples)…"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)}
                    className="w-full rounded-card border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-pine-500"
                  >
                    {KANBAN_COLUMNS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Prioridade</label>
                  <select
                    value={task.priority}
                    disabled={!canManage}
                    onChange={(e) => updateFields(task.id, { priority: e.target.value as TaskPriority })}
                    className="w-full rounded-card border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-pine-500 disabled:bg-slate-100"
                  >
                    {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Início</label>
                  <div className="flex items-center gap-2 rounded-card border border-slate-300 px-2.5 py-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    <input
                      type="date"
                      defaultValue={task.startDate}
                      disabled={!canManage}
                      onChange={(e) => reschedule(task.id, e.target.value, task.dueDate)}
                      className="w-full text-sm outline-none disabled:bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Prazo de entrega</label>
                  <div className="flex items-center gap-2 rounded-card border border-slate-300 px-2.5 py-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    <input
                      type="datetime-local"
                      defaultValue={task.dueDate.slice(0, 16)}
                      disabled={!canManage}
                      onChange={(e) =>
                        reschedule(task.id, task.startDate, new Date(e.target.value).toISOString())
                      }
                      className="w-full text-sm outline-none disabled:bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Responsáveis {!canAssign && "(somente o líder atribui tarefas de equipe)"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {users.map((u) => {
                    const active = task.assigneeIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        disabled={!canAssign}
                        onClick={() => toggleAssignee(u.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors disabled:opacity-60",
                          active ? "border-pine-500 bg-pine-50 text-pine-600" : "border-slate-300 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        <Avatar user={u} size="xs" />
                        {u.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Etiquetas</label>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((t) => (
                    <Badge key={t} className="bg-slate-100 text-slate-700">
                      #{t}
                    </Badge>
                  ))}
                  {task.tags.length === 0 && <span className="text-sm text-slate-400">Sem etiquetas</span>}
                </div>
              </div>

              <Badge className={PRIORITY_BADGE[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
            </div>
          )}

          {tab === "checklist" && <SubtaskList taskId={task.id} />}
          {tab === "comments" && <CommentsThread taskId={task.id} />}
          {tab === "activity" && <ActivityLog taskId={task.id} />}
        </div>
      </div>
    </Modal>
  );
}
