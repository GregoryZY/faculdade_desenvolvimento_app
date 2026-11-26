// Regras de acesso (RBAC) POR PROJETO, centralizadas.
// A store usa estas funções para BLOQUEAR ações e os componentes usam as mesmas
// funções para decidir o que mostrar — assim UI e regra nunca divergem.
//
// "role" é o papel da pessoa no projeto da tarefa (null = não participa do projeto).
//
//                                   Líder   Co-líder   Colaborador
//  ver o projeto e suas tarefas       ✔        ✔          ✔
//  criar tarefa para outros           ✔        ✔          ✘
//  criar tarefa para si mesmo         ✔        ✔          ✔
//  editar/excluir/reagendar           ✔ todas  ✔ todas    só as que criou
//  atribuir responsáveis              ✔        ✔          ✘
//  mudar status / checklist           ✔        ✔          só as suas (atribuídas ou criadas)
//  comentar                           ✔        ✔          ✔
//  gerir membros e papéis             ✔        ✘          ✘
//  excluir o projeto                  ✔        ✘          ✘
import { Membership, ProjectRole, Task } from "@/types";

type Role = ProjectRole | null;

export function roleIn(memberships: Membership[], projectId: string, userId: string): Role {
  return memberships.find((m) => m.projectId === projectId && m.userId === userId)?.role ?? null;
}

/** Líder ou co-líder: quem gere as tarefas do projeto. */
export const isManager = (r: Role) => r === "LEADER" || r === "CO_LEADER";

export const canManageMembers = (r: Role) => r === "LEADER";
export const canDeleteProject = (r: Role) => r === "LEADER";

/** Criar tarefa no projeto (colaborador só para si mesmo). */
export const canCreateTask = (r: Role) => r !== null;

/** Escolher outros responsáveis ao criar/editar. */
export const canAssignTask = (r: Role) => isManager(r);

export function canEditTask(r: Role, t: Task, userId: string): boolean {
  return isManager(r) || (r !== null && t.creatorId === userId);
}

export function canChangeStatus(r: Role, t: Task, userId: string): boolean {
  return canEditTask(r, t, userId) || (r !== null && t.assigneeIds.includes(userId));
}

export const canComment = (r: Role) => r !== null;
