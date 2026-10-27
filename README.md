# Junto — Planner de Equipe Colaborativo

Aplicação de Planner / Gestão de Tarefas para equipes, com calendário
(mês/semana/dia), Kanban, checklist de subtarefas, comentários por tarefa,
histórico de atividades e um painel de carga de trabalho para líderes.

Este pacote entrega um **frontend totalmente funcional** (React + TypeScript
+ Zustand + Tailwind), rodando com dados mockados persistidos em
`localStorage`, e o **schema de banco de dados** pronto (Prisma) para quando
o backend real for conectado.

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, lucide-react, date-fns
- **Estado:** Zustand (com persistência em `localStorage` via middleware `persist`)
- **Persistência real (proposta):** Prisma ORM + PostgreSQL (`prisma/schema.prisma`)
- **Validação (proposta para API):** Zod — os `NewTaskInput` da store já seguem
  o mesmo formato que um schema Zod validaria na borda da API

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. Não é necessário banco de dados — os dados
iniciais vêm de `src/mock/mockData.ts` e todas as alterações (criar tarefa,
mover status, comentar, etc.) persistem no `localStorage` do navegador.

Para build de produção:

```bash
npm run build
npm run preview
```

## Simulando os dois perfis (RBAC)

No canto superior direito, clique no seletor de usuário para **trocar de
sessão** entre:

- **Marina Costa — Líder/Gestora:** cria projetos, atribui tarefas a
  qualquer colaborador, vê o Painel da Equipe, aprova/move qualquer tarefa.
- **Rafael, Beatriz, Diego, Carla — Colaboradores:** veem apenas suas
  tarefas de equipe + suas tarefas pessoais privadas; podem mover o status
  das próprias tarefas, comentar, fazer checklist e criar tarefas privadas
  no calendário (não aparecem para o time).

A regra de visibilidade (`visibleTasks` em `src/store/useAppStore.ts`) é:
tarefas de equipe (`isPrivate: false`) são visíveis a todos; tarefas
privadas só aparecem para quem as criou.

## Estrutura de pastas

```
src/
  types.ts                 # Modelo de domínio (espelha o schema Prisma)
  mock/mockData.ts         # Usuários, projetos, tarefas (pendentes/atrasadas/concluídas)
  store/useAppStore.ts     # Zustand: única fonte de verdade + regras de negócio + log de atividades
  lib/utils.ts             # Helpers (datas, iniciais, cores de prioridade)
  components/
    Layout/                # Sidebar (navegação + filtros) e Topbar (troca de usuário)
    Calendar/               # CalendarView (orquestrador) + Month/Week/Day views, drag&drop
    Kanban/                 # KanbanBoard com 4 colunas e drag&drop de status
    Task/                   # TaskCard, TaskModal (detalhe), NewTaskModal, SubtaskList,
                             # CommentsThread, ActivityLog
    Dashboard/               # TeamDashboard (carga de trabalho por colaborador)
    ui/primitives.tsx       # Avatar, Badge, Button, Modal, ProgressBar
prisma/schema.prisma       # Modelo relacional completo (Postgres)
```

## Funcionalidades implementadas

- **Planner/Calendário** com visões Mês, Semana e Dia; drag & drop de
  tarefas entre dias (reagenda `startDate`/`dueDate`); indicador visual de
  atraso, prioridade (cor do ponto) e tags.
- **Tarefas:** título, descrição (markdown simples), data de início, prazo
  com hora, prioridade (Baixa/Média/Alta/Urgente), tags, múltiplos
  responsáveis com avatar de iniciais.
- **Subtarefas/Checklist** com barra de progresso em %.
- **Comentários** por tarefa com autor, avatar e timestamp (thread completa,
  simulando tempo real via store reativa).
- **Histórico de atividades**: log de quem mudou status, prazo, prioridade,
  atribuições e itens de checklist.
- **Painel do Líder:** filtro por colaborador (carga de trabalho, tarefas
  atrasadas/ativas/concluídas) e Kanban alternativo (A Fazer, Em Andamento,
  Revisão, Concluído) com drag & drop de status.
- **Tarefas pessoais/privadas:** qualquer colaborador pode criar tarefas
  privadas no próprio calendário, visíveis apenas a ele.

## Conectando um backend real

A store (`useAppStore.ts`) foi desenhada para que cada action (`createTask`,
`updateTaskStatus`, `addComment`, etc.) possa ser trocada por uma chamada de
API/Server Action sem alterar os componentes — eles só conhecem a store via
hooks (`useAppStore((s) => ...)`). Sugestão de evolução:

1. Trocar o array de dados mockados por fetch inicial da API.
2. Cada action da store passa a fazer `await fetch(...)`/Server Action e
   atualizar o estado local de forma otimista.
3. Validar payloads de entrada com Zod (schemas espelhando `NewTaskInput`).
4. Para comentários e atividades em tempo real de verdade entre múltiplos
   usuários simultâneos, adicionar WebSockets (ex. Socket.IO, Pusher, ou
   Server-Sent Events) e invalidar/mesclar o estado da store ao receber
   eventos.
