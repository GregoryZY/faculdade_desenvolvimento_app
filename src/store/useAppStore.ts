import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AppState,
  Task,
  TaskStatus,
  TaskPriority,
  Comment,
  Subtask,
  ActivityLogEntry,
  User,
  STATUS_LABEL,
} from "@/types";
import { buildInitialState } from "@/mock/mockData";
import { uid, userById, formatDateTime } from "@/lib/utils";

interface NewTaskInput {
  title: string;
  description: string;
  projectId: string | null;
  priority: TaskPriority;
  tags: string[];
  startDate: string;
  dueDate: string;
  assigneeIds: string[];
  isPrivate: boolean;
}

interface AppActions {
  // sessão
  switchUser: (userId: string) => void;
  currentUser: () => User;
  isLeader: () => boolean;

  // visibilidade
  visibleTasks: () => Task[];

  // CRUD de tarefas
  createTask: (input: NewTaskInput) => Task;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  rescheduleTask: (taskId: string, newStartDate: string, newDueDate: string) => void;
  updateTaskFields: (taskId: string, patch: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;

  // subtarefas
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (subtaskId: string) => void;
  removeSubtask: (subtaskId: string) => void;

  // comentários
  addComment: (taskId: string, body: string) => void;

  // helpers de leitura
  subtasksForTask: (taskId: string) => Subtask[];
  commentsForTask: (taskId: string) => Comment[];
  activityForTask: (taskId: string) => ActivityLogEntry[];
  taskProgress: (taskId: string) => number; // 0-100

  resetToMock: () => void;
}

type Store = AppState & AppActions;

function logActivity(
  state: AppState,
  taskId: string,
  actorId: string,
  action: ActivityLogEntry["action"],
  message: string
) {
  state.activity.unshift({
    id: uid("act"),
    taskId,
    actorId,
    action,
    message,
    createdAt: new Date().toISOString(),
  });
}

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      switchUser: (userId) => set({ currentUserId: userId }),

      currentUser: () => {
        const s = get();
        return userById(s.users, s.currentUserId) ?? s.users[0];
      },

      isLeader: () => get().currentUser().role === "LEADER",

      // Um Colaborador vê: tarefas de equipe (não privadas) + suas próprias tarefas privadas.
      // Um Líder vê tudo, exceto tarefas privadas de outras pessoas.
      visibleTasks: () => {
        const s = get();
        const me = s.currentUserId;
        return s.tasks.filter((t) => {
          if (!t.isPrivate) return true;
          return t.creatorId === me;
        });
      },

      createTask: (input) => {
        const me = get().currentUser();
        const task: Task = {
          id: uid("t"),
          title: input.title,
          description: input.description,
          projectId: input.projectId,
          status: "TODO",
          priority: input.priority,
          tags: input.tags,
          startDate: input.startDate,
          dueDate: input.dueDate,
          assigneeIds: input.isPrivate ? [me.id] : input.assigneeIds,
          creatorId: me.id,
          isPrivate: input.isPrivate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => {
          const tasks = [...s.tasks, task];
          const activity = [...s.activity];
          logActivity({ ...s, activity } as AppState, task.id, me.id, "CREATED", "criou a tarefa");
          return { tasks, activity };
        });
        return task;
      },

      updateTaskStatus: (taskId, status) => {
        const me = get().currentUser();
        set((s) => {
          const tasks = s.tasks.map((t) =>
            t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t
          );
          const activity = [...s.activity];
          const old = s.tasks.find((t) => t.id === taskId);
          if (old && old.status !== status) {
            logActivity(
              { ...s, activity } as AppState,
              taskId,
              me.id,
              "STATUS_CHANGED",
              `moveu de ${STATUS_LABEL[old.status]} para ${STATUS_LABEL[status]}`
            );
          }
          return { tasks, activity };
        });
      },

