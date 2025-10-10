import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Filter, Download, Calendar, User, MoreHorizontal, Archive, Clock, PlayCircle, CheckSquare, Trash2, X } from "lucide-react"
import { getDateStatus } from "@/utils/date-utils"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useEffectiveUser } from '@/hooks/use-effective-user'
import { DeleteTaskConfirmationModal } from "@/components/modals/DeleteTaskConfirmationModal"
import { CreateTaskModal } from "@/components/modals/CreateTaskModal"
import { ViewTaskModal } from "@/components/modals/ViewTaskModal"
import type { Tarefa } from "@/types/task"

interface TarefasListProps {
  onCreateTask?: () => void
  showArchived?: boolean
  onTaskUpdated?: () => void
}

export function TarefasList({ onCreateTask, showArchived = false, onTaskUpdated }: TarefasListProps) {
  const { usuario } = useEffectiveUser()
  const [tasks, setTasks] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [taskToDelete, setTaskToDelete] = useState<Tarefa | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadTasks()
    }
  }, [usuario?.empresa_id, showArchived])

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
        .eq('arquivada', showArchived)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTasks(tarefas || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "criada": return "bg-kanban-created text-white"
      case "assumida": return "bg-kanban-assigned text-white"
      case "executando": return "bg-kanban-executing text-white"
      case "concluida": return "bg-kanban-completed text-white"
      case "validada": return "bg-kanban-validated text-white"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-priority-high text-white"
      case "media": return "bg-priority-medium text-white"
      case "baixa": return "bg-priority-low text-white"
      case "urgente": return "bg-priority-urgent text-white"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const selectAllTasks = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(filteredTasks.map(task => task.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedTasks.length === 0) return

    // Show confirmation modal for bulk delete
    if (action === 'delete') {
      setShowBulkDeleteModal(true)
      return
    }

    try {
      if (action === 'archive') {
        await supabase
          .from('tarefas')
          .update({ arquivada: true })
          .in('id', selectedTasks)
      } else if (action === 'unarchive') {
        await supabase
          .from('tarefas')
          .update({ arquivada: false })
          .in('id', selectedTasks)
      } else {
        // Status changes
        const statusMap: Record<string, string> = {
          'pending': 'criada',
          'executing': 'executando',
          'completed': 'concluida'
        }
        if (statusMap[action]) {
          await supabase
            .from('tarefas')
            .update({ status: statusMap[action] as any })
            .in('id', selectedTasks)
        }
      }
      
      setSelectedTasks([])
      loadTasks()
    } catch (error) {
      console.error('Error executing bulk action:', error)
    }
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedTasks.length === 0) return

    try {
      await supabase
        .from('tarefas')
        .delete()
        .in('id', selectedTasks)
      
      setShowBulkDeleteModal(false)
      setSelectedTasks([])
      loadTasks()
    } catch (error) {
      console.error('Error deleting tasks:', error)
    }
  }

  const handleBulkArchiveInsteadOfDelete = async () => {
    if (selectedTasks.length === 0) return

    try {
      await supabase
        .from('tarefas')
        .update({ arquivada: true })
        .in('id', selectedTasks)
      
      setShowBulkDeleteModal(false)
      setSelectedTasks([])
      loadTasks()
    } catch (error) {
      console.error('Error archiving tasks:', error)
    }
  }

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      if (action === 'view') {
        setSelectedTaskId(taskId)
        setShowViewModal(true)
        return
      }
      
      if (action === 'archive') {
        await supabase
          .from('tarefas')
          .update({ arquivada: true })
          .eq('id', taskId)
      } else if (action === 'unarchive') {
        await supabase
          .from('tarefas')
          .update({ arquivada: false })
          .eq('id', taskId)
      } else if (action === 'delete') {
        // Show confirmation modal for deletion
        const task = tasks.find(t => t.id === taskId)
        if (task) {
          setTaskToDelete(task)
          setShowDeleteModal(true)
          return // Don't continue with direct deletion
        }
      } else {
        // Status changes
        const statusMap: Record<string, string> = {
          'pending': 'criada',
          'executing': 'executando',
          'completed': 'concluida'
        }
        if (statusMap[action]) {
          await supabase
            .from('tarefas')
            .update({ status: statusMap[action] as any })
            .eq('id', taskId)
        }
      }
      
      loadTasks()
    } catch (error) {
      console.error('Error executing task action:', error)
    }
  }

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return

    try {
      await supabase
        .from('tarefas')
        .delete()
        .eq('id', taskToDelete.id)
      
      setShowDeleteModal(false)
      setTaskToDelete(null)
      loadTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleArchiveInsteadOfDelete = async () => {
    if (!taskToDelete) return

    try {
      await supabase
        .from('tarefas')
        .update({ arquivada: true })
        .eq('id', taskToDelete.id)
      
      setShowDeleteModal(false)
      setTaskToDelete(null)
      loadTasks()
    } catch (error) {
      console.error('Error archiving task:', error)
    }
  }

  const getResponsibleName = (task: Tarefa) => {
    const responsaveis = (task as any).tarefas_responsaveis || []
    const usuarios = responsaveis.filter((r: any) => r.usuarios).map((r: any) => r.usuarios)
    const equipes = responsaveis.filter((r: any) => r.equipes).map((r: any) => r.equipes)
    
    const totalResponsaveis = usuarios.length + equipes.length

    if (totalResponsaveis > 1) {
      return `${totalResponsaveis} Responsáveis`
    } else if (usuarios.length > 0) {
      return usuarios[0].nome
    } else if (equipes.length > 0) {
      return equipes[0].nome
    }
    
    return 'Não atribuído'
  }

  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchTerm && !task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !task.descricao?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false
    }

    // Priority filter
    if (priorityFilter !== 'all' && task.prioridade !== priorityFilter) {
      return false
    }

    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Carregando tarefas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar tarefas..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="criada">Criada</SelectItem>
                  <SelectItem value="assumida">Assumida</SelectItem>
                  <SelectItem value="executando">Executando</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="validada">Validada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {selectedTasks.length > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {selectedTasks.length} tarefas selecionadas
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTasks([])}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {!showArchived ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('archive')}
                        className="h-8"
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Arquivar
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('unarchive')}
                        className="h-8"
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Desarquivar
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleBulkAction('pending')}
                      className="h-8"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Pendente
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleBulkAction('executing')}
                      className="h-8"
                    >
                      <PlayCircle className="w-4 h-4 mr-1" />
                      Em Execução
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleBulkAction('completed')}
                      className="h-8"
                    >
                      <CheckSquare className="w-4 h-4 mr-1" />
                      Concluída
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleBulkAction('delete')}
                      className="h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {filteredTasks.length} de {tasks.length} tarefas encontradas
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground"
            onClick={selectAllTasks}
          >
            {selectedTasks.length === filteredTasks.length ? "Desselecionar todas" : "Selecionar todas"}
          </Button>
        </div>

        {filteredTasks.map((task) => (
          <Card 
            key={task.id} 
            className="border-border bg-card hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => handleTaskAction(task.id, 'view')}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-1 h-8 rounded-full flex-shrink-0 ${getPriorityColor(task.prioridade)}`} />
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-2 border-border flex-shrink-0 cursor-pointer transition-all duration-200 checked:bg-primary checked:border-primary hover:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none" 
                    checked={selectedTasks.includes(task.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleTaskSelection(task.id)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-card-foreground truncate">{task.titulo}</h4>
                  </div>
                  <Badge variant="outline" className={`${getStatusColor(task.status)} text-xs flex-shrink-0 dark:text-slate-800`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </Badge>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="hidden sm:inline">{getResponsibleName(task)}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${getDateStatus(task.data_conclusao).className}`}>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(task.data_conclusao).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
                
                {selectedTasks.length === 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                      {!showArchived ? (
                        <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'archive')}>
                          <Archive className="w-4 h-4 mr-2" />
                          Arquivar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'unarchive')}>
                          <Archive className="w-4 h-4 mr-2" />
                          Desarquivar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'pending')}>
                        <Clock className="w-4 h-4 mr-2" />
                        Marcar como Pendente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'executing')}>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Marcar como Em Execução
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'completed')}>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Marcar como Concluída
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleTaskAction(task.id, 'delete')}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {showArchived ? 'Nenhuma tarefa arquivada encontrada.' : 'Nenhuma tarefa encontrada.'}
              </p>
              {!showArchived && (
                <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Nova Tarefa
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteTaskConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setTaskToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        onArchive={handleArchiveInsteadOfDelete}
        task={taskToDelete}
      />
      
      <CreateTaskModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTaskCreated={loadTasks}
      />

      <DeleteTaskConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleConfirmBulkDelete}
        onArchive={handleBulkArchiveInsteadOfDelete}
        isBulkOperation={true}
        selectedCount={selectedTasks.length}
        task={{
          id: '',
          titulo: '',
          descricao: '',
          prioridade: 'media' as any,
          data_conclusao: '',
          horario_conclusao: '',
          status: 'criada' as any,
          empresa_id: '',
          criado_por: '',
          created_at: '',
          updated_at: '',
          tempo_gasto_minutos: 0,
          arquivada: false
        }}
      />

      {selectedTaskId && (
        <ViewTaskModal
          taskId={selectedTaskId}
          open={showViewModal}
          onOpenChange={setShowViewModal}
          onTaskUpdated={() => {
            loadTasks()
            onTaskUpdated?.()
          }}
        />
      )}
    </div>
  )
}