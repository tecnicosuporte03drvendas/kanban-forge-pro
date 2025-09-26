import { useState, useMemo, useEffect } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { KanbanFilters, FilterState } from "./kanban-filters"
import { isOverdue } from "@/utils/date-utils"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import type { Tarefa, StatusTarefa } from "@/types/task"

export interface Task {
  id: string
  title: string
  description: string
  priority: "alta" | "media" | "baixa" | "urgente"
  dueDate: string
  assignee: string
  team: string
  teamColor: string
  status: "criada" | "assumida" | "executando" | "concluida" | "validada"
}

interface KanbanBoardProps {
  onTaskClick?: (taskId: string) => void;
}

const columns = [
  { id: "criada", title: "Criada", tasks: 0, color: "kanban-created" },
  { id: "assumida", title: "Assumida", tasks: 0, color: "kanban-assigned" },
  { id: "executando", title: "Executando", tasks: 0, color: "kanban-executing" },
  { id: "concluida", title: "Concluída", tasks: 0, color: "kanban-completed" },
  { id: "validada", title: "Validada", tasks: 0, color: "kanban-validated" }
]

export function KanbanBoard({ onTaskClick }: KanbanBoardProps) {
  const { usuario } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    assignee: 'all',
    team: 'all',
    dateFrom: '',
    dateTo: '',
    showOverdueOnly: false
  })

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadTasks()
    }
  }, [usuario?.empresa_id])

  const loadTasks = async () => {
    if (!usuario?.empresa_id) return
    
    setLoading(true)
    try {
      const { data: tarefas, error } = await supabase
        .from('tarefas')
        .select(`
          *,
          tarefas_responsaveis(
            usuarios:usuario_id(nome),
            equipes:equipe_id(nome)
          )
        `)
        .eq('empresa_id', usuario.empresa_id)

      if (error) throw error

      // Transform Supabase data to Task format
      const transformedTasks: Task[] = tarefas?.map((tarefa: any) => {
        // Get responsible name (first user or team)
        let assignee = 'Não atribuído'
        let team = 'Sem equipe'
        let teamColor = 'bg-gray-500'

        if (tarefa.tarefas_responsaveis?.length > 0) {
          const responsible = tarefa.tarefas_responsaveis[0]
          if (responsible.usuarios) {
            assignee = responsible.usuarios.nome
          } else if (responsible.equipes) {
            assignee = responsible.equipes.nome
            team = responsible.equipes.nome
          }
        }

        return {
          id: tarefa.id,
          title: tarefa.titulo,
          description: tarefa.descricao || '',
          priority: tarefa.prioridade,
          dueDate: tarefa.data_conclusao,
          assignee,
          team,
          teamColor,
          status: tarefa.status,
        }
      }) || []

      setTasks(transformedTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as StatusTarefa

    // Update local state immediately
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    )

    // Update in database
    updateTaskStatus(taskId, newStatus)
    
    setActiveTask(null)
  }

  const updateTaskStatus = async (taskId: string, status: StatusTarefa) => {
    try {
      const { error } = await supabase
        .from('tarefas')
        .update({ status })
        .eq('id', taskId)

      if (error) throw error

      // Create activity record
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('tarefas_atividades').insert({
          tarefa_id: taskId,
          usuario_id: user.id,
          acao: 'alterou status',
          descricao: `Status alterado para: ${status}`,
        })
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      // Revert local state on error
      loadTasks()
    }
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
      </div>

      <KanbanFilters onFiltersChange={setFilters} />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Carregando tarefas...</p>
        </div>
      ) : (
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
                    onTaskClick={onTaskClick}
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
      )}
    </div>
  )
}