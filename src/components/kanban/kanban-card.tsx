import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Task } from "./kanban-board"
import { Calendar, User, AlertCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getDateStatus, formatDate } from "@/utils/date-utils"

interface KanbanCardProps {
  task: Task
  isDragging?: boolean
  onTaskClick?: (taskId: string) => void
}

export function KanbanCard({ task, isDragging = false, onTaskClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "alta":
        return "bg-priority-high text-white"
      case "urgente":
        return "bg-red-500 text-white"
      case "media":
        return "bg-priority-medium text-white"
      case "baixa":
        return "bg-priority-low text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityIcon = (priority: Task["priority"]) => {
    switch (priority) {
      case "alta":
      case "urgente":
        return <AlertCircle className="w-3 h-3" />
      case "media":
      case "baixa":
        return <Clock className="w-3 h-3" />
      default:
        return null
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging and onTaskClick is provided
    if (!isDragging && !isSortableDragging && onTaskClick) {
      e.stopPropagation()
      onTaskClick(task.id)
    }
  }

  const dateStatus = getDateStatus(task.dueDate)

  const cardClass = `
    p-4 bg-card border border-card-border rounded-lg shadow-sm cursor-grab 
    hover:shadow-md transition-all duration-200 select-none
    ${onTaskClick ? 'hover:cursor-pointer' : ''}
    ${isDragging || isSortableDragging ? 'opacity-50 rotate-2 scale-105 shadow-lg' : ''}
    ${isDragging ? 'cursor-grabbing' : ''}
  `

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClass}
      {...attributes}
      {...listeners}
      onClick={handleClick}
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <h4 className="font-medium text-card-foreground text-sm leading-tight">
            {task.title}
          </h4>
          <div className="flex items-center gap-1">
            <Badge 
              variant="secondary" 
              className={`text-xs ${task.teamColor} text-white border-0 px-2 py-1`}
            >
              {task.team}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`text-xs ${getPriorityColor(task.priority)} border-0 flex items-center gap-1`}
            >
              {getPriorityIcon(task.priority)}
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {task.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{task.assignee}</span>
          </div>
          
          <div className={`flex items-center gap-1 text-xs ${dateStatus.className}`}>
            <Calendar className="w-3 h-3" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}