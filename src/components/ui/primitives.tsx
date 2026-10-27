import React from "react";
import { cn, initials } from "@/lib/utils";
import { User } from "@/types";

export function Avatar({ user, size = "sm" }: { user: User; size?: "xs" | "sm" | "md" }) {
  const dims = { xs: "h-5 w-5 text-[10px]", sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm" }[size];
  return (
    <div
      title={user.name}
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white shrink-0 ring-2 ring-paper",
        dims
      )}
      style={{ backgroundColor: user.avatarColor }}
    >
      {initials(user.name)}
    </div>
  );
}

export function AvatarStack({ users, max = 3 }: { users: User[]; max?: number }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size="xs" />
      ))}
      {extra > 0 && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-[10px] font-semibold text-ink ring-2 ring-paper">
          +{extra}
        </div>
      )}
    </div>
  );
}

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-xs px-1.5 py-0.5 text-[11px] font-medium", className)}>
      {children}
    </span>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-card px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-pine-500 text-white hover:bg-pine-600",
    secondary: "bg-white text-ink border border-slate-300 hover:bg-slate-100",
    ghost: "text-ink-soft hover:bg-slate-100",
    danger: "bg-clay-500 text-white hover:bg-clay-600",
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-pine-500 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  children,
  widthClass = "max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-10 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={cn("w-full rounded-panel bg-white shadow-pop", widthClass)}>{children}</div>
    </div>
  );
}
