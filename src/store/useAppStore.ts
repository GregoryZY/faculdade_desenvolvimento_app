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
  Project,
  ProjectRole,
  STATUS_LABEL,
} from "@/types";
import { buildInitialState, DEMO_PASSWORD } from "@/mock/mockData";
import { uid, userById, formatDateTime } from "@/lib/utils";
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

const AVATAR_COLORS = ["#0F5B52", "#B87A1F", "#9E3220", "#454842", "#0C4A43", "#3B6EA5", "#7A4E9E", "#2F7D4F"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AppActions {
  // conta e sessão
  register: (input: { name: string; email: string; password: string }) => Result;
  login: (email: string, password: string) => boolean;
  loginAs: (userId: string) => void; // atalho de demonstração (sem senha)
  logout: () => void;
  currentUser: () => User;

  // projetos e membros
  createProject: (name: string, color: string) => Result;
  deleteProject: (projectId: string) => Result;
  addMember: (projectId: string, email: string, role: Exclude<ProjectRole, "LEADER">) => Result;
  setMemberRole: (projectId: string, userId: string, role: Exclude<ProjectRole, "LEADER">) => Result;
  removeMember: (projectId: string, userId: string) => Result;
  leaveProject: (projectId: string) => Result;

  // leitura de papéis/projetos
  roleOf: (projectId: string, userId?: string) => ProjectRole | null;
  myProjects: () => Project[];
  managedProjectIds: () => string[]; // projetos onde sou líder ou co-líder
  membersOf: (projectId: string) => { user: User; role: ProjectRole }[];
  visibleTasks: () => Task[];

  // CRUD de tarefas
  createTask: (input: NewTaskInput) => Task | null;
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

function entry(
  taskId: string,
  actorId: string,
  action: ActivityLogEntry["action"],
  message: string
): ActivityLogEntry {
  return { id: uid("act"), taskId, actorId, action, message, createdAt: new Date().toISOString() };
}

// Tira a pessoa de um projeto: some das tarefas como responsável e as tarefas que
// ela criou passam para o líder (dono) do projeto, para nada ficar órfão.
function detachFromProject(st: Store, projectId: string, userId: string, actorId: string, reason: string) {
  const project = st.projects.find((p) => p.id === projectId);
  const now = new Date().toISOString();
  const log: ActivityLogEntry[] = [];
  const tasks = st.tasks.map((t) => {
    if (t.projectId !== projectId) return t;
    const hadAssignee = t.assigneeIds.includes(userId);
    const wasCreator = t.creatorId === userId;
    if (!hadAssignee && !wasCreator) return t;
    if (hadAssignee) log.push(entry(t.id, actorId, "UNASSIGNED", reason));
    return {
      ...t,
      assigneeIds: t.assigneeIds.filter((id) => id !== userId),
      creatorId: wasCreator && project ? project.ownerId : t.creatorId,
      updatedAt: now,
    };
  });
  return {
    memberships: st.memberships.filter((m) => !(m.projectId === projectId && m.userId === userId)),
    tasks,
    activity: [...log, ...st.activity],
  };
}

export const useAppStore = create<Store>()(
  persist(
    (set, get) => {
      const roleOf = (projectId: string, userId?: string) => {
        const s = get();
        return roleIn(s.memberships, projectId, userId ?? s.currentUserId);
      };

      // Tarefa + usuário + meu papel no projeto da tarefa; null se sem sessão,
      // sem tarefa ou se a pessoa não participa do projeto.
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
        ...buildInitialState(),

        // ---------------- conta e sessão ----------------
        register: ({ name, email, password }) => {
          const s = get();
          const n = name.trim();
          const mail = email.trim().toLowerCase();
          if (!n) return { ok: false, error: "Informe seu nome." };
          if (!EMAIL_RE.test(mail)) return { ok: false, error: "E-mail inválido." };
          if (s.users.some((u) => u.email.toLowerCase() === mail)) {
            return { ok: false, error: "Já existe uma conta com esse e-mail." };
          }
          if (password.length < 6) return { ok: false, error: "A senha precisa ter ao menos 6 caracteres." };
          const user: User = {
            id: uid("u"),
            name: n,
            email: mail,
            avatarColor: AVATAR_COLORS[s.users.length % AVATAR_COLORS.length],
            password,
          };
          set((st) => ({ users: [...st.users, user], currentUserId: user.id, authed: true }));
          return { ok: true, id: user.id };
        },

        login: (email, password) => {
          const u = get().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
          if (!u || password !== (u.password ?? DEMO_PASSWORD)) return false;
          set({ currentUserId: u.id, authed: true });
          return true;
        },

        loginAs: (userId) => {
          if (get().users.some((u) => u.id === userId)) set({ currentUserId: userId, authed: true });
        },

        logout: () => set({ authed: false }),

        currentUser: () => {
          const s = get();
          return userById(s.users, s.currentUserId) ?? s.users[0];
        },

        // ---------------- projetos e membros ----------------
        createProject: (name, color) => {
          const s = get();
          if (!s.authed) return { ok: false, error: "Faça login para criar um projeto." };
          const me = s.currentUser();
          const n = name.trim();
          if (!n) return { ok: false, error: "Informe o nome do projeto." };
          if (s.projects.some((p) => p.ownerId === me.id && p.name.toLowerCase() === n.toLowerCase())) {
            return { ok: false, error: "Você já tem um projeto com esse nome." };
          }
          // Quem cria o projeto é automaticamente o LÍDER dele.
          const project: Project = { id: uid("p"), name: n, color, ownerId: me.id };
          set((st) => ({
            projects: [...st.projects, project],
            memberships: [...st.memberships, { projectId: project.id, userId: me.id, role: "LEADER" }],
          }));
          return { ok: true, id: project.id };
        },

        deleteProject: (projectId) => {
          const s = get();
          if (!s.authed || !canDeleteProject(roleOf(projectId))) {
            return { ok: false, error: "Apenas o líder pode excluir o projeto." };
          }
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

        addMember: (projectId, email, role) => {
          const s = get();
          if (!s.authed || !canManageMembers(roleOf(projectId))) {
            return { ok: false, error: "Apenas o líder pode adicionar membros." };
          }
          const mail = email.trim().toLowerCase();
          const user = s.users.find((u) => u.email.toLowerCase() === mail);
          if (!user) {
            return { ok: false, error: "Nenhuma conta cadastrada com esse e-mail. Peça para a pessoa criar a conta primeiro." };
          }
          if (roleIn(s.memberships, projectId, user.id) !== null) {
            return { ok: false, error: `${user.name} já participa deste projeto.` };
          }
          set((st) => ({ memberships: [...st.memberships, { projectId, userId: user.id, role }] }));
          return { ok: true, id: user.id };
        },

        setMemberRole: (projectId, userId, role) => {
          const s = get();
          if (!s.authed || !canManageMembers(roleOf(projectId))) {
            return { ok: false, error: "Apenas o líder pode alterar papéis." };
          }
          const target = roleIn(s.memberships, projectId, userId);
          if (target === null) return { ok: false, error: "Essa pessoa não participa do projeto." };
          if (target === "LEADER") return { ok: false, error: "O papel do líder não pode ser alterado." };
          set((st) => ({
            memberships: st.memberships.map((m) =>
              m.projectId === projectId && m.userId === userId ? { ...m, role } : m
            ),
          }));
          return { ok: true };
        },

        removeMember: (projectId, userId) => {
          const s = get();
          const me = s.currentUser();
          if (!s.authed || !canManageMembers(roleOf(projectId))) {
            return { ok: false, error: "Apenas o líder pode remover membros." };
          }
          const target = roleIn(s.memberships, projectId, userId);
          if (target === null) return { ok: false, error: "Essa pessoa não participa do projeto." };
          if (target === "LEADER") return { ok: false, error: "O líder não pode ser removido." };
          set((st) => detachFromProject(st, projectId, userId, me.id, "removeu um responsável (pessoa saiu do projeto)"));
          return { ok: true };
        },

        leaveProject: (projectId) => {
          const s = get();
          const me = s.currentUser();
          const role = roleOf(projectId);
          if (!s.authed || role === null) return { ok: false, error: "Você não participa deste projeto." };
          if (role === "LEADER") {
            return { ok: false, error: "O líder não pode sair. Exclua o projeto, se for o caso." };
          }
          set((st) => detachFromProject(st, projectId, me.id, me.id, "saiu do projeto e deixou de ser responsável"));
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

        // Quem participa do projeto enxerga todas as tarefas dele (o que pode FAZER varia por papel).
        visibleTasks: () => {
          const s = get();
          if (!s.authed) return [];
          const ids = new Set(s.memberships.filter((m) => m.userId === s.currentUserId).map((m) => m.projectId));
          return s.tasks.filter((t) => ids.has(t.projectId));
        },

        // ---------------- tarefas ----------------
        createTask: (input) => {
          const s = get();
          if (!s.authed) return null;
          const me = s.currentUser();
          const role = roleOf(input.projectId, me.id);
          if (!canCreateTask(role)) return null;

          // Líder/co-líder delegam a outros membros do projeto; colaborador só cria para si.
          const memberIds = new Set(s.memberships.filter((m) => m.projectId === input.projectId).map((m) => m.userId));
          let assigneeIds = isManager(role) ? input.assigneeIds.filter((id) => memberIds.has(id)) : [me.id];
          if (assigneeIds.length === 0) assigneeIds = [me.id];

          const now = new Date().toISOString();
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
            assigneeIds,
            creatorId: me.id,
            createdAt: now,
            updatedAt: now,
          };
          set((st) => ({
            tasks: [...st.tasks, task],
            activity: [entry(task.id, me.id, "CREATED", "criou a tarefa"), ...st.activity],
          }));
          return task;
        },

        updateTaskStatus: (taskId, status) => {
          const c = ctx(taskId);
          if (!c || !canChangeStatus(c.role, c.task, c.me.id) || c.task.status === status) return;
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t
            ),
            activity: [
              entry(
                taskId,
                c.me.id,
                "STATUS_CHANGED",
                `moveu de ${STATUS_LABEL[c.task.status]} para ${STATUS_LABEL[status]}`
              ),
              ...s.activity,
            ],
          }));
        },

        rescheduleTask: (taskId, newStartDate, newDueDate) => {
          const c = ctx(taskId);
          if (!c || !canEditTask(c.role, c.task, c.me.id)) return;
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === taskId
                ? { ...t, startDate: newStartDate, dueDate: newDueDate, updatedAt: new Date().toISOString() }
                : t
            ),
            activity: [
              entry(
                taskId,
                c.me.id,
                "DUE_DATE_CHANGED",
                `reagendou de ${formatDateTime(c.task.dueDate)} para ${formatDateTime(newDueDate)}`
              ),
              ...s.activity,
            ],
          }));
        },

        updateTaskFields: (taskId, patch) => {
          const c = ctx(taskId);
          if (!c) return;
          // projeto e criador nunca mudam por aqui
          const { assigneeIds, projectId: _p, creatorId: _c, ...rest } = patch;
          if (assigneeIds && !canAssignTask(c.role)) return;
          if (Object.keys(rest).length > 0 && !canEditTask(c.role, c.task, c.me.id)) return;

          let validAssignees: string[] | undefined;
          if (assigneeIds) {
            const memberIds = new Set(
              get()
                .memberships.filter((m) => m.projectId === c.task.projectId)
                .map((m) => m.userId)
            );
            validAssignees = assigneeIds.filter((id) => memberIds.has(id));
          }

          const extra: ActivityLogEntry[] = [];
          if (rest.priority && rest.priority !== c.task.priority) {
            extra.push(entry(taskId, c.me.id, "PRIORITY_CHANGED", `alterou a prioridade para ${rest.priority}`));
          }
          if (validAssignees) {
            extra.push(entry(taskId, c.me.id, "ASSIGNED", "atualizou os responsáveis da tarefa"));
          }
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    ...rest,
                    ...(validAssignees ? { assigneeIds: validAssignees } : {}),
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
            activity: [...extra, ...s.activity],
          }));
        },

        deleteTask: (taskId) => {
          const c = ctx(taskId);
          if (!c || !canEditTask(c.role, c.task, c.me.id)) return;
          set((s) => ({
            tasks: s.tasks.filter((t) => t.id !== taskId),
            subtasks: s.subtasks.filter((st) => st.taskId !== taskId),
            comments: s.comments.filter((cm) => cm.taskId !== taskId),
            activity: s.activity.filter((a) => a.taskId !== taskId),
          }));
        },

        // ---------------- subtarefas (checklist: quem pode agir na tarefa) ----------------
        addSubtask: (taskId, title) => {
          const c = ctx(taskId);
          if (!c || !canChangeStatus(c.role, c.task, c.me.id) || !title.trim()) return;
          set((s) => ({
            subtasks: [
              ...s.subtasks,
              {
                id: uid("st"),
                taskId,
                title: title.trim(),
                done: false,
                order: s.subtasks.filter((x) => x.taskId === taskId).length,
              },
            ],
          }));
        },

        toggleSubtask: (subtaskId) => {
          const st = get().subtasks.find((x) => x.id === subtaskId);
          if (!st) return;
          const c = ctx(st.taskId);
          if (!c || !canChangeStatus(c.role, c.task, c.me.id)) return;
          set((s) => ({
            subtasks: s.subtasks.map((x) => (x.id === subtaskId ? { ...x, done: !x.done } : x)),
            activity: [
              entry(
                st.taskId,
                c.me.id,
                "SUBTASK_TOGGLED",
                `${!st.done ? "concluiu" : "reabriu"} o item "${st.title}"`
              ),
              ...s.activity,
            ],
          }));
        },

        removeSubtask: (subtaskId) => {
          const st = get().subtasks.find((x) => x.id === subtaskId);
          if (!st) return;
          const c = ctx(st.taskId);
          if (!c || !canChangeStatus(c.role, c.task, c.me.id)) return;
          set((s) => ({ subtasks: s.subtasks.filter((x) => x.id !== subtaskId) }));
        },

        // ---------------- comentários (qualquer participante do projeto) ----------------
        addComment: (taskId, body) => {
          const c = ctx(taskId);
          if (!c || !canComment(c.role) || !body.trim()) return;
          set((s) => ({
            comments: [
              ...s.comments,
              { id: uid("c"), taskId, authorId: c.me.id, body: body.trim(), createdAt: new Date().toISOString() },
            ],
            activity: [entry(taskId, c.me.id, "COMMENTED", "comentou na tarefa"), ...s.activity],
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

        resetToMock: () => set({ ...buildInitialState(), authed: get().authed, currentUserId: get().currentUserId }),
      };
    },
    {
      name: "team-planner-storage",
      // v2: o modelo mudou (papéis por projeto + memberships). Dados salvos no formato
      // antigo não são compatíveis; nesse caso recomeçamos dos dados de exemplo.
      version: 2,
      migrate: () => buildInitialState() as unknown as Store,
    }
  )
);
