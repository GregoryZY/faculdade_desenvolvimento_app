# TaskHub — Documentação do Produto
### Planner / Gestão de Tarefas Colaborativo para Equipes

**Versão:** 1.0
**Tipo de documento:** Documentação técnica e de escopo
**Status:** Protótipo funcional (frontend completo, backend especificado)

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Objetivos do Produto](#2-objetivos-do-produto)
3. [Escopo](#3-escopo)
4. [Perfis de Usuário e Permissões (RBAC)](#4-perfis-de-usuário-e-permissões-rbac)
5. [Arquitetura da Solução](#5-arquitetura-da-solução)
6. [Modelo de Dados](#6-modelo-de-dados)
7. [Especificação Funcional](#7-especificação-funcional)
8. [Fluxos de Usuário](#8-fluxos-de-usuário)
9. [Estrutura do Código-Fonte](#9-estrutura-do-código-fonte)
10. [Requisitos Não Funcionais](#10-requisitos-não-funcionais)
11. [Guia de Instalação e Execução](#11-guia-de-instalação-e-execução)
12. [Plano de Evolução para Backend Real](#12-plano-de-evolução-para-backend-real)
13. [Roadmap e Itens Fora de Escopo](#13-roadmap-e-itens-fora-de-escopo)
14. [Glossário](#14-glossário)

---

## 1. Visão Geral

**TaskHub** é uma aplicação web de planejamento e gestão de tarefas voltada para
equipes, que combina três formas de visualização do trabalho — **Calendário
(Planner)**, **Kanban** e **Painel de Equipe** — em um único produto, com
controle de acesso baseado em papéis (RBAC) que diferencia **Líderes/Gestores**
de **Colaboradores**.

O produto resolve um problema comum em equipes pequenas e médias: a dispersão
de informação entre um calendário (prazos), uma ferramenta de kanban (fluxo de
trabalho) e um canal de chat (comentários/decisões). O TaskHub unifica essas três
camadas em torno de uma única entidade central: a **Tarefa**.

Esta entrega corresponde a um **protótipo frontend completo e funcional**
(dados simulados persistidos localmente no navegador) acompanhado da
**especificação completa de backend** (modelo relacional, regras de negócio e
plano de integração), pronto para receber uma API real sem necessidade de
retrabalho na camada de interface.

---

## 2. Objetivos do Produto

| # | Objetivo | Como o produto atende |
|---|---|---|
| O1 | Centralizar prazos da equipe em um calendário visual | Planner com visões Mês/Semana/Dia e drag & drop |
| O2 | Dar visibilidade ao líder sobre a carga de trabalho do time | Painel de Equipe com métricas e carga por colaborador |
| O3 | Permitir acompanhamento de fluxo de trabalho | Kanban com 4 estágios (A Fazer → Em Andamento → Revisão → Concluído) |
| O4 | Viabilizar colaboração e histórico por tarefa | Comentários com autor/timestamp + log de atividades |
| O5 | Respeitar hierarquia de responsabilidade | RBAC (Líder atribui e aprova; Colaborador executa e reporta) |
| O6 | Permitir uso pessoal dentro do mesmo espaço de trabalho | Tarefas privadas, visíveis apenas ao criador |

---

## 3. Escopo

### 3.1 Dentro do escopo (implementado)

- Autenticação simulada por seleção de usuário (troca de sessão via UI, sem senha), para fins de demonstração do RBAC.
- CRUD completo de tarefas (criar, ler, atualizar campos, mudar status, excluir).
- Atribuição de múltiplos responsáveis por tarefa.
- Checklist de subtarefas com barra de progresso percentual.
- Comentários por tarefa (thread simples, autor + timestamp).
- Histórico de atividades por tarefa (log automático de mudanças de status, prazo, prioridade, atribuição e checklist).
- Três visões de calendário: Mês, Semana, Dia.
- Reagendamento de tarefas por arrastar e soltar (drag & drop) no calendário.
- Quadro Kanban com 4 colunas e drag & drop de status.
- Painel do Líder com métricas agregadas e carga de trabalho por colaborador.
- Filtros por colaborador e por projeto.
- Tarefas pessoais/privadas (não atribuíveis, visíveis apenas ao criador).
- Indicadores visuais de prioridade (Baixa/Média/Alta/Urgente) e de atraso (overdue).
- Persistência de dados no `localStorage` do navegador (protótipo autocontido, sem necessidade de servidor).
- Modelo de dados relacional completo, pronto para uso com PostgreSQL (Prisma ORM).

### 3.2 Fora do escopo desta entrega

- Autenticação real (login/senha, OAuth, JWT) e recuperação de senha.
- Persistência em banco de dados real / API HTTP (a especificação existe, a implementação do servidor não).
- Comunicação em tempo real entre múltiplos usuários simultâneos (WebSockets); a "colaboração" hoje é simulada trocando o usuário ativo no mesmo navegador.
- Notificações push, e-mail ou por outros canais.
- Anexos de arquivos em tarefas e comentários.
- Editor rich text/WYSIWYG (a descrição aceita markdown simples, não é renderizado com editor visual).
- Aplicativo mobile nativo (a interface é web responsiva, não um app iOS/Android).
- Múltiplas equipes/organizações (multi-tenant) — o modelo já prevê `Team`, mas a UI assume uma única equipe.
- Relatórios exportáveis (PDF/Excel) e integrações externas (Slack, Jira, Google Calendar etc.).

---

## 4. Perfis de Usuário e Permissões (RBAC)

O sistema define dois papéis (`Role`), aplicados de forma consistente tanto no
modelo de dados quanto na camada de UI (a store centraliza as regras em
`src/store/useAppStore.ts`):

### 4.1 Líder / Gestor (`LEADER`)

| Permissão | Detalhe |
|---|---|
| Criar tarefas de equipe | Sim, com projeto associado |
| Atribuir responsáveis | Pode atribuir a qualquer colaborador, inclusive múltiplos |
| Alterar status/prazo/prioridade de qualquer tarefa de equipe | Sim |
| Ver o Painel de Equipe | Exclusivo do Líder |
| Ver tarefas privadas de outros | Não — apenas as próprias |
| Criar tarefas pessoais | Sim |
| Excluir tarefas | Tarefas que criou ou qualquer tarefa de equipe |

### 4.2 Colaborador / Funcionário (`MEMBER`)

| Permissão | Detalhe |
|---|---|
| Ver tarefas atribuídas a si | Sim |
| Mover status das próprias tarefas | Sim (A Fazer → Em Andamento → Revisão → Concluído) |
| Atribuir responsáveis em tarefas de equipe | Não — campo bloqueado na interface |
| Comentar e atualizar checklist | Sim, em qualquer tarefa visível |
| Criar tarefas pessoais/privadas | Sim, atribuídas automaticamente a si mesmo |
| Ver Painel de Equipe | Não — item de menu oculto |
| Ver tarefas privadas de outros colaboradores | Não |

### 4.3 Regra de visibilidade

```
tarefa visível ao usuário  ⇔  tarefa.isPrivate == false
                            OU tarefa.criadorId == usuário.id
```

Essa regra é aplicada centralmente pela função `visibleTasks()` da store, e
todas as visões (Calendário, Kanban, Dashboard) consomem essa mesma lista
filtrada — garantindo que a regra não possa ser contornada por uma tela
específica.

---

## 5. Arquitetura da Solução

### 5.1 Visão em camadas (estado atual do protótipo)

```
┌──────────────────────────────────────────────────────────┐
│  UI (React + TSX)                                         │
│  Layout · Calendar · Kanban · Task · Dashboard · ui        │
├──────────────────────────────────────────────────────────┤
│  Estado da aplicação (Zustand store)                       │
│  useAppStore.ts — única fonte de verdade                    │
│  regras de negócio, RBAC, log de atividades                │
├──────────────────────────────────────────────────────────┤
│  Persistência local                                         │
│  zustand/middleware persist → localStorage                 │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Visão alvo (com backend real)

```
┌───────────────┐      HTTPS/JSON       ┌────────────────────┐
│   Frontend     │ ───────────────────▶ │  API (Node.js)      │
│  React + TS    │ ◀─────────────────── │  Express/Fastify ou  │
│  (este pacote) │                       │  Next.js Server      │
└───────────────┘                       │  Actions/API Routes  │
                                          ├────────────────────┤
                                          │  Validação: Zod      │
                                          │  ORM: Prisma          │
                                          ├────────────────────┤
                                          │  PostgreSQL           │
                                          └────────────────────┘
                     (opcional, evolução futura)
                          WebSocket / SSE
                     para comentários e atividades
                          em tempo real multiusuário
```

### 5.3 Stack tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Build/Dev server | Vite | Build rápido, HMR, zero-config para React+TS |
| UI | React 18 + TypeScript | Tipagem estática, componentização |
| Estilo | Tailwind CSS | Consistência visual via tokens de design, produtividade |
| Ícones | lucide-react | Ícones leves e consistentes |
| Datas | date-fns | Manipulação de datas sem overhead de moment.js |
| Estado global | Zustand | API mínima, sem boilerplate de Context/Redux, com middleware `persist` pronto |
| Validação (proposta p/ API) | Zod | Schemas reaproveitáveis entre validação de formulário e API |
| ORM (proposta) | Prisma | Migrations tipadas, schema legível, gera client type-safe |
| Banco de dados (proposta) | PostgreSQL | Suporte a arrays nativos (tags), robustez para produção |

---

## 6. Modelo de Dados

O modelo relacional completo está em `prisma/schema.prisma`. Resumo das
entidades e relacionamentos:

### 6.1 Entidades

| Entidade | Descrição |
|---|---|
| `Team` | Equipe/organização (suporte a multi-tenant futuro) |
| `User` | Usuário, pertence a um `Team`, possui um `Role` (`LEADER`/`MEMBER`) |
| `Project` | Agrupador de tarefas, pertence a um `Team` |
| `Task` | Entidade central: título, descrição, status, prioridade, tags, datas, criador |
| `TaskAssignment` | Tabela de junção N:N entre `Task` e `User` (múltiplos responsáveis) |
| `Subtask` | Item de checklist, pertence a uma `Task` |
| `Comment` | Comentário de um `User` em uma `Task` |
| `ActivityLog` | Log imutável de eventos ocorridos em uma `Task` |

### 6.2 Diagrama de relacionamento (simplificado)

```
Team 1───N User
Team 1───N Project

Project 1───N Task
User    1───N Task            (creator)
User    N───N Task            (via TaskAssignment)
Task    1───N Subtask
Task    1───N Comment ────── N:1 User (author)
Task    1───N ActivityLog ── N:1 User (actor)
```

### 6.3 Enumerações

- **Role:** `LEADER`, `MEMBER`
- **TaskStatus:** `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`
- **TaskPriority:** `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **ActivityAction:** `CREATED`, `STATUS_CHANGED`, `DUE_DATE_CHANGED`, `ASSIGNED`, `UNASSIGNED`, `PRIORITY_CHANGED`, `COMMENTED`, `SUBTASK_TOGGLED`

### 6.4 Regras de integridade relevantes

- `TaskAssignment` possui unicidade composta `(taskId, userId)` — um usuário não pode ser atribuído duas vezes à mesma tarefa.
- Exclusão de `Task` propaga (`onDelete: Cascade`) para `TaskAssignment`, `Subtask`, `Comment` e `ActivityLog`.
- `Task.tags` é um array nativo do PostgreSQL; em uma migração para SQLite, deve ser normalizado em uma tabela `Tag` N:N.

---

## 7. Especificação Funcional

### 7.1 Gerenciamento de Tarefas

**Campos da tarefa:**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Título | texto curto | Sim | — |
| Descrição | texto longo (markdown simples) | Não | Não possui editor WYSIWYG |
| Data de início | data | Sim | Usada para reagendamento no calendário |
| Data de entrega (due date) | data + hora | Sim | Usada para ordenar e detectar atraso |
| Prioridade | enum | Sim | Baixa / Média / Alta / Urgente, com cor associada |
| Etiquetas (tags) | lista de texto | Não | Entrada livre, separadas por vírgula na criação |
| Responsáveis | lista de usuários | Condicional | Obrigatório apenas para tarefas de equipe; tarefa privada é sempre atribuída ao criador |
| Projeto | referência | Condicional | Não se aplica a tarefas privadas |
| Privada | booleano | Sim | Define a regra de visibilidade |

**Indicador de atraso (overdue):** uma tarefa é considerada atrasada quando
`dueDate < agora` **e** `status ≠ DONE`. O indicador é recalculado em tempo
real na renderização, não é um campo persistido.

### 7.2 Subtarefas / Checklist

- Lista ordenável de itens com título e estado `done` (booleano).
- Progresso exibido como porcentagem: `concluídos / total × 100`, arredondado.
- Adicionar, concluir/reabrir e remover itens são ações imediatas, cada uma
  gera uma entrada correspondente no histórico (apenas ao concluir/reabrir).

### 7.3 Comentários

- Qualquer usuário com visibilidade sobre a tarefa pode comentar.
- Cada comentário registra `autor`, `corpo do texto` e `timestamp` (ISO 8601).
- Não há edição ou exclusão de comentários nesta versão (ver Roadmap).
- Envio por clique no botão ou tecla Enter (Shift+Enter insere quebra de linha).

### 7.4 Histórico de Atividades

Log somente-leitura, gerado automaticamente pela store a cada uma das
seguintes ações, sem intervenção manual do usuário:

| Ação | Gatilho |
|---|---|
| `CREATED` | Tarefa criada |
| `STATUS_CHANGED` | Mudança de coluna no Kanban ou no seletor de status do modal |
| `DUE_DATE_CHANGED` | Reagendamento (drag & drop ou edição manual de data) |
| `PRIORITY_CHANGED` | Alteração do campo prioridade |
| `ASSIGNED` | Alteração da lista de responsáveis |
| `COMMENTED` | Novo comentário adicionado |
| `SUBTASK_TOGGLED` | Item de checklist marcado/desmarcado |

### 7.5 Calendário / Planner

| Visão | Comportamento |
|---|---|
| **Mês** | Grade de 6 semanas x 7 dias; até 3 tarefas exibidas por dia + contador "+N mais"; drag & drop entre dias |
| **Semana** | 7 colunas (uma por dia), todas as tarefas do dia listadas verticalmente; drag & drop entre colunas |
| **Dia** | Lista agenda de todas as tarefas com prazo naquele dia, ordenadas por horário |

Em qualquer visão, o botão "+" sobre um dia abre o modal de criação de tarefa
já com a data pré-preenchida (quick add).

### 7.6 Kanban

- 4 colunas fixas, correspondentes ao `TaskStatus`: A Fazer, Em Andamento, Revisão, Concluído.
- Cartões podem ser arrastados entre colunas; isso atualiza o `status` da tarefa e gera entrada no histórico.
- Contador de tarefas por coluna exibido no cabeçalho.

### 7.7 Painel do Líder (Dashboard)

- Visível apenas para `LEADER`.
- Métricas agregadas: total de tarefas de equipe, em andamento, atrasadas, concluídas.
- Cartão por colaborador com: avatar, cargo, tarefas ativas, atrasadas e concluídas, barra de carga relativa (normalizada pelo colaborador com mais tarefas ativas) e atalho para abrir cada tarefa.

### 7.8 Filtros

- Por colaborador (barra lateral): restringe qualquer visão às tarefas em que o usuário selecionado é responsável.
- Por projeto (barra lateral): restringe às tarefas do projeto selecionado.
- Filtros são combináveis e persistem apenas durante a sessão (não são salvos).

---

## 8. Fluxos de Usuário

### 8.1 Líder cria e atribui uma tarefa

1. Líder clica em "Nova tarefa" (calendário, ou "+" em um dia específico).
2. Preenche título, descrição, prioridade, data/hora, etiquetas.
3. Seleciona projeto e um ou mais responsáveis.
4. Confirma a criação → tarefa aparece no calendário e no Kanban (coluna "A Fazer") de todos os responsáveis.
5. Sistema registra `CREATED` no histórico da tarefa.

### 8.2 Colaborador executa e atualiza uma tarefa

1. Colaborador abre a tarefa (calendário, Kanban ou busca visual).
2. Move o status arrastando o cartão no Kanban, ou pelo seletor no modal.
3. Marca itens do checklist conforme avança.
4. Adiciona comentário relatando um bloqueio ou dúvida.
5. Líder (em outra sessão/usuário) vê o comentário e o progresso do checklist e responde.

### 8.3 Colaborador cria tarefa pessoal

1. Colaborador clica em "Nova tarefa".
2. Marca a opção "Tarefa pessoal (privada)".
3. Campos de projeto e responsáveis somem do formulário (atribuição automática a si mesmo).
4. Tarefa aparece apenas no calendário desse colaborador; não é atribuível por outros.

### 8.4 Líder consulta carga de trabalho

1. Líder acessa "Painel da equipe" na barra lateral.
2. Visualiza métricas gerais e a lista de colaboradores ordenada por carga.
3. Clica em uma tarefa listada no cartão de um colaborador para abrir o detalhe e intervir (redistribuir, comentar, alterar prazo).

---

## 9. Estrutura do Código-Fonte

```
planner-app/
├── prisma/
│   └── schema.prisma          # Modelo relacional completo
├── src/
│   ├── types.ts                # Modelo de domínio (espelha o schema Prisma)
│   ├── lib/
│   │   └── utils.ts            # Helpers: datas, iniciais, cores por prioridade, cn()
│   ├── mock/
│   │   └── mockData.ts         # Dataset inicial (5 usuários, 10 tarefas, comentários, atividades)
│   ├── store/
│   │   └── useAppStore.ts      # Zustand: estado global, regras de negócio, RBAC, log
│   ├── components/
│   │   ├── ui/primitives.tsx   # Avatar, AvatarStack, Badge, Button, Modal, ProgressBar
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx     # Navegação + filtros
│   │   │   └── Topbar.tsx      # Cabeçalho + seletor de usuário (simula login)
│   │   ├── Calendar/
│   │   │   ├── CalendarView.tsx  # Orquestrador (navegação, troca de visão)
│   │   │   ├── MonthView.tsx
│   │   │   ├── WeekView.tsx
│   │   │   └── DayView.tsx
│   │   ├── Kanban/
│   │   │   └── KanbanBoard.tsx
│   │   ├── Task/
│   │   │   ├── TaskCard.tsx        # Cartão usado no calendário e no Kanban
│   │   │   ├── TaskModal.tsx       # Detalhe/edição com abas
│   │   │   ├── NewTaskModal.tsx    # Formulário de criação
│   │   │   ├── SubtaskList.tsx     # Checklist
│   │   │   ├── CommentsThread.tsx  # Thread de comentários
│   │   │   └── ActivityLog.tsx     # Histórico
│   │   └── Dashboard/
│   │       └── TeamDashboard.tsx   # Painel do líder
│   ├── App.tsx                  # Composição raiz, estado de navegação/filtros/modais
│   └── main.tsx                 # Bootstrap React
├── package.json
├── tailwind.config.js            # Tokens de design (cores, tipografia, raios)
├── vite.config.ts
└── README.md
```

**Princípio de arquitetura de componentes:** nenhum componente de UI acessa
`localStorage` ou implementa regra de negócio diretamente — toda leitura e
mutação de dados passa pela store (`useAppStore`), que é o único ponto de
verdade e o único lugar onde o RBAC é decidido. Isso torna a futura troca de
"mock + localStorage" por "API real" uma mudança isolada dentro do arquivo da
store, sem tocar nos componentes.

---

## 10. Requisitos Não Funcionais

| Categoria | Requisito |
|---|---|
| Responsividade | Layout adaptável (grid de colunas do Kanban colapsa em telas menores; sidebar fixa pensada para desktop) |
| Acessibilidade | Estados de foco visíveis (`:focus-visible`), rótulos `aria-label` em botões de ícone, `prefers-reduced-motion` respeitado |
| Desempenho | Bundle de produção único (~232 KB JS / ~70 KB gzip), build via Vite |
| Persistência | Dados sobrevivem a reload de página via `localStorage`; não sobrevivem à troca de navegador/dispositivo (limitação conhecida do protótipo) |
| Tipagem | 100% TypeScript, `strict: true`, sem erros em `tsc -b` |
| Internacionalização | Interface e formatação de datas em `pt-BR`; não há suporte a múltiplos idiomas nesta versão |
| Portabilidade | Roda em qualquer navegador moderno, sem dependência de backend para demonstração |

---

## 11. Guia de Instalação e Execução

```bash
# instalar dependências
npm install

# ambiente de desenvolvimento (http://localhost:5173)
npm run dev

# build de produção
npm run build
npm run preview

# quando o backend com Prisma for implementado:
cp .env.example .env      # configurar DATABASE_URL
npm run prisma:generate
npm run prisma:migrate
```

Nenhum banco de dados é necessário para avaliar o protótipo: o estado inicial
vem de `src/mock/mockData.ts` e todas as interações ficam salvas no
`localStorage` do navegador utilizado.

---

## 12. Plano de Evolução para Backend Real

A store foi desenhada para que cada método (`createTask`, `updateTaskStatus`,
`addComment`, `toggleSubtask` etc.) possa ser substituído por uma chamada de
rede, sem alterar nenhum componente de UI, pois eles somente consomem hooks
da store. Passos recomendados:

1. **Autenticação:** implementar login (e-mail/senha ou SSO) e emissão de
   sessão/JWT; substituir o seletor de usuário do Topbar por dados da sessão real.
2. **API:** expor endpoints REST (ou Server Actions do Next.js) espelhando os
   métodos da store — ex. `POST /tasks`, `PATCH /tasks/:id/status`,
   `POST /tasks/:id/comments`.
3. **Validação:** aplicar schemas Zod nos payloads de entrada, reaproveitando
   os tipos já definidos em `src/types.ts`.
4. **Persistência:** trocar o array em memória por consultas Prisma sobre
   PostgreSQL, usando o schema já entregue em `prisma/schema.prisma`.
5. **Tempo real:** para colaboração simultânea entre usuários diferentes
   (hoje simulada trocando o usuário no mesmo navegador), adicionar
   WebSockets ou Server-Sent Events e mesclar eventos recebidos ao estado da
   store.
6. **Autorização no servidor:** replicar as mesmas regras de RBAC hoje
   aplicadas no cliente (`visibleTasks`, `canAssign`) como middleware de API,
   já que a validação client-side nunca deve ser a única camada de segurança.

---

## 13. Roadmap e Itens Fora de Escopo

Itens identificados como evolução natural do produto, não implementados
nesta versão:

- Edição e exclusão de comentários.
- Anexos de arquivos em tarefas e comentários.
- Notificações (in-app, e-mail, push) de atribuição e prazos próximos.
- Aprovação formal de entregas pelo líder (fluxo de "solicitar revisão" → "aprovar/reprovar").
- Múltiplos times/organizações na mesma instância (multi-tenant).
- Relatórios e exportação (CSV, PDF) de métricas do Painel de Equipe.
- Busca textual global de tarefas.
- Editor de texto rico (WYSIWYG) para a descrição da tarefa.
- Aplicativo mobile nativo.

---

## 14. Glossário

| Termo | Definição |
|---|---|
| RBAC | Role-Based Access Control — controle de acesso baseado em papéis (Líder/Colaborador) |
| Overdue | Estado de uma tarefa cujo prazo já passou e que ainda não foi concluída |
| Kanban | Quadro visual de fluxo de trabalho organizado em colunas por status |
| Subtarefa/Checklist | Item de verificação dentro de uma tarefa, usado para medir progresso |
| Tarefa privada | Tarefa pessoal, visível apenas ao seu criador, não atribuível a outros |
| Store | Estado global centralizado da aplicação (Zustand), única fonte de verdade dos dados |
| Quick add | Ação de criar uma tarefa diretamente a partir de um dia do calendário, com a data pré-preenchida |
