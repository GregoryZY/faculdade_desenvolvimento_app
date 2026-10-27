// Domínio central da aplicação. Espelha o schema Prisma (ver prisma/schema.prisma)
// e é a fonte única de verdade de tipos para store, componentes e mocks.

export type Role = "LEADER" | "MEMBER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string; // usado para gerar o "avatar" de iniciais
  title?: string; // cargo, ex: "Designer de Produto"
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
  projectId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  startDate: string; // ISO date (yyyy-MM-dd)
  dueDate: string; // ISO datetime
  assigneeIds: string[];
  creatorId: string;
  isPrivate: boolean; // tarefa pessoal do colaborador, não visível para o time
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface AppState {
  currentUserId: string;
  users: User[];
  projects: Project[];
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
