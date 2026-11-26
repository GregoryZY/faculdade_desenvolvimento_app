import React, { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar, ProgressBar, Badge } from "@/components/ui/primitives";
import { isOverdue } from "@/lib/utils";
import { isManager } from "@/lib/permissions";
import { AlertTriangle, CheckCircle2, ListChecks, Users } from "lucide-react";

export default function TeamDashboard({
  onOpenTask,
  projectId,
}: {
  onOpenTask: (id: string) => void;
  projectId: string | null; // projeto selecionado na barra lateral (null = todos que eu gerencio)
}) {
  const meId = useAppStore((s) => s.currentUserId);
  const users = useAppStore((s) => s.users);
  const allTasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const memberships = useAppStore((s) => s.memberships);

  // Escopo: só projetos onde sou líder ou co-líder (colaborador não vê o painel da equipe).
  const managedIds = useMemo(
    () => memberships.filter((m) => m.userId === meId && isManager(m.role)).map((m) => m.projectId),
    [memberships, meId]
  );
  const scopeIds = useMemo(
    () => (projectId && managedIds.includes(projectId) ? [projectId] : managedIds),
    [projectId, managedIds]
  );
  const scopeNames = projects.filter((p) => scopeIds.includes(p.id)).map((p) => p.name);

  const tasks = useMemo(() => allTasks.filter((t) => scopeIds.includes(t.projectId)), [allTasks, scopeIds]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    return { total, done, overdue, inProgress };
  }, [tasks]);

  const workload = useMemo(() => {
    const memberIds = new Set(memberships.filter((m) => scopeIds.includes(m.projectId)).map((m) => m.userId));
    return users
      .filter((u) => memberIds.has(u.id))
      .map((u) => {
        const assigned = tasks.filter((t) => t.assigneeIds.includes(u.id));
        const active = assigned.filter((t) => t.status !== "DONE");
        const overdue = assigned.filter((t) => isOverdue(t.dueDate, t.status));
        const done = assigned.filter((t) => t.status === "DONE");
        return { user: u, assigned, active, overdue, done };
      })
      .sort((a, b) => b.active.length - a.active.length);
  }, [users, tasks, memberships, scopeIds]);

  const maxLoad = Math.max(1, ...workload.map((w) => w.active.length));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<ListChecks size={16} />} label="Tarefas" value={stats.total} accent="text-pine-600 bg-pine-50" />
        <StatCard icon={<Users size={16} />} label="Em andamento" value={stats.inProgress} accent="text-amber-600 bg-amber-100" />
        <StatCard icon={<AlertTriangle size={16} />} label="Atrasadas" value={stats.overdue} accent="text-clay-600 bg-clay-100" />
        <StatCard icon={<CheckCircle2 size={16} />} label="Concluídas" value={stats.done} accent="text-pine-600 bg-pine-50" />
      </div>

      <div>
        <h3 className="mb-3 font-display text-base font-semibold text-ink">Carga de trabalho por pessoa</h3>
        <p className="mb-3 -mt-2 text-xs text-slate-500">Projetos: {scopeNames.join(", ") || "—"}</p>
        <div className="space-y-3">
          {workload.map(({ user, active, overdue, done, assigned }) => (
            <div key={user.id} className="rounded-panel border border-slate-100 bg-white p-4 shadow-card">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar user={user} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-slate-500">{active.length} ativas</span>
                  {overdue.length > 0 && (
                    <Badge className="bg-clay-100 text-clay-600">{overdue.length} atrasada(s)</Badge>
                  )}
                  <span className="text-pine-600">{done.length} concluídas</span>
                </div>
              </div>
              <ProgressBar value={(active.length / maxLoad) * 100} />

              {assigned.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {assigned.slice(0, 6).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onOpenTask(t.id)}
                      className="rounded-xs border border-slate-200 px-2 py-1 text-[11px] text-ink-soft hover:bg-slate-50"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="rounded-panel border border-slate-100 bg-white p-4 shadow-card">
      <div className={`mb-2 inline-flex items-center justify-center rounded-card p-1.5 ${accent}`}>{icon}</div>
      <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
