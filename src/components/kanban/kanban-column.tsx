import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";
import { Task } from "./kanban-board";
import { Plus, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  savingTasks: Set<string>;
  allCompact?: boolean;
  onToggleCompact?: () => void;
  onTaskApprove?: (taskId: string) => Promise<void>;
}
export function KanbanColumn({
  id,
  title,
  tasks,
  color,
  savingTasks,
  allCompact,
  onToggleCompact,
  onTaskApprove
}: KanbanColumnProps) {
  // Use allCompact prop directly as the source of truth
  const effectiveCompact = allCompact || false;
  const {
    setNodeRef,
    isOver
  } = useDroppable({
    id
  });
  const getColumnHeaderClass = () => {
    return `bg-${color} text-white`;
  };
  const getColumnClass = () => {
    const baseClass = "flex flex-col flex-1 min-w-0 rounded-lg border transition-all duration-200";
    if (isOver) {
      return `${baseClass} border-primary/50 bg-accent/30 scale-[1.02]`;
    }
    return `${baseClass} border-border bg-card shadow-sm`;
  };
  return <div className={getColumnClass()}>
      <div className={`p-3 rounded-t-lg ${getColumnHeaderClass()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white dark:text-slate-800">{title}</h3>
            <span className="bg-white/20 text-white dark:text-slate-800 text-xs px-2 py-1 rounded-full">
              {tasks.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white dark:text-slate-800 hover:bg-white/20"
            onClick={onToggleCompact}
            title={effectiveCompact ? "Expandir todos" : "Retrair todos"}
          >
            {effectiveCompact ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 p-2 space-y-2 overflow-y-auto min-h-0">
        {tasks.length === 0 ? <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma tarefa nesta coluna</p>
            
          </div> : <>
            {tasks.map(task => <KanbanCard key={task.id} task={task} isSaving={savingTasks.has(task.id)} isCompact={effectiveCompact} onApprove={onTaskApprove} />)}
          </>}
      </div>
    </div>;
}