import { useState, useMemo, useEffect } from "react"
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  closestCenter,
  DragOverEvent
} from "@dnd-kit/core"
import { 
  SortableContext, 
  verticalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  assigneeId?: string
  team: string
  teamId?: string
  teamColor: string
  status: "criada" | "assumida" | "executando" | "concluida" | "validada"
  isCurrentUserAssigned?: boolean
  totalResponsaveis?: number
  tempo_gasto_minutos?: number
  tempo_inicio?: string
  tempo_fim?: string
  arquivada: boolean
  posicao_coluna?: number
  responsaveis_ids: string[] // IDs de todos os usuários responsáveis
  equipes_ids: string[] // IDs de todas as equipes responsáveis
}

interface KanbanBoardProps {
  onTaskClick?: (taskId: string) => void;
  onCreateTask?: () => void;
}

const columns = [
  { id: "criada", title: "Criada", tasks: 0, color: "kanban-created" },
  { id: "assumida", title: "Assumida", tasks: 0, color: "kanban-assigned" },
  { id: "executando", title: "Executando", tasks: 0, color: "kanban-executing" },
  { id: "concluida", title: "Concluída", tasks: 0, color: "kanban-completed" },
  { id: "validada", title: "Validada", tasks: 0, color: "kanban-validated" }
]

