import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Avatar } from "@/components/ui/primitives";
import { useAppStore } from "@/store/useAppStore";
import { PRIORITY_LABEL, PROJECT_ROLE_LABEL, TaskPriority, ProjectRole, User } from "@/types";
import { roleIn, isManager } from "@/lib/permissions";
import { cn, toDateKey } from "@/lib/utils";
import { X } from "lucide-react";

export default function NewTaskModal({
  open,
  onClose,
  defaultDate,
  defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultProjectId?: string | null;
}) {
  const meId = useAppStore((s) => s.currentUserId);
  const users = useAppStore((s) => s.users);
  const allProjects = useAppStore((s) => s.projects);
  const memberships = useAppStore((s) => s.memberships);
  const createTask = useAppStore((s) => s.createTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [tags, setTags] = useState("");
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(toDateKey(new Date()));
  const [dueTime, setDueTime] = useState("18:00");
  const [assignees, setAssignees] = useState<string[]>([]);

  // Projetos de que participo (qualquer papel pode criar tarefas; o que muda é "para quem").
  const myProjects = useMemo(
    () => allProjects.filter((p) => roleIn(memberships, p.id, meId) !== null),
    [allProjects, memberships, meId]
  );
  const role = projectId ? roleIn(memberships, projectId, meId) : null;
  const manager = isManager(role);
  const projectMembers = useMemo(
    () =>
      memberships
        .filter((m) => m.projectId === projectId)
        .map((m) => ({ user: users.find((u) => u.id === m.userId), role: m.role }))
        .filter((x): x is { user: User; role: ProjectRole } => !!x.user),
    [memberships, users, projectId]
  );

  // Sempre que o modal abre, o formulário volta limpo, com a data clicada e o projeto filtrado.
  // (Dependências propositalmente sem a lista de projetos, para não apagar o que a pessoa digita.)
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setTags("");
    const preferred =
      defaultProjectId && myProjects.some((p) => p.id === defaultProjectId) ? defaultProjectId : myProjects[0]?.id ?? "";
    setProjectId(preferred);
    setDate(defaultDate ?? toDateKey(new Date()));
    setDueTime("18:00");
    setAssignees([meId]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate, defaultProjectId, meId]);

  const canSubmit = !!title.trim() && !!date && !!projectId && (!manager || assignees.length > 0);

  function submit() {
    if (!canSubmit) return;
    const t = createTask({
      title: title.trim(),
      description: description.trim(),
      projectId,
      priority,
      tags: tags
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      startDate: date,
      dueDate: new Date(`${date}T${dueTime || "18:00"}:00`).toISOString(),
      assigneeIds: manager ? assignees : [meId],
    });
    if (t) onClose();
  }

  return (
    <Modal open={open} onClose={onClose} widthClass="max-w-lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4 pb-3 sm:p-5 sm:pb-4">
          <h2 className="font-display text-lg font-semibold">Nova tarefa</h2>
          <button type="button" onClick={onClose} className="rounded-card p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {myProjects.length === 0 ? (
          <div className="p-5 text-sm text-slate-600">
            Você ainda não participa de nenhum projeto. Crie um em <strong>Projetos e membros</strong> para começar a
            adicionar tarefas.
          </div>
        ) : (
          <>
            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Projeto</label>
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setAssignees([meId]); // responsáveis são sempre do projeto escolhido
                  }}
                  className="w-full rounded-card border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-pine-500"
                >
                  {myProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {PROJECT_ROLE_LABEL[roleIn(memberships, p.id, meId)!]}
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-card border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-pine-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Hora</label>
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

              {manager ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Delegar para (escolha ao menos um)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {projectMembers.map(({ user: u }) => {
                      const active = assignees.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() =>
                            setAssignees((prev) => (prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]))
                          }
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2 py-1.5 text-xs transition-colors",
                            active ? "border-pine-500 bg-pine-50 text-pine-600" : "border-slate-300 text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          <Avatar user={u} size="xs" />
                          {u.id === meId ? "Eu" : u.name.split(" ")[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="rounded-card bg-slate-100 px-3 py-2 text-xs text-slate-700">
                  Neste projeto você é colaborador: a tarefa será atribuída a você. Para delegar a outras pessoas, peça ao
                  líder ou a um co-líder.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 p-4 pt-3 sm:p-5 sm:pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={!canSubmit}>
                Criar tarefa
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
