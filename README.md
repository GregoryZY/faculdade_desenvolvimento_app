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

## Contas, projetos e papéis (RBAC por projeto)

**Cadastro e login.** A tela inicial tem as abas *Entrar* e *Criar conta*
(nome, e-mail, senha). Contas de exemplo (senha `123456`) estão em atalhos na
aba *Entrar*. **Sair** fica no menu do usuário (canto superior direito).

**Projetos.** Qualquer pessoa pode criar projetos em *Projetos e membros*; quem
cria vira o **líder** daquele projeto. Toda tarefa pertence a um projeto. Os
papéis são **por projeto**: a mesma pessoa pode ser líder num e colaboradora em
outro (veja as contas de exemplo).

**Membros.** O líder adiciona pessoas pelo **e-mail da conta** (ela precisa ter
se cadastrado antes), escolhe se entram como co-líder ou colaborador, pode
mudar o papel depois e remover membros. Quem não é líder pode **sair** do
projeto.

| | Líder | Co-líder | Colaborador |
|---|---|---|---|
| Ver o projeto e todas as suas tarefas | sim | sim | sim |
| Criar tarefa **para outros** (delegar) | sim | sim | não |
| Criar tarefa para si mesmo | sim | sim | sim |
| Editar / reagendar / excluir tarefas | todas | todas | só as que ele criou |
| Atribuir responsáveis | sim | sim | não |
| Mudar status e usar checklist | todas | todas | só as atribuídas a ele (ou criadas por ele) |
| Comentar | sim | sim | sim |
| Painel da equipe e filtro por responsável | sim | sim | não |
| Adicionar/remover membros e mudar papéis | sim | não | não |
| Excluir o projeto | sim | não | não |

As regras ficam em `src/lib/permissions.ts` e são aplicadas **na store**
(`useAppStore.ts`), não só na interface: mesmo que um botão apareça por engano,
a ação é bloqueada. Quando o backend existir, as mesmas regras devem ser
repetidas no servidor.

Ao **remover alguém de um projeto** (ou quando a pessoa sai), ela deixa de ser
responsável pelas tarefas (que continuam existindo) e as tarefas que ela criou
passam para o líder. Ao **excluir um projeto**, suas tarefas, checklists e
comentários são excluídos para todos.

> **Atenção:** o login é de demonstração (senha guardada no front, dados em
> `localStorage`). Os dados ficam **no navegador de quem usa** — não são
> compartilhados entre aparelhos nem entre contas de pessoas diferentes. Para
> isso é preciso o backend (ver abaixo; o `prisma/schema.prisma` já está no
> modelo de papéis por projeto). Se você tinha dados salvos de uma versão
> anterior, eles são descartados na primeira abertura (o formato mudou) e o app
> recomeça com os dados de exemplo.

## Uso no celular

Layout responsivo: menu lateral vira gaveta (botão ☰), o calendário mensal
mostra bolinhas por dia com a lista do dia selecionado logo abaixo, a semana
empilha os dias e o Kanban rola na horizontal. O arrastar-e-soltar não
funciona em telas de toque: no celular, mude status e prazo pelo detalhe da
tarefa.

## Estrutura de pastas

```
src/
  types.ts                 # Modelo de domínio (espelha o schema Prisma)
  mock/mockData.ts         # Usuários, projetos, tarefas (pendentes/atrasadas/concluídas)
  store/useAppStore.ts     # Zustand: única fonte de verdade + regras de negócio + log de atividades
  lib/utils.ts             # Helpers (datas, iniciais, cores de prioridade)
  lib/permissions.ts       # Regras de acesso por papel no projeto (usadas pela store e pela UI)
  components/
    Auth/                  # LoginScreen
    Admin/                 # ProjectsPanel (criar projetos, gerir membros e papéis)
    Layout/                # Sidebar (gaveta no celular + filtros) e Topbar (menu do usuário / sair)
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
- **Painel da equipe** (líder e co-líder): carga de trabalho por pessoa nos
  projetos que gerencia (tarefas atrasadas/ativas/concluídas); e **Kanban**
  (A Fazer, Em Andamento, Revisão, Concluído) com drag & drop de status.
- **Cadastro/login, projetos e papéis por projeto** (líder, co-líder e
  colaborador), conforme a seção acima.

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
