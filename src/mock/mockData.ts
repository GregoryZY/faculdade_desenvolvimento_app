import { AppState, Task, User, Project, Subtask, Comment, ActivityLogEntry } from "@/types";
import { toDateKey } from "@/lib/utils";

// --------------------------------------------------------------------------
// Usuários: 1 Líder + 4 Colaboradores
// --------------------------------------------------------------------------
export const mockUsers: User[] = [
  {
    id: "u-lider",
    name: "Marina Costa",
    email: "marina.costa@empresa.com",
    role: "LEADER",
    title: "Gerente de Produto",
    avatarColor: "#0F5B52",
  },
  {
    id: "u-1",
    name: "Rafael Nunes",
    email: "rafael.nunes@empresa.com",
    role: "MEMBER",
    title: "Desenvolvedor Frontend",
    avatarColor: "#B87A1F",
  },
  {
    id: "u-2",
    name: "Beatriz Lima",
    email: "beatriz.lima@empresa.com",
    role: "MEMBER",
    title: "Designer de Produto",
    avatarColor: "#9E3220",
  },
  {
    id: "u-3",
    name: "Diego Santos",
    email: "diego.santos@empresa.com",
    role: "MEMBER",
    title: "Desenvolvedor Backend",
    avatarColor: "#454842",
  },
  {
    id: "u-4",
    name: "Carla Mendes",
    email: "carla.mendes@empresa.com",
    role: "MEMBER",
    title: "QA Analyst",
    avatarColor: "#0C4A43",
  },
];

export const mockProjects: Project[] = [
  { id: "p-1", name: "App Mobile v2", color: "#0F5B52" },
  { id: "p-2", name: "Site Institucional", color: "#B87A1F" },
  { id: "p-3", name: "Onboarding Interno", color: "#9E3220" },
];

