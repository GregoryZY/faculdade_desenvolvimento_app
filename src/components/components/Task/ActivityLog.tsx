import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { userById, formatDateTime } from "@/lib/utils";
import { History } from "lucide-react";

export default function ActivityLog({ taskId }: { taskId: string }) {
  const entries = useAppStore((s) => s.activityForTask(taskId));
  const users = useAppStore((s) => s.users);

  if (entries.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-500">Sem atividade registrada.</p>;
  }

  return (
    <ul className="space-y-3">
      {entries.map((e) => {
        const actor = userById(users, e.actorId);
        return (
          <li key={e.id} className="flex gap-2.5 text-sm">
            <History size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-ink-soft">
              <span className="font-medium text-ink">{actor?.name ?? "Alguém"}</span> {e.message}{" "}
              <span className="text-[11px] text-slate-500">· {formatDateTime(e.createdAt)}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
