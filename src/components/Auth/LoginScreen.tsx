import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar, Button } from "@/components/ui/primitives";
import { DEMO_PASSWORD, demoAccounts } from "@/mock/mockData";
import { cn } from "@/lib/utils";

const inputCls = "w-full rounded-card border border-slate-300 px-3 py-2 text-sm outline-none focus:border-pine-500";

export default function LoginScreen() {
  const users = useAppStore((s) => s.users);
  const login = useAppStore((s) => s.login);
  const loginAs = useAppStore((s) => s.loginAs);
  const register = useAppStore((s) => s.register);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  function switchMode(m: "login" | "register") {
    setMode(m);
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "login") {
      if (!login(email, password)) setError("E-mail ou senha incorretos.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    const r = register({ name, email, password });
    if (!r.ok) setError(r.error);
  }

  const demo = demoAccounts
    .map((d) => ({ ...d, user: users.find((u) => u.id === d.userId) }))
    .filter((d) => !!d.user);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md space-y-5 rounded-panel border border-slate-100 bg-white p-5 shadow-card sm:p-7">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-card bg-pine-500 font-display text-lg font-semibold text-white">
            J
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">Junto</h1>
            <p className="text-xs text-slate-500">Planner de projetos e tarefas em equipe</p>
          </div>
        </div>

        <div className="grid grid-cols-2 rounded-card bg-slate-100 p-1 text-sm font-medium">
          {(
            [
              ["login", "Entrar"],
              ["register", "Criar conta"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchMode(key)}
              className={cn(
                "rounded-card py-1.5 transition-colors",
                mode === key ? "bg-white text-ink shadow-card" : "text-slate-500 hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-medium text-slate-500">
                Nome completo
              </label>
              <input id="name" autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} className={inputCls} />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-500">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className={inputCls}
              placeholder="voce@empresa.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-500">
              Senha {mode === "register" && "(mín. 6 caracteres)"}
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className={inputCls}
            />
          </div>
          {mode === "register" && (
            <div>
              <label htmlFor="confirm" className="mb-1 block text-xs font-medium text-slate-500">
                Confirmar senha
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                className={inputCls}
              />
            </div>
          )}
          {error && <p className="text-sm text-clay-600">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={!email || !password || (mode === "register" && (!name.trim() || !confirm))}
          >
            {mode === "login" ? "Entrar" : "Criar conta e entrar"}
          </Button>
        </form>

        {mode === "login" && (
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs text-slate-500">
              Modo demonstração — senha das contas de exemplo: <span className="font-semibold">{DEMO_PASSWORD}</span>
            </p>
            <div className="space-y-1.5">
              {demo.map(({ user, description }) => (
                <button
                  key={user!.id}
                  type="button"
                  onClick={() => loginAs(user!.id)}
                  className="flex w-full items-center gap-2.5 rounded-card border border-slate-200 px-2.5 py-2 text-left hover:bg-slate-50"
                >
                  <Avatar user={user!} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{user!.name}</p>
                    <p className="text-[11px] leading-snug text-slate-500">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