function iso(daysFromNow: number, hour = 18, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateOnly(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return toDateKey(d);
}

// --------------------------------------------------------------------------
// Tarefas: mistura de atrasadas, pendentes hoje/futuro, em revisão e concluídas
// --------------------------------------------------------------------------
export const mockTasks: Task[] = [
  {
    id: "t-1",
    title: "Revisar wireframes da tela de login",
    description: "Validar o fluxo de **login social** e recuperação de senha antes do handoff.",
    projectId: "p-1",
    status: "IN_PROGRESS",
    priority: "HIGH",
    tags: ["design", "mobile"],
    startDate: dateOnly(-2),
    dueDate: iso(-1, 17, 0), // atrasada
    assigneeIds: ["u-2"],
    creatorId: "u-lider",
    isPrivate: false,
    createdAt: iso(-5),
    updatedAt: iso(-1),
  },
  {
    id: "t-2",
    title: "Implementar autenticação JWT",
    description: "Endpoint de login/refresh token com expiração de 15 min para access token.",
    projectId: "p-1",
    status: "TODO",
    priority: "URGENT",
    tags: ["backend", "seguranca"],
    startDate: dateOnly(0),
    dueDate: iso(0, 20, 0), // vence hoje
    assigneeIds: ["u-3"],
    creatorId: "u-lider",
    isPrivate: false,
    createdAt: iso(-3),
    updatedAt: iso(-3),
  },
  {
    id: "t-3",
    title: "Escrever testes E2E do checkout",
    description: "Cobrir os fluxos de pagamento com cartão e Pix usando Playwright.",
    projectId: "p-1",
    status: "TODO",
    priority: "MEDIUM",
    tags: ["qa"],
    startDate: dateOnly(1),
    dueDate: iso(3, 12, 0),
    assigneeIds: ["u-4"],
    creatorId: "u-lider",
    isPrivate: false,
    createdAt: iso(-2),
    updatedAt: iso(-2),
  },
  {
    id: "t-4",
    title: "Atualizar copy da landing page",
    description: "Novo texto do hero alinhado ao reposicionamento de marca.",
    projectId: "p-2",
    status: "REVIEW",
    priority: "MEDIUM",
    tags: ["marketing", "copy"],
    startDate: dateOnly(-4),
    dueDate: iso(-1, 15, 0), // atrasada, em revisão
    assigneeIds: ["u-1", "u-2"],
    creatorId: "u-lider",
    isPrivate: false,
    createdAt: iso(-6),
    updatedAt: iso(-1),
  },
  {
    id: "t-5",
    title: "Configurar pipeline de CI/CD",
    description: "GitHub Actions com lint, testes e deploy automático em staging.",
    projectId: "p-1",
    status: "DONE",
    priority: "HIGH",
    tags: ["devops"],
    startDate: dateOnly(-10),
    dueDate: iso(-6, 18, 0),
    assigneeIds: ["u-3"],
    creatorId: "u-lider",
    isPrivate: false,
    createdAt: iso(-12),
    updatedAt: iso(-6),
  },
  {
    id: "t-6",
    title: "Onboarding de novos colaboradores",
    description: "Preparar trilha de boas-vindas com materiais e checklist da primeira semana.",
    projectId: "p-3",
    status: "IN_PROGRESS",
    priority: "LOW",
    tags: ["rh"],
    startDate: dateOnly(0),
    dueDate: iso(5, 18, 0),
    assigneeIds: ["u-lider"],
    creatorId: "u-lider",
    isPrivate: false,
    createdAt: iso(-1),
    updatedAt: iso(-1),
  },
  {
    id: "t-7",
    title: "Corrigir bug de layout no Safari",
    description: "Cards do dashboard quebram em telas menores que 1024px no Safari.",
    projectId: "p-1",
    status: "TODO",
    priority: "HIGH",
    tags: ["bug", "frontend"],
    startDate: dateOnly(0),
    dueDate: iso(2, 17, 0),
    assigneeIds: ["u-1"],
    creatorId: "u-lider",
    isPrivate: false,
    createdAt: iso(0),
    updatedAt: iso(0),
  },
  {
    id: "t-8",
    title: "Dentista",
    description: "Consulta de rotina.",
    projectId: null,
    status: "TODO",
    priority: "LOW",
    tags: ["pessoal"],
    startDate: dateOnly(2),
    dueDate: iso(2, 9, 30),
    assigneeIds: ["u-1"],
    creatorId: "u-1",
    isPrivate: true,
    createdAt: iso(-1),
    updatedAt: iso(-1),
  },
  {
    id: "t-9",
    title: "Preparar apresentação da sprint review",
    description: "Slides com métricas de velocidade e demo das entregas da sprint.",
    projectId: "p-1",
    status: "REVIEW",
    priority: "URGENT",
    tags: ["gestao"],
    startDate: dateOnly(-1),
    dueDate: iso(1, 14, 0),
    assigneeIds: ["u-lider", "u-3"],
    creatorId: "u-lider",
    isPrivate: false,
    createdAt: iso(-3),
    updatedAt: iso(0),
  },
  {
    id: "t-10",
    title: "Estudar para certificação AWS",
    description: "Módulos 4 a 6 do curso antes da prova.",
    projectId: null,
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    tags: ["pessoal", "estudo"],
    startDate: dateOnly(-3),
    dueDate: iso(6, 20, 0),
    assigneeIds: ["u-3"],
    creatorId: "u-3",
    isPrivate: true,
    createdAt: iso(-3),
    updatedAt: iso(-3),
  },
];

export const mockSubtasks: Subtask[] = [
  { id: "st-1", taskId: "t-1", title: "Revisar fluxo de login social", done: true, order: 0 },
  { id: "st-2", taskId: "t-1", title: "Revisar tela de recuperação de senha", done: false, order: 1 },
  { id: "st-3", taskId: "t-1", title: "Validar estados de erro", done: false, order: 2 },

  { id: "st-4", taskId: "t-2", title: "Criar endpoint /auth/login", done: false, order: 0 },
  { id: "st-5", taskId: "t-2", title: "Criar endpoint /auth/refresh", done: false, order: 1 },
  { id: "st-6", taskId: "t-2", title: "Escrever testes unitários", done: false, order: 2 },
  { id: "st-7", taskId: "t-2", title: "Documentar no Swagger", done: false, order: 3 },

  { id: "st-8", taskId: "t-4", title: "Rascunho do novo headline", done: true, order: 0 },
  { id: "st-9", taskId: "t-4", title: "Revisão com marketing", done: true, order: 1 },
  { id: "st-10", taskId: "t-4", title: "Aprovação final da liderança", done: false, order: 2 },

  { id: "st-11", taskId: "t-9", title: "Levantar métricas de velocidade", done: true, order: 0 },
  { id: "st-12", taskId: "t-9", title: "Montar slides", done: true, order: 1 },
  { id: "st-13", taskId: "t-9", title: "Gravar demo das entregas", done: false, order: 2 },
];

export const mockComments: Comment[] = [
  {
    id: "c-1",
    taskId: "t-1",
    authorId: "u-lider",
    body: "Beatriz, dá pra priorizar a validação do fluxo de recuperação de senha? Ficou pendente da última sprint.",
    createdAt: iso(-1, 9, 0),
  },
  {
    id: "c-2",
    taskId: "t-1",
    authorId: "u-2",
    body: "Consigo sim, devo finalizar até amanhã de manhã. Vou subir os prints aqui.",
    createdAt: iso(-1, 9, 20),
  },
  {
    id: "c-3",
    taskId: "t-4",
    authorId: "u-1",
    body: "Copy nova está no Figma, só falta o ok final antes de subir pro ar.",
    createdAt: iso(-1, 11, 0),
  },
  {
    id: "c-4",
    taskId: "t-9",
    authorId: "u-3",
    body: "Separei os números de deploy da sprint, vou te mandar a planilha.",
    createdAt: iso(0, 8, 30),
  },
];

export const mockActivity: ActivityLogEntry[] = [
  {
    id: "a-1",
    taskId: "t-1",
    actorId: "u-lider",
    action: "CREATED",
    message: "criou a tarefa",
    createdAt: iso(-5),
  },
  {
    id: "a-2",
    taskId: "t-1",
    actorId: "u-2",
    action: "STATUS_CHANGED",
    message: "moveu de A Fazer para Em Andamento",
    createdAt: iso(-3),
  },
  {
    id: "a-3",
    taskId: "t-4",
    actorId: "u-lider",
    action: "DUE_DATE_CHANGED",
    message: "alterou o prazo de 30/08 para ontem",
    createdAt: iso(-2),
  },
  {
    id: "a-4",
    taskId: "t-4",
    actorId: "u-1",
    action: "STATUS_CHANGED",
    message: "moveu de Em Andamento para Revisão",
    createdAt: iso(-1),
  },
  {
    id: "a-5",
    taskId: "t-9",
    actorId: "u-lider",
    action: "ASSIGNED",
    message: "atribuiu a tarefa a Diego Santos",
    createdAt: iso(-3),
  },
];

export function buildInitialState(): AppState {
  return {
    currentUserId: "u-lider",
    users: mockUsers,
    projects: mockProjects,
    tasks: mockTasks,
    subtasks: mockSubtasks,
    comments: mockComments,
    activity: mockActivity,
  };
}
