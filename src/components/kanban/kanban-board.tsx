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
import { useEffectiveUser } from "@/hooks/use-effective-user"
import { useStealth } from "@/hooks/use-stealth"
import { toast } from "@/hooks/use-toast"
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
  const { usuario } = useEffectiveUser()
  const { shouldSuppressLogs } = useStealth()
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
      let query = supabase
        .from('tarefas')
        .select(`
          *,
          tarefas_responsaveis(
            usuarios:usuario_id(nome, id),
            equipes:equipe_id(nome, id)
          )
        `)
        .eq('empresa_id', usuario.empresa_id)
        .eq('arquivada', false)
        .order('posicao_coluna', { ascending: true })

      const { data: tarefas, error } = await query

      if (error) throw error

      let filteredTarefas = tarefas || []

      // If user is colaborador, filter tasks to show only those they're responsible for
      if (usuario.tipo_usuario === 'colaborador') {
        // Get user's team memberships
        const { data: userTeams } = await supabase
          .from('usuarios_equipes')
          .select('equipe_id')
          .eq('usuario_id', usuario.id)

        const userTeamIds = userTeams?.map(ut => ut.equipe_id) || []

        // Filter tasks to show only those where:
        // 1. User is directly responsible, OR
        // 2. User's team is responsible
        filteredTarefas = tarefas?.filter((tarefa: any) => {
          const responsaveis = tarefa.tarefas_responsaveis || []
          
          // Check if user is directly responsible
          const isUserResponsible = responsaveis.some((r: any) => 
            r.usuarios && r.usuarios.id === usuario.id
          )
          
          // Check if any of user's teams is responsible
          const isTeamResponsible = responsaveis.some((r: any) => 
            r.equipes && userTeamIds.includes(r.equipes.id)
          )
          
          return isUserResponsible || isTeamResponsible
        }) || []
      }

      // Transform Supabase data to Task format
      const transformedTasks: Task[] = filteredTarefas?.map((tarefa: any) => {
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
      setActiveColumn(task.status) // Guarda o status original
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
    
    // Determine the final status and position
    let finalStatus: StatusTarefa = movedTask.status
    let newPosition = 0
    
    // Check if dropped on a column
    const isOverColumn = columns.some(col => col.id === overId)
    if (isOverColumn) {
      finalStatus = overId as StatusTarefa
      // When dropped on column, position at the end
      const tasksInColumn = tasks.filter(t => t.status === finalStatus && t.id !== taskId)
      newPosition = tasksInColumn.length
    } else {
      // Check if dropped on another task
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) {
        finalStatus = overTask.status
        // Get position based on where it was dropped relative to other task
        const tasksInColumn = tasks.filter(t => t.status === finalStatus)
        const overTaskIndex = tasksInColumn.findIndex(t => t.id === overId)
        newPosition = overTaskIndex !== -1 ? overTaskIndex : tasksInColumn.length
      }
    }
    
    console.log('🔍 Drag end:', { taskId, originalStatus: activeColumn, finalStatus, newPosition })
    
    // Update task in database with correct position
    updateTaskStatusAndPosition(taskId, finalStatus, newPosition)
  }

  const updateTaskStatusAndPosition = async (taskId: string, status: StatusTarefa, newPosition: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !usuario?.empresa_id) return

      const oldTask = tasks.find(t => t.id === taskId)
      if (!oldTask) return

      // Handle time tracking logic
      const now = new Date().toISOString()
      
      let updateFields: any = { 
        status,
        posicao_coluna: newPosition 
      }

      // Status change logic for time tracking
      console.log('🔄 Status change:', { oldStatus: activeColumn, newStatus: status, taskId, newPosition })
      
      if (activeColumn !== status) {
        // Saindo de "criada" pela primeira vez - registrar tempo_inicio
        if (activeColumn === 'criada' && (status === 'assumida' || status === 'executando')) {
          console.log('⏰ Setting tempo_inicio:', now)
          updateFields.tempo_inicio = now
        }

        // Concluindo tarefa - registrar tempo_fim
        if (status === 'concluida') {
          console.log('🏁 Setting tempo_fim:', now)
          updateFields.tempo_fim = now
        }
      }
      
      console.log('📝 Update fields:', updateFields)

      // First, update positions of other tasks in the target column
      if (oldTask.status !== status) {
        // Moving to different column - get tasks that need position shift
        const { data: tasksToShift } = await supabase
          .from('tarefas')
          .select('id, posicao_coluna')
          .eq('empresa_id', usuario.empresa_id)
          .eq('status', status)
          .gte('posicao_coluna', newPosition)
          .neq('id', taskId)

        // Update positions one by one
        if (tasksToShift) {
          for (const task of tasksToShift) {
            await supabase
              .from('tarefas')
              .update({ posicao_coluna: (task.posicao_coluna || 0) + 1 })
              .eq('id', task.id)
          }
        }
      } else {
        // Same column reorder - update positions
        const currentPosition = oldTask.posicao_coluna || 0
        if (newPosition > currentPosition) {
          // Moving down - get tasks to shift up
          const { data: tasksToShift } = await supabase
            .from('tarefas')
            .select('id, posicao_coluna')
            .eq('empresa_id', usuario.empresa_id)
            .eq('status', status)
            .gt('posicao_coluna', currentPosition)
            .lte('posicao_coluna', newPosition)
            .neq('id', taskId)

          if (tasksToShift) {
            for (const task of tasksToShift) {
              await supabase
                .from('tarefas')
                .update({ posicao_coluna: (task.posicao_coluna || 0) - 1 })
                .eq('id', task.id)
            }
          }
        } else if (newPosition < currentPosition) {
          // Moving up - get tasks to shift down
          const { data: tasksToShift } = await supabase
            .from('tarefas')
            .select('id, posicao_coluna')
            .eq('empresa_id', usuario.empresa_id)
            .eq('status', status)
            .gte('posicao_coluna', newPosition)
            .lt('posicao_coluna', currentPosition)
            .neq('id', taskId)

          if (tasksToShift) {
            for (const task of tasksToShift) {
              await supabase
                .from('tarefas')
                .update({ posicao_coluna: (task.posicao_coluna || 0) + 1 })
                .eq('id', task.id)
            }
          }
        }
      }

      // Update the moved task
      const { error } = await supabase
        .from('tarefas')
        .update(updateFields)
        .eq('id', taskId)

      if (error) throw error

      // Create activity record only if not in stealth mode
      if (!shouldSuppressLogs) {
        const action = oldTask.status !== status ? 'alterou status' : 'reordenou posição'
        const description = oldTask.status !== status 
          ? `Status alterado para: ${status}` 
          : `Posição alterada para: ${newPosition + 1}`
          
        await supabase.from('tarefas_atividades').insert({
          tarefa_id: taskId,
          usuario_id: user.id,
          acao: action,
          descricao: description,
        })
      }

      // Reload tasks to get updated data
      loadTasks()

      // If task completed, send webhook notification
      if (status === 'concluida' && oldTask.status !== 'concluida') {
        console.log('Task completed! Sending webhook notification...')
        try {
          await supabase.functions.invoke('notify-task-completed', {
            body: { 
              taskId: taskId,
              completedBy: user.id 
            }
          })
        } catch (webhookError) {
          console.error('Failed to send task completion notification:', webhookError)
        }
      }
    } catch (error) {
      console.error('Error updating task:', error)
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
          <h2 className="text-2xl font-bold text-foreground">
            {usuario?.tipo_usuario === 'colaborador' ? 'Minhas Tarefas e da Equipe' : 'Tarefas da Empresa'}
          </h2>
          <p className="text-muted-foreground">
            {usuario?.tipo_usuario === 'colaborador' 
              ? 'Visualize e gerencie suas tarefas atribuídas e da sua equipe' 
              : 'Visualize e gerencie todas as tarefas da empresa'
            }
          </p>
        </div>
        {(usuario?.tipo_usuario === 'proprietario' || usuario?.tipo_usuario === 'gestor') && (
          <Button onClick={onCreateTask} className="bg-primary text-primary-foreground hover:bg-primary-hover">
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        )}
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