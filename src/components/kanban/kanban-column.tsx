import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./kanban-card"
import { Task } from "./kanban-board"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface KanbanColumnProps {
  id: string
  title: string
  tasks: Task[]
  color: string
  onTaskClick?: (taskId: string) => void
}

export function KanbanColumn({ id, title, tasks, color, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const getColumnHeaderClass = () => {
    return `bg-${color} text-white`
  }

  const getColumnClass = () => {
    const baseClass = "flex flex-col w-80 rounded-lg border transition-all duration-200"
    if (isOver) {
      return `${baseClass} border-primary/50 bg-accent/30 scale-[1.02]`
    }
    return `${baseClass} border-border bg-card shadow-sm`
  }

  return (
    <div className={getColumnClass()}>
      <div className={`p-4 rounded-t-lg ${getColumnHeaderClass()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{title}</h3>
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
              {tasks.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0 hover:bg-white/20 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 p-4 space-y-3 min-h-40"
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma tarefa nesta coluna</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Adicionar tarefa
            </Button>
          </div>
        ) : (
          <>
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} onTaskClick={onTaskClick} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}