import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar, Button } from "@/components/ui/primitives";
import { userById, formatDateTime } from "@/lib/utils";
import { Send } from "lucide-react";

export default function CommentsThread({ taskId }: { taskId: string }) {
  const comments = useAppStore((s) => s.commentsForTask(taskId));
  const users = useAppStore((s) => s.users);
  const addComment = useAppStore((s) => s.addComment);
  const me = useAppStore((s) => s.currentUser());
  const [draft, setDraft] = useState("");

  function submit() {
    if (!draft.trim()) return;
    addComment(taskId, draft);
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">
            Nenhum comentário ainda. Inicie a conversa sobre esta tarefa.
          </p>
        )}
        {comments.map((c) => {
          const author = userById(users, c.authorId);
          if (!author) return null;
          return (
            <div key={c.id} className="flex gap-2.5">
              <Avatar user={author} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-ink">{author.name}</span>
                  <span className="text-[11px] text-slate-500">{formatDateTime(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-soft">{c.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-end gap-2 border-t border-slate-100 pt-3">
        <Avatar user={me} size="sm" />
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Escreva um comentário… (Enter para enviar)"
          className="max-h-28 flex-1 resize-none rounded-card border border-slate-300 px-3 py-2 text-sm outline-none focus:border-pine-500"
        />
        <Button variant="primary" onClick={submit} aria-label="Enviar comentário">
          <Send size={14} />
        </Button>
      </div>
    </div>
  );
}
