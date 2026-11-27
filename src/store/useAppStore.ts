import { create } from "zustand";
import {
  AppState,
  Task,
  TaskStatus,
  TaskPriority,
  Comment,
  Subtask,
  ActivityLogEntry,
  User,
  Project,
  ProjectRole,
  STATUS_LABEL,
} from "@/types";
import { userById, formatDateTime } from "@/lib/utils";
import {
  roleIn,
  isManager,
  canManageMembers,
  canDeleteProject,
  canCreateTask,
  canEditTask,
  canChangeStatus,
  canAssignTask,
  canComment,
} from "@/lib/permissions";

//const API = "http://localhost:3001/api";
const API = "/api";

interface NewTaskInput {
  title: string;
  description: string;
  projectId: string;
  priority: TaskPriority;
  tags: string[];
  startDate: string;
  dueDate: string;
  assigneeIds: string[];
}

type Result = { ok: true; id?: string } | { ok: false; error: string };
type AsyncResult = Promise<Result>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AppActions {
  initialized: boolean;
  init: () => Promise<void>;

  // conta e sessão
  register: (input: { name: string; email: string; password: string }) => AsyncResult;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  currentUser: () => User;

  // projetos e membros
  createProject: (name: string, color: string) => AsyncResult;
  deleteProject: (projectId: string) => AsyncResult;
  addMember: (projectId: string, email: string, role: Exclude<ProjectRole, "LEADER">) => AsyncResult;
  setMemberRole: (projectId: string, userId: string, role: Exclude<ProjectRole, "LEADER">) => AsyncResult;
  removeMember: (projectId: string, userId: string) => AsyncResult;
  leaveProject: (projectId: string) => AsyncResult;

  // leitura de papéis/projetos
  roleOf: (projectId: string, userId?: string) => ProjectRole | null;
  myProjects: () => Project[];
  managedProjectIds: () => string[];
  membersOf: (projectId: string) => { user: User; role: ProjectRole }[];
  visibleTasks: () => Task[];

  // CRUD de tarefas
  createTask: (input: NewTaskInput) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  rescheduleTask: (taskId: string, newStartDate: string, newDueDate: string) => Promise<void>;
  updateTaskFields: (taskId: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // subtarefas
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (subtaskId: string) => Promise<void>;
  removeSubtask: (subtaskId: string) => Promise<void>;

  // comentários
  addComment: (taskId: string, body: string) => Promise<void>;

  // helpers de leitura
  subtasksForTask: (taskId: string) => Subtask[];
  commentsForTask: (taskId: string) => Comment[];
  activityForTask: (taskId: string) => ActivityLogEntry[];
  taskProgress: (taskId: string) => number;
}

type Store = AppState & AppActions;

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

export const useAppStore = create<Store>()((set, get) => {
  const roleOf = (projectId: string, userId?: string) => {
    const s = get();
    return roleIn(s.memberships, projectId, userId ?? s.currentUserId);
  };

  const ctx = (taskId: string) => {
    const s = get();
    if (!s.authed) return null;
    const me = userById(s.users, s.currentUserId);
    const task = s.tasks.find((t) => t.id === taskId);
    if (!me || !task) return null;
    const role = roleIn(s.memberships, task.projectId, me.id);
    if (role === null) return null;
    return { me, task, role };
  };

  return {
    initialized: false,
    users: [],
    projects: [],
    memberships: [],
    tasks: [],
    subtasks: [],
    comments: [],
    activity: [],
    currentUserId: sessionStorage.getItem("planner_uid") || "",
    authed: false,

    init: async () => {
      const data = await api<Omit<AppState, "currentUserId" | "authed">>("/bootstrap");
      const savedUid = sessionStorage.getItem("planner_uid") || "";
      const validUser = data.users.some((u) => u.id === savedUid);
      set({
        ...data,
        initialized: true,
        currentUserId: validUser ? savedUid : "",
        authed: validUser,
      });
    },

    // ---------------- conta e sessão ----------------
    register: async ({ name, email, password }) => {
      if (!name.trim()) return { ok: false, error: "Informe seu nome." };
      if (!EMAIL_RE.test(email.trim())) return { ok: false, error: "E-mail inválido." };
      if (password.length < 6) return { ok: false, error: "A senha precisa ter ao menos 6 caracteres." };

      const res = await api<{ ok: boolean; user?: User; error?: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok || !res.user) return { ok: false, error: res.error || "Erro ao cadastrar." };

      sessionStorage.setItem("planner_uid", res.user.id);
      set((st) => ({
        users: [...st.users, res.user!],
        currentUserId: res.user!.id,
        authed: true,
      }));
      return { ok: true, id: res.user.id };
    },

    login: async (email, password) => {
      const res = await api<{ ok: boolean; user?: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok || !res.user) return false;

      sessionStorage.setItem("planner_uid", res.user.id);
      set((st) => ({
        users: st.users.some((u) => u.id === res.user!.id) ? st.users : [...st.users, res.user!],
        currentUserId: res.user!.id,
        authed: true,
      }));
      return true;
    },

    logout: () => {
      sessionStorage.removeItem("planner_uid");
      set({ authed: false, currentUserId: "" });
    },

    currentUser: () => {
      const s = get();
      return userById(s.users, s.currentUserId) ?? s.users[0];
    },

    // ---------------- projetos e membros ----------------
    createProject: async (name, color) => {
      const s = get();
      if (!s.authed) return { ok: false, error: "Faça login para criar um projeto." };
      if (!name.trim()) return { ok: false, error: "Informe o nome do projeto." };

      const me = s.currentUser();
      const res = await api<{ ok: boolean; project?: Project; error?: string }>("/projects", {
        method: "POST",
        body: JSON.stringify({ name, color, ownerId: me.id }),
      });
      if (!res.ok || !res.project) return { ok: false, error: res.error || "Erro ao criar projeto." };

      set((st) => ({
        projects: [...st.projects, res.project!],
        memberships: [...st.memberships, { projectId: res.project!.id, userId: me.id, role: "LEADER" }],
      }));
      return { ok: true, id: res.project.id };
    },

    deleteProject: async (projectId) => {
      if (!get().authed || !canDeleteProject(roleOf(projectId))) {
        return { ok: false, error: "Apenas o líder pode excluir o projeto." };
      }
      await api(`/projects/${projectId}`, { method: "DELETE" });
      set((st) => {
        const gone = new Set(st.tasks.filter((t) => t.projectId === projectId).map((t) => t.id));
        return {
          projects: st.projects.filter((p) => p.id !== projectId),
          memberships: st.memberships.filter((m) => m.projectId !== projectId),
          tasks: st.tasks.filter((t) => !gone.has(t.id)),
          subtasks: st.subtasks.filter((x) => !gone.has(x.taskId)),
          comments: st.comments.filter((c) => !gone.has(c.taskId)),
          activity: st.activity.filter((a) => !gone.has(a.taskId)),
        };
      });
      return { ok: true };
    },

    addMember: async (projectId, email, role) => {
      if (!get().authed || !canManageMembers(roleOf(projectId))) {
        return { ok: false, error: "Apenas o líder pode adicionar membros." };
      }
      const res = await api<{ ok: boolean; userId?: string; error?: string }>(`/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok || !res.userId) return { ok: false, error: res.error || "Erro ao adicionar membro." };

      set((st) => ({ memberships: [...st.memberships, { projectId, userId: res.userId!, role }] }));
      return { ok: true, id: res.userId };
    },

    setMemberRole: async (projectId, userId, role) => {
      if (!get().authed || !canManageMembers(roleOf(projectId))) {
        return { ok: false, error: "Apenas o líder pode alterar papéis." };
      }
      await api(`/projects/${projectId}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      set((st) => ({
        memberships: st.memberships.map((m) =>
          m.projectId === projectId && m.userId === userId ? { ...m, role } : m
        ),
      }));
      return { ok: true };
    },

    removeMember: async (projectId, userId) => {
      const s = get();
      if (!s.authed || !canManageMembers(roleOf(projectId))) {
        return { ok: false, error: "Apenas o líder pode remover membros." };
      }
      await api(`/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
        body: JSON.stringify({ actorId: s.currentUserId }),
      });
      await get().init();
      return { ok: true };
    },

    leaveProject: async (projectId) => {
      const s = get();
      const role = roleOf(projectId);
      if (!s.authed || role === null) return { ok: false, error: "Você não participa deste projeto." };
      if (role === "LEADER") return { ok: false, error: "O líder não pode sair." };

      await api(`/projects/${projectId}/members/${s.currentUserId}`, {
        method: "DELETE",
        body: JSON.stringify({ actorId: s.currentUserId }),
      });
      await get().init();
      return { ok: true };
    },

    // ---------------- leitura de papéis/projetos ----------------
    roleOf,

    myProjects: () => {
      const s = get();
      if (!s.authed) return [];
      const ids = new Set(s.memberships.filter((m) => m.userId === s.currentUserId).map((m) => m.projectId));
      return s.projects.filter((p) => ids.has(p.id));
    },

    managedProjectIds: () => {
      const s = get();
      if (!s.authed) return [];
      return s.memberships
        .filter((m) => m.userId === s.currentUserId && isManager(m.role))
        .map((m) => m.projectId);
    },

    membersOf: (projectId) => {
      const s = get();
      const order: Record<ProjectRole, number> = { LEADER: 0, CO_LEADER: 1, MEMBER: 2 };
      return s.memberships
        .filter((m) => m.projectId === projectId)
        .map((m) => ({ user: userById(s.users, m.userId), role: m.role }))
        .filter((x): x is { user: User; role: ProjectRole } => !!x.user)
        .sort((a, b) => order[a.role] - order[b.role] || a.user.name.localeCompare(b.user.name));
    },

    visibleTasks: () => {
      const s = get();
      if (!s.authed) return [];
      const ids = new Set(s.memberships.filter((m) => m.userId === s.currentUserId).map((m) => m.projectId));
      return s.tasks.filter((t) => ids.has(t.projectId));
    },

    // ---------------- tarefas ----------------
    createTask: async (input) => {
      const s = get();
      if (!s.authed) return null;
      const me = s.currentUser();
      const role = roleOf(input.projectId, me.id);
      if (!canCreateTask(role)) return null;

      const memberIds = new Set(s.memberships.filter((m) => m.projectId === input.projectId).map((m) => m.userId));
      let assigneeIds = isManager(role) ? input.assigneeIds.filter((id) => memberIds.has(id)) : [me.id];
      if (assigneeIds.length === 0) assigneeIds = [me.id];

      const res = await api<{ task: Task; activity: ActivityLogEntry[] }>("/tasks", {
        method: "POST",
        body: JSON.stringify({ ...input, assigneeIds, creatorId: me.id }),
      });

      set((st) => ({
        tasks: [...st.tasks, res.task],
        activity: [...res.activity, ...st.activity],
      }));
      return res.task;
    },

    updateTaskStatus: async (taskId, status) => {
      const c = ctx(taskId);
      if (!c || !canChangeStatus(c.role, c.task, c.me.id) || c.task.status === status) return;

      const res = await api<{ task: Task; latestActivity: ActivityLogEntry | null }>(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({
          patch: { status },
          actorId: c.me.id,
          logAction: "STATUS_CHANGED",
          logMessage: `moveu de ${STATUS_LABEL[c.task.status]} para ${STATUS_LABEL[status]}`,
        }),
      });

      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? res.task : t)),
        activity: res.latestActivity ? [res.latestActivity, ...s.activity] : s.activity,
      }));
    },

    rescheduleTask: async (taskId, newStartDate, newDueDate) => {
      const c = ctx(taskId);
      if (!c || !canEditTask(c.role, c.task, c.me.id)) return;

      const res = await api<{ task: Task; latestActivity: ActivityLogEntry | null }>(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({
          patch: { startDate: newStartDate, dueDate: newDueDate },
          actorId: c.me.id,
          logAction: "DUE_DATE_CHANGED",
          logMessage: `reagendou de ${formatDateTime(c.task.dueDate)} para ${formatDateTime(newDueDate)}`,
        }),
      });

      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? res.task : t)),
        activity: res.latestActivity ? [res.latestActivity, ...s.activity] : s.activity,
      }));
    },

    updateTaskFields: async (taskId, patch) => {
      const c = ctx(taskId);
      if (!c) return;
      const { assigneeIds, projectId: _p, creatorId: _c, ...rest } = patch;
      if (assigneeIds && !canAssignTask(c.role)) return;
      if (Object.keys(rest).length > 0 && !canEditTask(c.role, c.task, c.me.id)) return;

      const res = await api<{ task: Task; latestActivity: ActivityLogEntry | null }>(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({
          patch: { ...rest, ...(assigneeIds ? { assigneeIds } : {}) },
          actorId: c.me.id,
          logAction: assigneeIds ? "ASSIGNED" : "PRIORITY_CHANGED",
          logMessage: assigneeIds ? "atualizou os responsáveis da tarefa" : "atualizou os detalhes da tarefa",
        }),
      });

      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? res.task : t)),
        activity: res.latestActivity ? [res.latestActivity, ...s.activity] : s.activity,
      }));
    },

    deleteTask: async (taskId) => {
      const c = ctx(taskId);
      if (!c || !canEditTask(c.role, c.task, c.me.id)) return;
      await api(`/tasks/${taskId}`, { method: "DELETE" });
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== taskId),
        subtasks: s.subtasks.filter((st) => st.taskId !== taskId),
        comments: s.comments.filter((cm) => cm.taskId !== taskId),
        activity: s.activity.filter((a) => a.taskId !== taskId),
      }));
    },

    // ---------------- subtarefas ----------------
    addSubtask: async (taskId, title) => {
      const c = ctx(taskId);
      if (!c || !canChangeStatus(c.role, c.task, c.me.id) || !title.trim()) return;
      const subtask = await api<Subtask>(`/tasks/${taskId}/subtasks`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim() }),
      });
      set((s) => ({ subtasks: [...s.subtasks, subtask] }));
    },

    toggleSubtask: async (subtaskId) => {
      const st = get().subtasks.find((x) => x.id === subtaskId);
      if (!st) return;
      const c = ctx(st.taskId);
      if (!c || !canChangeStatus(c.role, c.task, c.me.id)) return;

      const res = await api<{ subtask: Subtask; activity: ActivityLogEntry }>(`/subtasks/${subtaskId}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ actorId: c.me.id }),
      });
      set((s) => ({
        subtasks: s.subtasks.map((x) => (x.id === subtaskId ? res.subtask : x)),
        activity: [res.activity, ...s.activity],
      }));
    },

    removeSubtask: async (subtaskId) => {
      const st = get().subtasks.find((x) => x.id === subtaskId);
      if (!st) return;
      const c = ctx(st.taskId);
      if (!c || !canChangeStatus(c.role, c.task, c.me.id)) return;
      await api(`/subtasks/${subtaskId}`, { method: "DELETE" });
      set((s) => ({ subtasks: s.subtasks.filter((x) => x.id !== subtaskId) }));
    },

    // ---------------- comentários ----------------
    addComment: async (taskId, body) => {
      const c = ctx(taskId);
      if (!c || !canComment(c.role) || !body.trim()) return;
      const res = await api<{ comment: Comment; activity: ActivityLogEntry }>(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ authorId: c.me.id, body: body.trim() }),
      });
      set((s) => ({
        comments: [...s.comments, res.comment],
        activity: [res.activity, ...s.activity],
      }));
    },

    // ---------------- leitura ----------------
    subtasksForTask: (taskId) =>
      get()
        .subtasks.filter((s) => s.taskId === taskId)
        .sort((a, b) => a.order - b.order),
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
  };
});