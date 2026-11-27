import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const inputCls = "w-full rounded-card border border-slate-300 px-3 py-2 text-sm outline-none focus:border-pine-500";

export default function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const register = useAppStore((s) => s.register);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(m: "login" | "register") {
    setMode(m);
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "login") {
      setLoading(true);
      const ok = await login(email, password);
      setLoading(false);
      if (!ok) setError("E-mail ou senha incorretos.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const r = await register({ name, email, password });
    setLoading(false);
    if (!r.ok) setError(r.error);
  }

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
              <input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                className={inputCls}
              />
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
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
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
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
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
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError("");
                }}
                className={inputCls}
              />
            </div>
          )}
          {error && <p className="text-sm text-clay-600">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email || !password || (mode === "register" && (!name.trim() || !confirm))}
          >
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta e entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}