import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar } from "@/components/ui/primitives";
import { ChevronDown, LogOut, Menu } from "lucide-react";

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const me = useAppStore((s) => s.currentUser());
  const logout = useAppStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 py-2.5 sm:px-6 sm:py-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          onClick={onMenu}
          className="rounded-card p-2 text-ink-soft hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-ink">Planner de Equipe</p>
          <p className="hidden text-xs text-slate-500 sm:block">
            Organize, atribua e acompanhe entregas em um só lugar
          </p>
        </div>
      </div>

      <div className="relative shrink-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-card border border-slate-200 px-2 py-1.5 hover:bg-slate-50 sm:px-2.5"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Avatar user={me} size="sm" />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight text-ink">{me.name}</p>
            <p className="text-[11px] leading-tight text-slate-500">{me.email}</p>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 z-20 mt-1 w-64 max-w-[calc(100vw-1.5rem)] rounded-panel border border-slate-100 bg-white p-1.5 shadow-pop">
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-semibold text-ink">{me.name}</p>
                <p className="truncate text-xs text-slate-500">{me.email}</p>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-card px-2.5 py-2 text-left text-sm text-clay-600 hover:bg-clay-100"
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