      rescheduleTask: (taskId, newStartDate, newDueDate) => {
        const me = get().currentUser();
        set((s) => {
          const old = s.tasks.find((t) => t.id === taskId);
          const tasks = s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, startDate: newStartDate, dueDate: newDueDate, updatedAt: new Date().toISOString() }
              : t
          );
          const activity = [...s.activity];
          if (old) {
            logActivity(
              { ...s, activity } as AppState,
              taskId,
              me.id,
              "DUE_DATE_CHANGED",
              `reagendou de ${formatDateTime(old.dueDate)} para ${formatDateTime(newDueDate)}`
            );
          }
          return { tasks, activity };
        });
      },

      updateTaskFields: (taskId, patch) => {
        const me = get().currentUser();
        set((s) => {
          const old = s.tasks.find((t) => t.id === taskId);
          const tasks = s.tasks.map((t) =>
            t.id === taskId ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
          );
          const activity = [...s.activity];
          if (old && patch.priority && patch.priority !== old.priority) {
            logActivity(
              { ...s, activity } as AppState,
              taskId,
              me.id,
              "PRIORITY_CHANGED",
              `alterou a prioridade para ${patch.priority}`
            );
          }
          if (old && patch.assigneeIds) {
            logActivity(
              { ...s, activity } as AppState,
              taskId,
              me.id,
              "ASSIGNED",
              `atualizou os responsáveis da tarefa`
            );
          }
          return { tasks, activity };
        });
      },

      deleteTask: (taskId) => {
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== taskId),
          subtasks: s.subtasks.filter((st) => st.taskId !== taskId),
          comments: s.comments.filter((c) => c.taskId !== taskId),
          activity: s.activity.filter((a) => a.taskId !== taskId),
        }));
      },

      addSubtask: (taskId, title) => {
        set((s) => ({
          subtasks: [
            ...s.subtasks,
            { id: uid("st"), taskId, title, done: false, order: s.subtasks.filter((x) => x.taskId === taskId).length },
          ],
        }));
      },

      toggleSubtask: (subtaskId) => {
        const me = get().currentUser();
        set((s) => {
          const st = s.subtasks.find((x) => x.id === subtaskId);
          const subtasks = s.subtasks.map((x) => (x.id === subtaskId ? { ...x, done: !x.done } : x));
          const activity = [...s.activity];
          if (st) {
            logActivity(
              { ...s, activity } as AppState,
              st.taskId,
              me.id,
              "SUBTASK_TOGGLED",
              `${!st.done ? "concluiu" : "reabriu"} o item "${st.title}"`
            );
          }
          return { subtasks, activity };
        });
      },

      removeSubtask: (subtaskId) => {
        set((s) => ({ subtasks: s.subtasks.filter((x) => x.id !== subtaskId) }));
      },

      addComment: (taskId, body) => {
        const me = get().currentUser();
        if (!body.trim()) return;
        set((s) => {
          const comments: Comment[] = [
            ...s.comments,
            { id: uid("c"), taskId, authorId: me.id, body: body.trim(), createdAt: new Date().toISOString() },
          ];
          const activity = [...s.activity];
          logActivity({ ...s, activity } as AppState, taskId, me.id, "COMMENTED", "comentou na tarefa");
          return { comments, activity };
        });
      },

      subtasksForTask: (taskId) => get().subtasks.filter((s) => s.taskId === taskId).sort((a, b) => a.order - b.order),
      commentsForTask: (taskId) =>
        get()
          .comments.filter((c) => c.taskId === taskId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      activityForTask: (taskId) =>
        get()
          .activity.filter((a) => a.taskId === taskId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      taskProgress: (taskId) => {
        const items = get().subtasksForTask(taskId);
        if (items.length === 0) return 0;
        const done = items.filter((i) => i.done).length;
        return Math.round((done / items.length) * 100);
      },

      resetToMock: () => set(buildInitialState()),
    }),
    { name: "team-planner-storage" }
  )
);
