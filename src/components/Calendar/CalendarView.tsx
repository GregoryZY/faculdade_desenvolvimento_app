import React, { useMemo, useState } from "react";
import { addDays, addMonths, addWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Task } from "@/types";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import { Button } from "@/components/ui/primitives";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

interface Props {
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onQuickAdd: (dateKey: string) => void;
}

export default function CalendarView({ tasks, onOpenTask, onQuickAdd }: Props) {
  const [mode, setMode] = useState<ViewMode>("month");
  const [refDate, setRefDate] = useState(new Date());

  const title = useMemo(() => {
    if (mode === "month") return format(refDate, "MMMM yyyy", { locale: ptBR });
    if (mode === "week") return `Semana de ${format(refDate, "d MMM", { locale: ptBR })}`;
    return format(refDate, "d 'de' MMMM, yyyy", { locale: ptBR });
  }, [mode, refDate]);

  function goPrev() {
    setRefDate((d) => (mode === "month" ? addMonths(d, -1) : mode === "week" ? addWeeks(d, -1) : addDays(d, -1)));
  }
  function goNext() {
    setRefDate((d) => (mode === "month" ? addMonths(d, 1) : mode === "week" ? addWeeks(d, 1) : addDays(d, 1)));
  }
  function goToday() {
    setRefDate(new Date());
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="rounded-card border border-slate-300 p-1.5 hover:bg-slate-100" aria-label="Anterior">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goNext} className="rounded-card border border-slate-300 p-1.5 hover:bg-slate-100" aria-label="Próximo">
            <ChevronRight size={16} />
          </button>
          <Button variant="secondary" onClick={goToday} className="ml-1">
            Hoje
          </Button>
          <h2 className="ml-2 font-display text-lg font-semibold capitalize text-ink">{title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-card border border-slate-300 p-0.5">
            {(["month", "week", "day"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-[7px] px-3 py-1 text-sm font-medium transition-colors",
                  mode === m ? "bg-pine-500 text-white" : "text-ink-soft hover:bg-slate-100"
                )}
              >
                {m === "month" ? "Mês" : m === "week" ? "Semana" : "Dia"}
              </button>
            ))}
          </div>
          <Button onClick={() => onQuickAdd(format(refDate, "yyyy-MM-dd"))}>
            <Plus size={15} /> Nova tarefa
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {mode === "month" && <MonthView refDate={refDate} tasks={tasks} onOpenTask={onOpenTask} onQuickAdd={onQuickAdd} />}
        {mode === "week" && <WeekView refDate={refDate} tasks={tasks} onOpenTask={onOpenTask} onQuickAdd={onQuickAdd} />}
        {mode === "day" && <DayView refDate={refDate} tasks={tasks} onOpenTask={onOpenTask} onQuickAdd={onQuickAdd} />}
      </div>
    </div>
  );
}
