import React, { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { PROJECT_ROLE_LABEL } from "@/types";
import { roleIn, isManager } from "@/lib/permissions";
import { CalendarDays, FolderKanban, Kanban, LayoutDashboard, ListFilter, X } from "lucide-react";

export type ViewKey = "calendar" | "kanban" | "dashboard" | "projects";

interface Props {
  view: ViewKey;
  onViewChange: (v: ViewKey) => void;
  filterAssignee: string | null;
  onFilterAssignee: (id: string | null) => void;
  filterProject: string | null;
  onFilterProject: (id: string | null) => void;
  open: boolean; // menu lateral aberto (só afeta telas < lg)
  onClose: () => void;
}

export default function Sidebar({
  view,
  onViewChange,
  filterAssignee,
  onFilterAssignee,
  filterProject,
  onFilterProject,
  open,
  onClose,
}: Props) {
  const meId = useAppStore((s) => s.currentUserId);
  const users = useAppStore((s) => s.users);
  const allProjects = useAppStore((s) => s.projects);
  const memberships = useAppStore((s) => s.memberships);

  // Só os projetos de que participo, com o meu papel em cada um.
  const myProjects = useMemo(
    () =>
      allProjects
        .map((p) => ({ project: p, role: roleIn(memberships, p.id, meId) }))
        .filter((x) => x.role !== null),
    [allProjects, memberships, meId]
  );
  const managedIds = useMemo(
    () => myProjects.filter((x) => isManager(x.role)).map((x) => x.project.id),
    [myProjects]
  );
  const managesAny = managedIds.length > 0;

  // Filtro por responsável: pessoas dos projetos que eu gerencio (ou só do projeto selecionado).
  const people = useMemo(() => {
    const scope = filterProject && managedIds.includes(filterProject) ? [filterProject] : managedIds;
    const ids = new Set(memberships.filter((m) => scope.includes(m.projectId)).map((m) => m.userId));
    return users.filter((u) => ids.has(u.id));
  }, [memberships, users, managedIds, filterProject]);

  const nav: { key: ViewKey; label: string; icon: React.ReactNode; managerOnly?: boolean }[] = [
    { key: "calendar", label: "Planner", icon: <CalendarDays size={16} /> },
    { key: "kanban", label: "Kanban", icon: <Kanban size={16} /> },
    { key: "dashboard", label: "Painel da equipe", icon: <LayoutDashboard size={16} />, managerOnly: true },
    { key: "projects", label: "Projetos e membros", icon: <FolderKanban size={16} /> },
  ];

  return (
    <>
      {/* fundo escurecido atrás do menu no celular */}
      {open && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-slate-100 bg-white p-4 transition-transform duration-200",
          "lg:static lg:z-auto lg:w-60 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-card bg-pine-500 font-display text-base font-semibold text-white">
              J
            </div>
            <span className="font-display text-lg font-semibold text-ink">Junto</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-card p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1">
          {nav
            .filter((n) => !n.managerOnly || managesAny)
            .map((n) => (
              <button
                key={n.key}
                onClick={() => {
                  onViewChange(n.key);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-card px-3 py-2 text-sm font-medium transition-colors",
                  view === n.key ? "bg-pine-50 text-pine-600" : "text-ink-soft hover:bg-slate-100"
                )}
              >
                {n.icon}
                {n.label}
              </button>
            ))}
        </nav>

        <div>
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Meus projetos</div>
          <div className="space-y-0.5">
            <button
              onClick={() => onFilterProject(null)}
              className={cn(
                "flex w-full items-center gap-2 rounded-card px-2 py-1.5 text-sm",
                !filterProject ? "bg-slate-100 font-medium text-ink" : "text-ink-soft hover:bg-slate-50"
              )}
            >
              Todos
            </button>
            {myProjects.map(({ project: p, role }) => (
              <button
                key={p.id}
                onClick={() => onFilterProject(filterProject === p.id ? null : p.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-card px-2 py-1.5 text-sm",
                  filterProject === p.id ? "bg-slate-100 font-medium text-ink" : "text-ink-soft hover:bg-slate-50"
                )}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="min-w-0 flex-1 truncate text-left">{p.name}</span>
                <span className="shrink-0 text-[10px] font-normal text-slate-400">
                  {role ? PROJECT_ROLE_LABEL[role] : ""}
                </span>
              </button>
            ))}
            {myProjects.length === 0 && (
              <p className="px-2 py-1 text-xs text-slate-400">Você ainda não participa de nenhum projeto.</p>
            )}
          </div>
        </div>

        {managesAny && people.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <ListFilter size={12} /> Filtrar por responsável
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => onFilterAssignee(null)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-card px-2 py-1.5 text-sm",
                  !filterAssignee ? "bg-slate-100 font-medium text-ink" : "text-ink-soft hover:bg-slate-50"
                )}
              >
                Todos
              </button>
              {people.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onFilterAssignee(filterAssignee === u.id ? null : u.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-card px-2 py-1.5 text-sm",
                    filterAssignee === u.id ? "bg-slate-100 font-medium text-ink" : "text-ink-soft hover:bg-slate-50"
                  )}
                >
                  <Avatar user={u} size="xs" />
                  <span className="truncate">{u.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(filterAssignee || filterProject) && (
          <button
            onClick={() => {
              onFilterAssignee(null);
              onFilterProject(null);
            }}
            className="mt-auto flex items-center gap-1 self-start text-xs font-medium text-clay-600 hover:underline"
          >
            <X size={12} /> Limpar filtros
          </button>
        )}
      </aside>
    </>
  );
}
