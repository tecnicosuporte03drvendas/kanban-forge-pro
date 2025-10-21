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
  status: "criada" | "aceita" | "executando" | "concluida" | "aprovada"
  isCurrentUserAssigned?: boolean
  totalResponsaveis?: number
  tempo_gasto_minutos?: number
  tempo_inicio?: string
  tempo_fim?: string
  arquivada: boolean
  posicao_coluna?: number
  responsaveis_ids: string[] // IDs de todos os usuários responsáveis
  equipes_ids: string[] // IDs de todas as equipes responsáveis
  tipo_tarefa: "pessoal" | "profissional"
}

interface KanbanBoardProps {
  onTaskClick?: (taskId: string) => void;
  onCreateTask?: () => void;
  allCardsCompact?: boolean;
  onToggleAllCardsCompact?: () => void;
  onRealtimeUpdate?: (taskId: string) => void;
  onTaskApprove?: (taskId: string) => Promise<void>;
}

const columns = [
  { id: "criada", title: "Criada", tasks: 0, color: "kanban-created" },
  { id: "aceita", title: "Aceita", tasks: 0, color: "kanban-assigned" },
  { id: "executando", title: "Executando", tasks: 0, color: "kanban-executing" },
  { id: "concluida", title: "Concluída", tasks: 0, color: "kanban-completed" }
]