export function KanbanBoard({ onTaskClick, onCreateTask }: KanbanBoardProps) {
  const { usuario } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeColumn, setActiveColumn] = useState<string | null>(null)
  const [dragStartTime, setDragStartTime] = useState<number | null>(null)
  const [isDragInProgress, setIsDragInProgress] = useState(false)
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
        .eq('arquivada', false)
        .order('posicao_coluna', { ascending: true })

      if (error) throw error

      // Transform Supabase data to Task format
      const transformedTasks: Task[] = tarefas?.map((tarefa: any) => {
        const responsaveis = tarefa.tarefas_responsaveis || []
        const usuarios = responsaveis.filter((r: any) => r.usuarios).map((r: any) => r.usuarios)
        const equipes = responsaveis.filter((r: any) => r.equipes).map((r: any) => r.equipes)
        
        // Get all responsible user and team IDs for filtering
        const responsaveis_ids = usuarios.map((u: any) => u.id)
        const equipes_ids = equipes.map((e: any) => e.id)
        
        // Count total members (users + team members)
        let totalResponsaveis = usuarios.length
        // For now, assume each team has 1 member (could be enhanced to count actual team members)
        totalResponsaveis += equipes.length
        
        let assignee = 'Não atribuído'
        let team = ''
        let teamColor = 'bg-gray-500'
        let isCurrentUserAssigned = false
        let assigneeId: string | undefined
        let teamId: string | undefined

        // Check if current user is assigned
        if (usuario?.id) {
          isCurrentUserAssigned = usuarios.some((u: any) => u.id === usuario.id)
        }

        if (totalResponsaveis > 1) {
          assignee = `${totalResponsaveis} Responsáveis`
          // For multiple responsibles, use the first user ID if available
          assigneeId = usuarios.length > 0 ? usuarios[0].id : undefined
        } else if (usuarios.length > 0) {
          assignee = usuarios[0].nome
          assigneeId = usuarios[0].id
        } else if (equipes.length > 0) {
          assignee = equipes[0].nome
          team = equipes[0].nome
          teamId = equipes[0].id
          teamColor = 'bg-blue-500'
        }

        return {
          id: tarefa.id,
          title: tarefa.titulo,
          description: tarefa.descricao || '',
          priority: tarefa.prioridade,
          dueDate: tarefa.data_conclusao,
          assignee,
          assigneeId,
          team,
          teamId,
          teamColor,
          status: tarefa.status,
          isCurrentUserAssigned,
          totalResponsaveis,
          tempo_gasto_minutos: tarefa.tempo_gasto_minutos,
          tempo_inicio: tarefa.tempo_inicio,
          tempo_fim: tarefa.tempo_fim,
          arquivada: tarefa.arquivada,
          posicao_coluna: tarefa.posicao_coluna || 0,
          responsaveis_ids,
          equipes_ids,
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
    if (task) {
      setActiveTask(task)
      setActiveColumn(task.status)
      setDragStartTime(Date.now())
      setIsDragInProgress(true)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    const activeId = active.id as string
    const overId = over.id as string
    
    // Find the active task
    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) return
    
    // Check if over a column or another task
    const isOverColumn = columns.some(col => col.id === overId)
    const overTask = tasks.find(t => t.id === overId)
    
    if (isOverColumn) {
      // Dragging over a column
      const newStatus = overId as StatusTarefa
      if (activeTask.status !== newStatus) {
        setTasks(prev => 
          prev.map(task =>
            task.id === activeId ? { ...task, status: newStatus } : task
          )
        )
      }
    } else if (overTask && activeTask.status === overTask.status) {
      // Dragging over another task in the same column - reorder
      const activeIndex = tasks.findIndex(t => t.id === activeId)
      const overIndex = tasks.findIndex(t => t.id === overId)
      
      if (activeIndex !== overIndex) {
        setTasks(prev => arrayMove(prev, activeIndex, overIndex))
      }
    } else if (overTask && activeTask.status !== overTask.status) {
      // Dragging over a task in a different column - move to that column
      setTasks(prev => 
        prev.map(task =>
          task.id === activeId ? { ...task, status: overTask.status } : task
        )
      )
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const dragEndTime = Date.now()
    const dragDuration = dragStartTime ? dragEndTime - dragStartTime : 0
    
    setActiveTask(null)
    setActiveColumn(null)
    setIsDragInProgress(false)
    setDragStartTime(null)

    // If it was a quick click (less than 200ms and no real movement), treat as click
    if (dragDuration < 200 && (!over || over.id === active.id)) {
      if (onTaskClick) {
        onTaskClick(active.id as string)
      }
      return
    }

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string
    
    // Find the task that was moved
    const movedTask = tasks.find(t => t.id === taskId)
    if (!movedTask) return
    
    // Determine the final status
    let finalStatus: StatusTarefa = movedTask.status
    
    // Check if dropped on a column
    const isOverColumn = columns.some(col => col.id === overId)
    if (isOverColumn) {
      finalStatus = overId as StatusTarefa
    } else {
      // Check if dropped on another task
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) {
        finalStatus = overTask.status
      }
    }
    
    // Update in database if status changed or position changed
    console.log('🔍 Drag end check:', { 
      taskId, 
      movedTaskStatus: movedTask.status, 
      finalStatus, 
      statusChanged: movedTask.status !== finalStatus 
    })
    
    if (movedTask.status !== finalStatus) {
      console.log('✅ Calling updateTaskStatus')
      updateTaskStatus(taskId, finalStatus)
    } else {
      console.log('❌ Calling updateTaskPosition instead')
      // Same column, just position change - save new order
      const tasksInColumn = getTasksByStatus(finalStatus)
      const targetIndex = tasksInColumn.findIndex(t => t.id === taskId)
      if (targetIndex !== -1) {
        updateTaskPosition(taskId, finalStatus, targetIndex)
      }
    }
  }

  const updateTaskStatus = async (taskId: string, status: StatusTarefa) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const oldTask = tasks.find(t => t.id === taskId)
      if (!oldTask) return

      // Handle time tracking logic - lógica simplificada
      const now = new Date().toISOString()
      let updateFields: any = { status }

      // Status change logic for time tracking
      console.log('🔄 Status change:', { oldStatus: oldTask.status, newStatus: status, taskId })
      
      if (oldTask.status !== status) {
        // Saindo de "criada" pela primeira vez - registrar tempo_inicio
        if (oldTask.status === 'criada' && (status === 'assumida' || status === 'executando')) {
          console.log('⏰ Setting tempo_inicio:', now)
          updateFields.tempo_inicio = now
        }
        
        // Mantém tempo_inicio se saindo de "assumida" para "executando"
        // (não precisa fazer nada aqui, apenas manter o tempo existente)

        // Concluindo tarefa - registrar tempo_fim
        if (status === 'concluida') {
          console.log('🏁 Setting tempo_fim:', now)
          updateFields.tempo_fim = now
        }

        // Voltando para "criada" - o trigger do banco resetará os tempos automaticamente
      }
      
      console.log('📝 Update fields:', updateFields)

      // Update task status and time fields
      const { error } = await supabase
        .from('tarefas')
        .update(updateFields)
        .eq('id', taskId)

      if (error) throw error

      // Create activity record
      await supabase.from('tarefas_atividades').insert({
        tarefa_id: taskId,
        usuario_id: user.id,
        acao: 'alterou status',
        descricao: `Status alterado para: ${status}`,
      })

      // Reload tasks to get updated time data
      loadTasks()

      // If task completed, send webhook notification
      if (status === 'concluida') {
        console.log('Task completed! Sending webhook notification...')
        console.log('TaskId:', taskId, 'CompletedBy:', user.id)
        try {
          const result = await supabase.functions.invoke('notify-task-completed', {
            body: { 
              taskId: taskId,
              completedBy: user.id 
            }
          })
          console.log('Webhook response:', result)
        } catch (webhookError) {
          console.error('Failed to send task completion notification:', webhookError)
          // Don't block the main functionality if webhook fails
        }
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      // Revert local state on error
      loadTasks()
    }
  }

  const updateTaskPosition = async (taskId: string, newStatus: StatusTarefa, newPosition: number) => {
    try {
      const { error } = await supabase
        .from('tarefas')
        .update({ 
          status: newStatus,
          posicao_coluna: newPosition
        })
        .eq('id', taskId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating task position:', error)
      throw error
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !task.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Assignee filter - check if user is among task responsibles
      if (filters.assignee && filters.assignee !== 'all') {
        if (!task.responsaveis_ids.includes(filters.assignee)) {
          return false
        }
      }

      // Team filter - check if team is among task responsibles
      if (filters.team && filters.team !== 'all') {
        if (!task.equipes_ids.includes(filters.team)) {
          return false
        }
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
    filteredTasks
      .filter(task => task.status === status)
      .sort((a, b) => (a.posicao_coluna || 0) - (b.posicao_coluna || 0))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Minhas Tarefas e da Equipe</h2>
          <p className="text-muted-foreground">Visualize e gerencie suas tarefas e da sua equipe</p>
        </div>
        <Button onClick={onCreateTask} className="bg-primary text-primary-foreground hover:bg-primary-hover">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <KanbanFilters onFiltersChange={setFilters} />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Carregando tarefas...</p>
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4 min-h-[calc(100vh-400px)]">
            {columns.map((column) => {
              const columnTasks = getTasksByStatus(column.id as Task["status"])
              return (
                <div key={column.id}>
                  <SortableContext
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
                </div>
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