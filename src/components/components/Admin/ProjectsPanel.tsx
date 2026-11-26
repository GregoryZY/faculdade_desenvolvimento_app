import React, { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar, Badge, Button } from "@/components/ui/primitives";
import { PROJECT_ROLE_LABEL, Project, ProjectRole, User } from "@/types";
import { roleIn, canManageMembers } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { FolderKanban, LogOut, Plus, Trash2, UserPlus, Users } from "lucide-react";

const PROJECT_COLORS = ["#0F5B52", "#B87A1F", "#9E3220", "#3B6EA5", "#7A4E9E", "#2F7D4F", "#454842"];
const ROLE_BADGE: Record<ProjectRole, string> = {
  LEADER: "bg-pine-50 text-pine-600",
  CO_LEADER: "bg-amber-100 text-amber-600",
  MEMBER: "bg-slate-100 text-slate-700",
};
type AssignableRole = Exclude<ProjectRole, "LEADER">;

const inputCls = "w-full rounded-card border border-slate-300 px-3 py-2 text-sm outline-none focus:border-pine-500";

type Msg = { ok: boolean; text: string } | null;

export default function ProjectsPanel() {
  const meId = useAppStore((s) => s.currentUserId);
  const projects = useAppStore((s) => s.projects);
  const memberships = useAppStore((s) => s.memberships);
  const users = useAppStore((s) => s.users);
  const tasks = useAppStore((s) => s.tasks);
  const createProject = useAppStore((s) => s.createProject);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const addMember = useAppStore((s) => s.addMember);
  const setMemberRole = useAppStore((s) => s.setMemberRole);
  const removeMember = useAppStore((s) => s.removeMember);
  const leaveProject = useAppStore((s) => s.leaveProject);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [projMsg, setProjMsg] = useState<Msg>(null);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<AssignableRole>("MEMBER");
  const [memberMsg, setMemberMsg] = useState<Msg>(null);

  const mine = useMemo(
    () =>
      projects
        .map((p) => ({ project: p, role: roleIn(memberships, p.id, meId) }))
        .filter((x): x is { project: Project; role: ProjectRole } => x.role !== null),
    [projects, memberships, meId]
  );

  const selected = mine.find((x) => x.project.id === selectedId) ?? mine[0] ?? null;
  const isLeader = selected ? canManageMembers(selected.role) : false;

  const members = useMemo(() => {
    if (!selected) return [];
    const order: Record<ProjectRole, number> = { LEADER: 0, CO_LEADER: 1, MEMBER: 2 };
    return memberships
      .filter((m) => m.projectId === selected.project.id)
      .map((m) => ({ user: users.find((u) => u.id === m.userId), role: m.role }))
      .filter((x): x is { user: User; role: ProjectRole } => !!x.user)
      .sort((a, b) => order[a.role] - order[b.role] || a.user.name.localeCompare(b.user.name));
  }, [selected, memberships, users]);

  function submitProject(e: React.FormEvent) {
    e.preventDefault();
    const r = createProject(name, color);
    if (r.ok) {
      setProjMsg({ ok: true, text: `Projeto "${name.trim()}" criado. Você é o líder.` });
      setName("");
      if (r.id) setSelectedId(r.id);
    } else {
      setProjMsg({ ok: false, text: r.error });
    }
  }

  function submitMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const r = addMember(selected.project.id, email, newRole);
    if (r.ok) {
      setMemberMsg({ ok: true, text: "Membro adicionado." });
      setEmail("");
    } else {
      setMemberMsg({ ok: false, text: r.error });
    }
  }

  function handleRemove(userId: string, userName: string) {
    if (!selected) return;
    const count = tasks.filter((t) => t.projectId === selected.project.id && t.assigneeIds.includes(userId)).length;
    const msg =
      `Remover ${userName} do projeto "${selected.project.name}"?\n\n` +
      `• Ela(e) deixa de ser responsável por ${count} tarefa(s) (as tarefas continuam existindo).\n` +
      `• As tarefas que ela(e) criou passam para o líder.`;
    if (!window.confirm(msg)) return;
    const r = removeMember(selected.project.id, userId);
    setMemberMsg(r.ok ? { ok: true, text: `${userName} foi removido(a).` } : { ok: false, text: r.error });
  }

  function handleDelete() {
    if (!selected) return;
    const count = tasks.filter((t) => t.projectId === selected.project.id).length;
    const msg =
      `Excluir o projeto "${selected.project.name}"?\n\n` +
      `As ${count} tarefa(s) do projeto, com checklists e comentários, serão excluídas para todos os membros. ` +
      `Esta ação não pode ser desfeita.`;
    if (!window.confirm(msg)) return;
    const r = deleteProject(selected.project.id);
    setProjMsg(r.ok ? { ok: true, text: "Projeto excluído." } : { ok: false, text: r.error });
  }

  function handleLeave() {
    if (!selected) return;
    if (!window.confirm(`Sair do projeto "${selected.project.name}"? Você deixa de ser responsável pelas tarefas dele.`)) return;
    const r = leaveProject(selected.project.id);
    setProjMsg(r.ok ? { ok: true, text: "Você saiu do projeto." } : { ok: false, text: r.error });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      {/* ----------------------- MEUS PROJETOS ----------------------- */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <FolderKanban size={18} className="text-pine-500" /> Meus projetos ({mine.length})
        </h2>

        <form onSubmit={submitProject} className="space-y-3 rounded-panel border border-slate-100 bg-white p-4 shadow-card">
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <Plus size={15} /> Novo projeto
          </p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do projeto" className={inputCls} />
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Cor ${c}`}
                aria-pressed={color === c}
                className={cn(
                  "h-8 w-8 rounded-full ring-offset-2 transition",
                  color === c ? "ring-2 ring-ink" : "hover:ring-2 hover:ring-slate-300"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          {projMsg && <p className={cn("text-sm", projMsg.ok ? "text-pine-600" : "text-clay-600")}>{projMsg.text}</p>}
          <Button type="submit" disabled={!name.trim()}>
            <Plus size={15} /> Criar projeto
          </Button>
          <p className="text-xs text-slate-500">Quem cria o projeto passa a ser o líder dele.</p>
        </form>

        <ul className="space-y-2">
          {mine.map(({ project: p, role }) => {
            const active = selected?.project.id === p.id;
            const count = tasks.filter((t) => t.projectId === p.id).length;
            return (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-panel border bg-white p-3 text-left shadow-card transition-colors",
                    active ? "border-pine-500" : "border-slate-100 hover:bg-slate-50"
                  )}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-slate-500">{count} tarefa(s)</p>
                  </div>
                  <Badge className={ROLE_BADGE[role]}>{PROJECT_ROLE_LABEL[role]}</Badge>
                </button>
              </li>
            );
          })}
          {mine.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">Crie seu primeiro projeto acima.</p>
          )}
        </ul>
      </section>

      {/* ----------------------- DETALHE / MEMBROS ----------------------- */}
      {selected && (
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold text-ink">
              <Users size={18} className="shrink-0 text-pine-500" />
              <span className="truncate">Membros de {selected.project.name}</span>
            </h2>
            <Badge className={ROLE_BADGE[selected.role]}>Você: {PROJECT_ROLE_LABEL[selected.role]}</Badge>
          </div>

          <div className="rounded-panel border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            <p>
              <strong className="text-ink">Líder</strong> — criou o projeto; gerencia membros, papéis e todas as tarefas.
            </p>
            <p>
              <strong className="text-ink">Co-líder</strong> — escolhido pelo líder; cria, delega e gerencia tarefas de
              todos, mas não gerencia membros.
            </p>
            <p>
              <strong className="text-ink">Colaborador</strong> — executa as tarefas atribuídas a ele e cria tarefas só
              para si; não cria nem gerencia tarefas dos outros.
            </p>
          </div>

          {isLeader && (
            <form onSubmit={submitMember} className="space-y-3 rounded-panel border border-slate-100 bg-white p-4 shadow-card">
              <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <UserPlus size={15} /> Adicionar membro
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail da conta da pessoa"
                  className={inputCls}
                />
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as AssignableRole)} className={inputCls}>
                  <option value="MEMBER">Colaborador</option>
                  <option value="CO_LEADER">Co-líder</option>
                </select>
              </div>
              {memberMsg && <p className={cn("text-sm", memberMsg.ok ? "text-pine-600" : "text-clay-600")}>{memberMsg.text}</p>}
              <Button type="submit" disabled={!email.trim()}>
                <UserPlus size={15} /> Adicionar
              </Button>
              <p className="text-xs text-slate-500">A pessoa precisa ter criado uma conta antes.</p>
            </form>
          )}

          <ul className="space-y-2">
            {members.map(({ user: u, role }) => {
              const isMe = u.id === meId;
              const editable = isLeader && role !== "LEADER";
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-panel border border-slate-100 bg-white p-3 shadow-card">
                  <Avatar user={u} size="md" />
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-semibold text-ink">
                      {u.name} {isMe && <span className="font-normal text-slate-500">(você)</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">{u.email}</p>
                  </div>
                  {editable ? (
                    <select
                      value={role}
                      onChange={(e) => {
                        const r = setMemberRole(selected.project.id, u.id, e.target.value as AssignableRole);
                        setMemberMsg(r.ok ? null : { ok: false, text: r.error });
                      }}
                      className="rounded-card border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-pine-500"
                      aria-label={`Papel de ${u.name}`}
                    >
                      <option value="MEMBER">Colaborador</option>
                      <option value="CO_LEADER">Co-líder</option>
                    </select>
                  ) : (
                    <Badge className={ROLE_BADGE[role]}>{PROJECT_ROLE_LABEL[role]}</Badge>
                  )}
                  {editable && (
                    <button
                      onClick={() => handleRemove(u.id, u.name)}
                      className="rounded-card p-2 text-slate-400 hover:bg-clay-100 hover:text-clay-600"
                      aria-label={`Remover ${u.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-slate-100 pt-4">
            {isLeader ? (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-card border border-clay-500/40 px-3 py-2 text-sm font-medium text-clay-600 hover:bg-clay-100"
              >
                <Trash2 size={15} /> Excluir projeto
              </button>
            ) : (
              <button
                onClick={handleLeave}
                className="flex items-center gap-1.5 rounded-card border border-slate-300 px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100"
              >
                <LogOut size={15} /> Sair do projeto
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
