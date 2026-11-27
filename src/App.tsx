import React, { useEffect, useMemo, useState } from "react";
import Sidebar, { ViewKey } from "@/components/Layout/Sidebar";
import Topbar from "@/components/Layout/Topbar";
import CalendarView from "@/components/Calendar/CalendarView";
import KanbanBoard from "@/components/Kanban/KanbanBoard";
import TeamDashboard from "@/components/Dashboard/TeamDashboard";
import ProjectsPanel from "@/components/Admin/ProjectsPanel";
import TaskModal from "@/components/Task/TaskModal";
import NewTaskModal from "@/components/Task/NewTaskModal";
import LoginScreen from "@/components/Auth/LoginScreen";
import { Button } from "@/components/ui/primitives";
import { useAppStore } from "@/store/useAppStore";
import { toDateKey } from "@/lib/utils";
import { Plus, FolderPlus } from "lucide-react";

export default function App() {
  const [view, setView] = useState<ViewKey>("calendar");
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState<string | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  const initialized = useAppStore((s) => s.initialized);
  const init = useAppStore((s) => s.init);
  const authed = useAppStore((s) => s.authed);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const users = useAppStore((s) => s.users);
  const allProjects = useAppStore((s) => s.projects);
  const memberships = useAppStore((s) => s.memberships);
  const visibleTasks = useAppStore((s) => s.visibleTasks());
  const managesAny = useAppStore((s) => s.managedProjectIds().length > 0);

  useEffect(() => {
    init();
  }, [init]);

  const myProjectIds = useMemo(
    () => memberships.filter((m) => m.userId === currentUserId).map((m) => m.projectId),
    [memberships, currentUserId]
  );
  const hasProjects = allProjects.some((p) => myProjectIds.includes(p.id));

  // Ao sair (ou trocar de usuário), limpa a navegação para não vazar telas do perfil anterior.
  useEffect(() => {
    setOpenTaskId(null);
    setNewTaskOpen(false);
    setMenuOpen(false);
    setView("calendar");
    setFilterAssignee(null);
    setFilterProject(null);
  }, [authed, currentUserId]);

  // O painel da equipe só existe para quem é líder/co-líder de algum projeto.
  useEffect(() => {
    if (view === "dashboard" && !managesAny) setView("calendar");
  }, [view, managesAny]);

  // Se o projeto/pessoa filtrado deixou de existir (ou de ser acessível), limpa o filtro.
  useEffect(() => {
    if (filterProject && !myProjectIds.includes(filterProject)) setFilterProject(null);
    if (filterAssignee && !users.some((u) => u.id === filterAssignee)) setFilterAssignee(null);
  }, [myProjectIds, users, filterProject, filterAssignee]);

  // Se a tarefa aberta sumiu (ex.: removida do projeto), fecha o modal.
  useEffect(() => {
    if (openTaskId && !visibleTasks.some((t) => t.id === openTaskId)) setOpenTaskId(null);
  }, [visibleTasks, openTaskId]);

  const filteredTasks = useMemo(() => {
    return visibleTasks.filter((t) => {
      if (filterAssignee && !t.assigneeIds.includes(filterAssignee)) return false;
      if (filterProject && t.projectId !== filterProject) return false;
      return true;
    });
  }, [visibleTasks, filterAssignee, filterProject]);

  function openQuickAdd(dateKey: string) {
    setNewTaskDate(dateKey);
    setNewTaskOpen(true);
  }

  // Returns condicionais sempre DEPOIS de todos os hooks
  if (!initialized) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-paper p-8 text-sm text-slate-500">Carregando dados...</div>;
  }

  if (!authed) return <LoginScreen />;

  const showEmpty = !hasProjects && view !== "projects";

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-paper">
      <Sidebar
        view={view}
        onViewChange={setView}
        filterAssignee={filterAssignee}
        onFilterAssignee={setFilterAssignee}
        filterProject={filterProject}
        onFilterProject={setFilterProject}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMenuOpen(true)} />

        <main className="min-h-0 flex-1 overflow-y-auto p-3 pb-24 sm:p-6 sm:pb-6">
          {view === "projects" && <ProjectsPanel />}

          {showEmpty && (
            <div className="mx-auto mt-10 max-w-md space-y-3 rounded-panel border border-slate-100 bg-white p-6 text-center shadow-card">
              <h2 className="font-display text-lg font-semibold text-ink">Você ainda não tem projetos</h2>
              <p className="text-sm text-slate-500">
                Crie um projeto para organizar tarefas (você será o líder dele) ou peça ao líder de um projeto para
                adicionar você pelo e-mail da sua conta.
              </p>
              <Button onClick={() => setView("projects")}>
                <FolderPlus size={15} /> Criar meu primeiro projeto
              </Button>
            </div>
          )}

          {!showEmpty && view === "calendar" && (
            <CalendarView tasks={filteredTasks} onOpenTask={setOpenTaskId} onQuickAdd={openQuickAdd} />
          )}
          {!showEmpty && view === "kanban" && (
            <KanbanBoard tasks={filteredTasks} onOpenTask={setOpenTaskId} onQuickAdd={openQuickAdd} />
          )}
          {!showEmpty && view === "dashboard" && managesAny && (
            <TeamDashboard onOpenTask={setOpenTaskId} projectId={filterProject} />
          )}
        </main>
      </div>

      {/* Botão flutuante: criar tarefa rapidamente no celular (Kanban) */}
      {view === "kanban" && hasProjects && (
        <button
          onClick={() => openQuickAdd(toDateKey(new Date()))}
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-pine-500 text-white shadow-pop hover:bg-pine-600 sm:hidden"
          aria-label="Nova tarefa"
        >
          <Plus size={24} />
        </button>
      )}

      {openTaskId && <TaskModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />}
      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        defaultDate={newTaskDate}
        defaultProjectId={filterProject}
      />
    </div>
  );
}