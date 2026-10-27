import React, { useMemo, useState } from "react";
import Sidebar, { ViewKey } from "@/components/Layout/Sidebar";
import Topbar from "@/components/Layout/Topbar";
import CalendarView from "@/components/Calendar/CalendarView";
import KanbanBoard from "@/components/Kanban/KanbanBoard";
import TeamDashboard from "@/components/Dashboard/TeamDashboard";
import TaskModal from "@/components/Task/TaskModal";
import NewTaskModal from "@/components/Task/NewTaskModal";
import { useAppStore } from "@/store/useAppStore";

export default function App() {
  const [view, setView] = useState<ViewKey>("calendar");
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState<string | undefined>(undefined);

  const visibleTasks = useAppStore((s) => s.visibleTasks());

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

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <Sidebar
        view={view}
        onViewChange={setView}
        filterAssignee={filterAssignee}
        onFilterAssignee={setFilterAssignee}
        filterProject={filterProject}
        onFilterProject={setFilterProject}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          {view === "calendar" && (
            <CalendarView tasks={filteredTasks} onOpenTask={setOpenTaskId} onQuickAdd={openQuickAdd} />
          )}
          {view === "kanban" && <KanbanBoard tasks={filteredTasks} onOpenTask={setOpenTaskId} />}
          {view === "dashboard" && <TeamDashboard onOpenTask={setOpenTaskId} />}
        </main>
      </div>

      {openTaskId && <TaskModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />}
      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        defaultDate={newTaskDate}
      />
    </div>
  );
}
