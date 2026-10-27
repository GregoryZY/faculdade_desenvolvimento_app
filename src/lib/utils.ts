import { clsx, type ClassValue } from "clsx";
import { User, TaskPriority } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function userById(users: User[], id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  URGENT: "bg-clay-500",
  HIGH: "bg-amber-400",
  MEDIUM: "bg-pine-300",
  LOW: "bg-slate-300",
};

export const PRIORITY_BADGE: Record<TaskPriority, string> = {
  URGENT: "bg-clay-100 text-clay-600",
  HIGH: "bg-amber-100 text-amber-600",
  MEDIUM: "bg-pine-50 text-pine-600",
  LOW: "bg-slate-100 text-slate-700",
};

export function isOverdue(dueDateISO: string, status: string): boolean {
  if (status === "DONE") return false;
  return new Date(dueDateISO).getTime() < Date.now();
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

export function toDateKey(dateLike: string | Date): string {
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
