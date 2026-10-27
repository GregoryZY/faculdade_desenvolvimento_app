import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { CalendarDays, Kanban, LayoutDashboard, ListFilter, X } from "lucide-react";

export type ViewKey = "calendar" | "kanban" | "dashboard";

interface Props {
  view: ViewKey;
  onViewChange: (v: ViewKey) => void;
  filterAssignee: string | null;
  onFilterAssignee: (id: string | null) => void;
  filterProject: string | null;
  onFilterProject: (id: string | null) => void;
}

export default function Sidebar({
  view,
  onViewChange,
  filterAssignee,
  onFilterAssignee,
  filterProject,
  onFilterProject,
}: Props) {
  const isLeader = useAppStore((s) => s.isLeader());
  const users = useAppStore((s) => s.users);
  const projects = useAppStore((s) => s.projects);

  const nav: { key: ViewKey; label: string; icon: React.ReactNode; leaderOnly?: boolean }[] = [
    { key: "calendar", label: "Planner", icon: <CalendarDays size={16} /> },
    { key: "kanban", label: "Kanban", icon: <Kanban size={16} /> },
    { key: "dashboard", label: "Painel da equipe", icon: <LayoutDashboard size={16} />, leaderOnly: true },
  ];

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-slate-100 bg-white p-4">
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-card bg-pine-500 font-display text-base font-semibold text-white">
          J
        </div>
        <span className="font-display text-lg font-semibold text-ink">Junto</span>
      </div>

      <nav className="space-y-1">
        {nav
          .filter((n) => !n.leaderOnly || isLeader)
          .map((n) => (
            <button
              key={n.key}
              onClick={() => onViewChange(n.key)}
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
        <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <ListFilter size={12} /> Filtrar por colaborador
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
          {users.map((u) => (
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

      <div>
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Projetos</div>
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
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onFilterProject(filterProject === p.id ? null : p.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-card px-2 py-1.5 text-sm",
                filterProject === p.id ? "bg-slate-100 font-medium text-ink" : "text-ink-soft hover:bg-slate-50"
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

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
  );
}
