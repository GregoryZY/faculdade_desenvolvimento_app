import React, { useState } from "react";
import { Modal, Button, Avatar } from "@/components/ui/primitives";
import { useAppStore } from "@/store/useAppStore";
import { PRIORITY_LABEL, TaskPriority } from "@/types";
import { cn, toDateKey } from "@/lib/utils";
import { X } from "lucide-react";

export default function NewTaskModal({
  open,
  onClose,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}) {
  const isLeader = useAppStore((s) => s.isLeader());
  const users = useAppStore((s) => s.users);
  const me = useAppStore((s) => s.currentUser());
  const projects = useAppStore((s) => s.projects);
  const createTask = useAppStore((s) => s.createTask);

  const initialDate = defaultDate ?? toDateKey(new Date());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [tags, setTags] = useState("");
  const [projectId, setProjectId] = useState<string | null>(projects[0]?.id ?? null);
  const [dueTime, setDueTime] = useState("18:00");
  const [assignees, setAssignees] = useState<string[]>([me.id]);
  const [isPrivate, setIsPrivate] = useState(!isLeader ? false : false);

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setTags("");
    setDueTime("18:00");
    setAssignees([me.id]);
    setIsPrivate(false);
  }

  function submit() {
    if (!title.trim()) return;
    createTask({
      title: title.trim(),
      description: description.trim(),
      projectId: isPrivate ? null : projectId,
      priority,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      startDate: initialDate,
      dueDate: new Date(`${initialDate}T${dueTime}:00`).toISOString(),
      assigneeIds: isPrivate ? [me.id] : assignees,
      isPrivate,
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} widthClass="max-w-lg">
      <div className="flex items-center justify-between border-b border-slate-100 p-5 pb-4">
        <h2 className="font-display text-lg font-semibold">Nova tarefa</h2>
        <button onClick={onClose} className="rounded-card p-1.5 text-slate-400 hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da tarefa"
          className="w-full rounded-card border border-slate-300 px-3 py-2 text-sm font-medium outline-none focus:border-pine-500"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          rows={3}
          className="w-full resize-none rounded-card border border-slate-300 px-3 py-2 text-sm outline-none focus:border-pine-500"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Data ({initialDate})</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full rounded-card border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-pine-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Prioridade</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-card border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-pine-500"
            >
              {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Etiquetas separadas por vírgula (ex: design, urgente)"
          className="w-full rounded-card border border-slate-300 px-3 py-2 text-sm outline-none focus:border-pine-500"
        />

        {isLeader && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            Tarefa pessoal (não atribuível ao time)
          </label>
        )}
        {!isLeader && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            Tarefa pessoal (privada, aparece só para mim)
          </label>
        )}

        {!isPrivate && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Projeto</label>
            <select
              value={projectId ?? ""}
              onChange={(e) => setProjectId(e.target.value || null)}
              className="mb-3 w-full rounded-card border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-pine-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-xs font-medium text-slate-500">
              Responsáveis {!isLeader && "— apenas você (colaboradores atribuem a si mesmos)"}
            </label>
            <div className="flex flex-wrap gap-2">
              {(isLeader ? users : users.filter((u) => u.id === me.id)).map((u) => {
                const active = assignees.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() =>
                      setAssignees((prev) => (prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]))
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors",
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
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 p-5 pt-4">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={submit} disabled={!title.trim()}>
          Criar tarefa
        </Button>
      </div>
    </Modal>
  );
}
