import { useState, useMemo } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { KanbanFilters, FilterState } from "./kanban-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { isOverdue } from "@/utils/date-utils"

export interface Task {
  id: string
  title: string
  description: string
  priority: "alta" | "media" | "baixa"
  dueDate: string
  assignee: string
  team: string
  teamColor: string
  status: "criada" | "assumida" | "executando" | "concluida" | "validada"
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Organizar reunião de vendas",
    description: "Preparar agenda e convidar equipe para reunião semanal de vendas",
    priority: "alta",
    dueDate: "2025-01-20",
    assignee: "Sergio Ricardo",
    team: "Vendas",
    teamColor: "bg-blue-500",
    status: "criada"
  },
  {
    id: "2",
    title: "Revisar proposta comercial",
    description: "Analisar e revisar proposta para o cliente ABC Ltda",
    priority: "media",
    dueDate: "2025-01-25",
    assignee: "Sergio Ricardo",
    team: "Comercial",
    teamColor: "bg-green-500",
    status: "executando"
  },
  {
    id: "3",
    title: "Atualizar CRM com novos leads",
    description: "Inserir os leads capturados na campanha de marketing no sistema CRM",
    priority: "media",
    dueDate: "2025-01-23",
    assignee: "Sergio Ricardo",
    team: "Marketing",
    teamColor: "bg-purple-500",
    status: "criada"
  },
  {
    id: "4",
    title: "Preparar relatório mensal de vendas",
    description: "Compilar dados de vendas do mês e preparar apresentação para diretoria",
    priority: "alta",
    dueDate: "2025-01-22",
    assignee: "Sergio Ricardo",
    team: "Vendas",
    teamColor: "bg-blue-500",
    status: "validada"
  }
]

const columns = [
  { id: "criada", title: "Criada", tasks: 2, color: "kanban-created" },
  { id: "assumida", title: "Assumida", tasks: 0, color: "kanban-assigned" },
  { id: "executando", title: "Executando", tasks: 1, color: "kanban-executing" },
  { id: "concluida", title: "Concluída", tasks: 0, color: "kanban-completed" },
  { id: "validada", title: "Validada", tasks: 1, color: "kanban-validated" }
]

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    assignee: 'all',
    team: 'all',
    dateFrom: '',
    dateTo: '',
    showOverdueOnly: false
  })

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as Task["status"]

    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    )
    
    setActiveTask(null)
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !task.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Assignee filter
      if (filters.assignee && filters.assignee !== 'all' && task.assignee !== filters.assignee) {
        return false
      }

      // Team filter
      if (filters.team && filters.team !== 'all' && task.team !== filters.team) {
        return false
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const taskDate = new Date(task.dueDate)
        if (filters.dateFrom && taskDate < new Date(filters.dateFrom)) {
          return false
        }
        if (filters.dateTo && taskDate > new Date(filters.dateTo)) {
          return false
        }
      }

      // Overdue filter
      if (filters.showOverdueOnly && !isOverdue(task.dueDate)) {
        return false
      }

      return true
    })
  }, [tasks, filters])

  const getTasksByStatus = (status: Task["status"]) =>
    filteredTasks.filter(task => task.status === status)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Minhas Tarefas e da Equipe</h2>
          <p className="text-muted-foreground">Visualize e gerencie suas tarefas e da sua equipe</p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <KanbanFilters onFiltersChange={setFilters} />

      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4 min-h-[calc(100vh-400px)]">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id as Task["status"])
            return (
              <SortableContext
                key={column.id}
                items={columnTasks.map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  id={column.id}
                  title={column.title}
                  tasks={columnTasks}
                  color={column.color}
                />
              </SortableContext>
            )
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanCard
              task={activeTask}
              isDragging={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}