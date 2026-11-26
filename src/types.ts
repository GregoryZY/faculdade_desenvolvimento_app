// Domínio central da aplicação. Espelha o schema Prisma (ver prisma/schema.prisma)
// e é a fonte única de verdade de tipos para store, componentes e mocks.

// Papel de uma pessoa DENTRO de um projeto (não existe papel global):
//  LEADER    = quem criou o projeto; gerencia membros, papéis e todas as tarefas
//  CO_LEADER = escolhido pelo líder; cria, delega e gerencia tarefas, mas não gerencia membros
//  MEMBER    = colaborador; executa as próprias tarefas, sem criar/gerir tarefas de outros
export type ProjectRole = "LEADER" | "CO_LEADER" | "MEMBER";

export const PROJECT_ROLE_LABEL: Record<ProjectRole, string> = {
  LEADER: "Líder",
  CO_LEADER: "Co-líder",
  MEMBER: "Colaborador",
};

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string; // usado para gerar o "avatar" de iniciais
  title?: string; // cargo, ex: "Designer de Produto"
  password?: string; // DEMO: senha do cadastro; sem ela vale DEMO_PASSWORD. Com backend vira hash no servidor.
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
  order: number;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string; // ISO
}

export type ActivityAction =
  | "CREATED"
  | "STATUS_CHANGED"
  | "DUE_DATE_CHANGED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "PRIORITY_CHANGED"
  | "COMMENTED"
  | "SUBTASK_TOGGLED";

export interface ActivityLogEntry {
  id: string;
  taskId: string;
  actorId: string;
  action: ActivityAction;
  message: string; // descrição legível, ex.: "moveu o prazo de 12/09 para 15/09"
  createdAt: string; // ISO
}

export interface Task {
  id: string;
  title: string;
  description: string; // markdown simples
  projectId: string; // toda tarefa pertence a um projeto
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  startDate: string; // ISO date (yyyy-MM-dd)
  dueDate: string; // ISO datetime
  assigneeIds: string[];
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  ownerId: string; // quem criou = líder do projeto
}

// Vínculo pessoa ↔ projeto, com o papel que a pessoa exerce nele.
export interface Membership {
  projectId: string;
  userId: string;
  role: ProjectRole;
}

export interface AppState {
  currentUserId: string;
  authed: boolean; // há sessão ativa (login feito)?
  users: User[];
  projects: Project[];
  memberships: Membership[];
  tasks: Task[];
  subtasks: Subtask[];
  comments: Comment[];
  activity: ActivityLogEntry[];
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "A Fazer",
  IN_PROGRESS: "Em Andamento",
  REVIEW: "Revisão",
  DONE: "Concluído",
};

export const KANBAN_COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