export function KanbanBoard({ onTaskClick, onCreateTask, allCardsCompact, onToggleAllCardsCompact, onRealtimeUpdate, onTaskApprove }: KanbanBoardProps) {
  const { usuario } = useEffectiveUser()
  const { shouldSuppressLogs } = useStealth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeColumn, setActiveColumn] = useState<string | null>(null)
  const [dragStartTime, setDragStartTime] = useState<number | null>(null)
  const [isDragInProgress, setIsDragInProgress] = useState(false)
  const [savingTasks, setSavingTasks] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    assignee: 'all',
    team: 'all',
    dateFrom: '',
    dateTo: '',
    showOverdueOnly: false,
    tipoTarefa: 'all'
  })

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadTasks()
    }
  }, [usuario?.empresa_id])

  // Realtime update handler - updates specific task without full reload
  const updateSingleTask = async (taskId: string) => {
    if (!usuario?.empresa_id) return
    
    try {
      const { data: tarefa, error } = await supabase
        .from('tarefas')
        .select(`
          *,
          tarefas_responsaveis(
            usuarios:usuario_id(nome, id),
            equipes:equipe_id(nome, id)
          )
        `)
        .eq('id', taskId)
        .eq('empresa_id', usuario.empresa_id)
        .eq('arquivada', false)
        .single()

      if (error || !tarefa) {
        // Task might have been deleted or archived - remove it
        setTasks(prev => prev.filter(t => t.id !== taskId))
        return
      }

      // Check if colaborador should see this task
      if (usuario.tipo_usuario === 'colaborador') {
        const { data: userTeams } = await supabase
          .from('usuarios_equipes')
          .select('equipe_id')
          .eq('usuario_id', usuario.id)

        const userTeamIds = userTeams?.map(ut => ut.equipe_id) || []
        const responsaveis = tarefa.tarefas_responsaveis || []
        
        const isUserResponsible = responsaveis.some((r: any) => 
          r.usuarios && r.usuarios.id === usuario.id
        )
        
        const isTeamResponsible = responsaveis.some((r: any) => 
          r.equipes && userTeamIds.includes(r.equipes.id)
        )
        
        if (!isUserResponsible && !isTeamResponsible) {
          // User should not see this task - remove it
          setTasks(prev => prev.filter(t => t.id !== taskId))
          return
        }
      }

      // Transform to Task format
      const responsaveis = tarefa.tarefas_responsaveis || []
      const usuarios = responsaveis.filter((r: any) => r.usuarios).map((r: any) => r.usuarios)
      const equipes = responsaveis.filter((r: any) => r.equipes).map((r: any) => r.equipes)
      
      const responsaveis_ids = usuarios.map((u: any) => u.id)
      const equipes_ids = equipes.map((e: any) => e.id)
      
      let totalResponsaveis = usuarios.length + equipes.length
      let assignee = 'Não atribuído'
      let team = ''
      let teamColor = 'bg-gray-500'
      let isCurrentUserAssigned = false
      let assigneeId: string | undefined
      let teamId: string | undefined

      if (usuario?.id) {
        isCurrentUserAssigned = usuarios.some((u: any) => u.id === usuario.id)
      }

      if (totalResponsaveis > 1) {
        assignee = `${totalResponsaveis} Responsáveis`
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

      const updatedTask: Task = {
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
        tipo_tarefa: (tarefa.tipo_tarefa as 'pessoal' | 'profissional') || 'profissional',
      }

      // Update or add task
      setTasks(prev => {
        const existingIndex = prev.findIndex(t => t.id === taskId)
        if (existingIndex >= 0) {
          // Update existing task
          const newTasks = [...prev]
          newTasks[existingIndex] = updatedTask
          return newTasks
        } else {
          // Add new task
          return [...prev, updatedTask]
        }
      })
    } catch (error) {
      console.error('Error updating single task:', error)
    }
  }

  // Expose update method to parent
  useEffect(() => {
    if (onRealtimeUpdate) {
      // Store the update function reference
      (window as any).__kanbanUpdateTask = updateSingleTask
    }
  }, [onRealtimeUpdate, usuario])

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
          tipo_tarefa: (tarefa.tipo_tarefa as 'pessoal' | 'profissional') || 'profissional',
        }
      }) || []

      setTasks(transformedTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função para validar se o movimento é permitido
  const canMoveTask = (task: Task, fromStatus: StatusTarefa, toStatus: StatusTarefa): boolean => {
    // Gestores e proprietários podem mover livremente
    if (usuario?.tipo_usuario === 'gestor' || usuario?.tipo_usuario === 'proprietario') {
      return true
    }

    // Colaboradores têm restrições
    if (usuario?.tipo_usuario === 'colaborador') {
      // Não podem mover tarefas concluídas ou aprovadas
      if (fromStatus === 'concluida' || fromStatus === 'aprovada') {
        return false
      }

      // Só podem mover se forem responsáveis pela tarefa
      if (!task.isCurrentUserAssigned) {
        return false
      }

      // Regras de movimento válidas para colaboradores:
      const validMovements: Record<StatusTarefa, StatusTarefa[]> = {
        'criada': ['aceita', 'executando', 'concluida'],
        'aceita': ['executando', 'concluida', 'criada'],
        'executando': ['concluida', 'aceita'],
        'concluida': [], // Colaboradores não podem mover tarefas concluídas
        'aprovada': []  // Colaboradores não podem mover tarefas aprovadas
      }

      return validMovements[fromStatus]?.includes(toStatus) || false
    }

    return true
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
    // Mantém visual simples durante drag - não atualiza estado
    return
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const dragEndTime = Date.now()
    const dragDuration = dragStartTime ? dragEndTime - dragStartTime : 0
    
    // Captura o status original ANTES de resetar activeColumn
    const originalStatus = activeColumn as StatusTarefa
    
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

    if (!over || !originalStatus) return

    const taskId = active.id as string
    const overId = over.id as string
    
    // Find the task that was moved
    const movedTask = tasks.find(t => t.id === taskId)
    if (!movedTask) return
    
    // Determine the final status
    let finalStatus: StatusTarefa = originalStatus
    
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
    
    // Validar se o movimento é permitido
    if (!canMoveTask(movedTask, originalStatus, finalStatus)) {
      toast({
        title: "Movimento não permitido",
        description: "Você não tem permissão para mover esta tarefa para este status.",
        variant: "destructive"
      })
      return
    }
    
    // Update in database if status changed
    if (originalStatus !== finalStatus) {
      console.log('✅ Status changed - updating task')
      updateTaskStatusAndPosition(taskId, originalStatus, finalStatus)
    } else {
      console.log('📍 Same status - updating only position')
      // Same column, just position change
      const tasksInColumn = getTasksByStatus(finalStatus)
      const oldIndex = tasksInColumn.findIndex(t => t.id === taskId)
      
      if (oldIndex === -1) return
      
      // Find new index based on drop target
      let newIndex = oldIndex
      if (overId !== taskId) {
        const overTask = tasksInColumn.find(t => t.id === overId)
        if (overTask) {
          newIndex = tasksInColumn.findIndex(t => t.id === overId)
        }
      }
      
      // Only update if position actually changed
      if (oldIndex !== newIndex) {
        // Optimistic update - reorder locally FIRST
        const reorderedTasks = arrayMove(tasksInColumn, oldIndex, newIndex)
        const updatedTasks = reorderedTasks.map((task, index) => ({
          ...task,
          posicao_coluna: index
        }))
        
        // Update local state immediately for instant UI feedback
        setTasks(prev => {
          const tasksInOtherColumns = prev.filter(t => t.status !== finalStatus)
          return [...tasksInOtherColumns, ...updatedTasks]
        })
        
        // Mark task as saving
        setSavingTasks(prev => new Set(prev).add(taskId))
        
        // Then save to database
        updateTaskPosition(updatedTasks, finalStatus, taskId)
      }
    }
  }

  const updateTaskStatusAndPosition = async (taskId: string, originalStatus: StatusTarefa, newStatus: StatusTarefa) => {
    // Mark task as saving
    setSavingTasks(prev => new Set(prev).add(taskId))
    
    // Calculate new position BEFORE optimistic update to use current state
    const tasksInNewColumn = tasks.filter(t => t.status === newStatus && t.id !== taskId)
    const newPosition = tasksInNewColumn.length
    
    // Optimistic update - update local state first
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus, posicao_coluna: newPosition } : task
    ))

    try {
      // Usar usuario do contexto de autenticação customizado
      if (!usuario?.id) {
        throw new Error('Usuário não autenticado')
      }

      const oldTask = tasks.find(t => t.id === taskId)
      if (!oldTask) {
        throw new Error('Tarefa não encontrada')
      }

      // Handle time tracking logic
      const now = new Date().toISOString()
      
      let updateFields: any = { 
        status: newStatus,
        posicao_coluna: newPosition 
      }

      // Status change logic for time tracking
      console.log('🔄 Status change:', { oldStatus: originalStatus, newStatus, taskId })
      
      // Saindo de "criada" pela primeira vez - registrar tempo_inicio
      if (originalStatus === 'criada' && (newStatus === 'aceita' || newStatus === 'executando')) {
        console.log('⏰ Setting tempo_inicio:', now)
        updateFields.tempo_inicio = now
      }
      
      // Concluindo tarefa - registrar tempo_fim e calcular tempo gasto
      if (newStatus === 'concluida') {
        console.log('🏁 Setting tempo_fim:', now)
        updateFields.tempo_fim = now
        
        // Calcular tempo gasto manualmente como backup
        if (oldTask.tempo_inicio) {
          const tempoInicioDate = new Date(oldTask.tempo_inicio)
          const tempoFimDate = new Date(now)
          const minutosGastos = Math.round((tempoFimDate.getTime() - tempoInicioDate.getTime()) / 60000)
          updateFields.tempo_gasto_minutos = minutosGastos
          console.log('⏱️ Calculated tempo_gasto_minutos:', minutosGastos)
        }
      }

      // Voltando para "criada" - o trigger do banco resetará os tempos automaticamente
      
      console.log('📝 Update fields:', updateFields)

      // Update task status and time fields
      const { error } = await supabase
        .from('tarefas')
        .update(updateFields)
        .eq('id', taskId)

      if (error) throw error

      // Create activity record only if not in stealth mode
      if (!shouldSuppressLogs) {
        await supabase.from('tarefas_atividades').insert({
          tarefa_id: taskId,
          usuario_id: usuario.id,
          acao: 'alterou status',
          descricao: `Status alterado de ${originalStatus} para ${newStatus}`,
        })
      }

      // If task completed, send webhook notification
      if (newStatus === 'concluida') {
        console.log('Task completed! Sending webhook notification...')
        try {
          const result = await supabase.functions.invoke('notify-task-completed', {
            body: { 
              taskId: taskId,
              completedBy: usuario.id 
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
      
      // Rollback - revert local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: originalStatus } : task
      ))
      
      // Show error toast
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível mover a tarefa. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      // Remove saving state
      setSavingTasks(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const updateTaskPosition = async (reorderedTasks: Task[], status: StatusTarefa, taskId: string) => {
    // Local state already updated optimistically in handleDragEnd
    try {
      // Update all positions in database with batch update
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        posicao_coluna: index
      }))

      // Update each task's position
      for (const update of updates) {
        const { error } = await supabase
          .from('tarefas')
          .update({ posicao_coluna: update.posicao_coluna })
          .eq('id', update.id)
        
        if (error) throw error
      }

      // Success - no toast to avoid UI clutter
    } catch (error) {
      console.error('Error updating task position:', error)
      
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível alterar a posição da tarefa.",
        variant: "destructive"
      })
      
      // Reload on error to ensure consistency
      await loadTasks()
    } finally {
      // Remove saving state
      setSavingTasks(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
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

      // Tipo de tarefa filter
      if (filters.tipoTarefa && filters.tipoTarefa !== 'all') {
        if (task.tipo_tarefa !== filters.tipoTarefa) {
          return false
        }
      }

      return true
    })
  }, [tasks, filters])

  const getTasksByStatus = (status: Task["status"]) =>
    filteredTasks
      .filter(task => task.status === status)
      .sort((a, b) => (a.posicao_coluna || 0) - (b.posicao_coluna || 0))

  return (
    <div className="flex flex-col">
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
          <div className="grid grid-cols-4 gap-2 pb-4 w-full">
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
                      savingTasks={savingTasks}
                      allCompact={allCardsCompact}
                      onToggleCompact={onToggleAllCardsCompact}
                      onTaskApprove={onTaskApprove}
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