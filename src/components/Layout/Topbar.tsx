import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { ChevronDown, ShieldCheck, User as UserIcon } from "lucide-react";

export default function Topbar() {
  const users = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const switchUser = useAppStore((s) => s.switchUser);
  const me = useAppStore((s) => s.currentUser());
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-3">
      <div>
        <p className="font-display text-base font-semibold text-ink">Planner de Equipe</p>
        <p className="text-xs text-slate-500">Organize, atribua e acompanhe entregas em um só lugar</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-card border border-slate-200 px-2.5 py-1.5 hover:bg-slate-50"
        >
          <Avatar user={me} size="sm" />
          <div className="text-left">
            <p className="text-sm font-medium leading-tight text-ink">{me.name}</p>
            <p className="flex items-center gap-1 text-[11px] leading-tight text-slate-500">
              {me.role === "LEADER" ? <ShieldCheck size={11} /> : <UserIcon size={11} />}
              {me.role === "LEADER" ? "Líder / Gestor" : "Colaborador"}
            </p>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {open && (
          <div className="absolute right-0 z-20 mt-1 w-64 rounded-panel border border-slate-100 bg-white p-1.5 shadow-pop">
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Simular sessão como
            </p>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  switchUser(u.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-card px-2.5 py-2 text-left text-sm hover:bg-slate-100",
                  currentUserId === u.id && "bg-pine-50"
                )}
              >
                <Avatar user={u} size="sm" />
                <div>
                  <p className="font-medium text-ink">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.role === "LEADER" ? "Líder / Gestor" : u.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
