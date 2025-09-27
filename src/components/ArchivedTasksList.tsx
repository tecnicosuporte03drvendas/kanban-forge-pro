import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, Calendar, User, MoreHorizontal, Archive, Trash2, X, RefreshCw } from "lucide-react"
import { getDateStatus } from "@/utils/date-utils"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useEffectiveUser } from '@/hooks/use-effective-user'
import { useToast } from "@/hooks/use-toast"
import type { Tarefa } from "@/types/task"
import { DeleteTaskConfirmationModal } from "@/components/modals/DeleteTaskConfirmationModal"

export function ArchivedTasksList() {
  const { usuario } = useEffectiveUser()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Tarefa | null>(null)

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
        .eq('arquivada', true)
        .order('updated_at', { ascending: false })

      if (error) throw error

      setTasks(tarefas || [])
    } catch (error) {
      console.error('Error loading archived tasks:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as tarefas arquivadas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  const handleUnarchive = async (taskIds: string[]) => {
    try {
      // Delete all time sessions for these tasks
      const { error: timeSessionError } = await supabase
        .from('tarefas_tempo_sessoes')
        .delete()
        .in('tarefa_id', taskIds)

      if (timeSessionError) throw timeSessionError

      // Reset tasks: unarchive, set to 'criada', reset time data
      const { error: updateError } = await supabase
        .from('tarefas')
        .update({ 
          arquivada: false,
          status: 'criada',
          tempo_inicio: null,
          tempo_fim: null,
          tempo_gasto_minutos: 0,
          posicao_coluna: 0
        })
        .in('id', taskIds)

      if (updateError) throw updateError

      toast({
        title: "Sucesso",
        description: `${taskIds.length} tarefa(s) desarquivada(s) com sucesso.`,
      })

      setSelectedTasks([])
      loadTasks()
    } catch (error) {
      console.error('Error unarchiving tasks:', error)
      toast({
        title: "Erro",
        description: "Não foi possível desarquivar as tarefas.",
        variant: "destructive",
      })
    }
  }

  const handleDeletePermanently = async (taskIds: string[]) => {
    try {
      // Delete related data first (cascade delete)
      const deleteOperations = [
        supabase.from('tarefas_tempo_sessoes').delete().in('tarefa_id', taskIds),
        supabase.from('tarefas_atividades').delete().in('tarefa_id', taskIds),
        supabase.from('tarefas_comentarios').delete().in('tarefa_id', taskIds),
        supabase.from('tarefas_checklist_itens').delete().in('checklist_id', 
          await supabase.from('tarefas_checklists').select('id').in('tarefa_id', taskIds).then(r => r.data?.map(c => c.id) || [])
        ),
        supabase.from('tarefas_checklists').delete().in('tarefa_id', taskIds),
        supabase.from('tarefas_anexos').delete().in('tarefa_id', taskIds),
        supabase.from('tarefas_responsaveis').delete().in('tarefa_id', taskIds),
      ]

      await Promise.all(deleteOperations)

      // Finally delete the tasks
      const { error: deleteError } = await supabase
        .from('tarefas')
        .delete()
        .in('id', taskIds)

      if (deleteError) throw deleteError

      toast({
        title: "Sucesso",
        description: `${taskIds.length} tarefa(s) excluída(s) permanentemente.`,
      })

      setSelectedTasks([])
      loadTasks()
    } catch (error) {
      console.error('Error deleting tasks permanently:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir as tarefas.",
        variant: "destructive",
      })
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

  const formatTime = (minutes?: number) => {
    if (!minutes || minutes === 0) return '0h 0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchTerm && !task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !task.descricao?.toLowerCase().includes(searchTerm.toLowerCase())) {
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
        <p className="text-muted-foreground">Carregando tarefas arquivadas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tarefas Arquivadas</h2>
          <p className="text-muted-foreground">Visualize e gerencie suas tarefas arquivadas</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadTasks}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

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
                  placeholder="Buscar tarefas arquivadas..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUnarchive(selectedTasks)}
                      className="h-8"
                    >
                      <Archive className="w-4 h-4 mr-1" />
                      Desarquivar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeletePermanently(selectedTasks)}
                      className="h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir Permanentemente
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
          <Card key={task.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-border" 
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                    />
                    <h4 className="font-medium text-card-foreground">{task.titulo}</h4>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className="bg-muted text-muted-foreground">
                      Arquivada
                    </Badge>
                    <Badge className={getPriorityColor(task.prioridade)}>
                      {task.prioridade.charAt(0).toUpperCase() + task.prioridade.slice(1)}
                    </Badge>
                  </div>
                  
                  {task.descricao && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {task.descricao}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{getResponsibleName(task)}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${getDateStatus(task.data_conclusao).className}`}>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(task.data_conclusao).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Tempo gasto: {formatTime(task.tempo_gasto_minutos)}</span>
                    </div>
                  </div>
                </div>
                
                {selectedTasks.length === 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleUnarchive([task.id])}>
                        <Archive className="w-4 h-4 mr-2" />
                        Desarquivar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setTaskToDelete(task)
                          setDeleteModalOpen(true)
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Permanentemente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card className="border-border bg-card min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Archive className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Nenhuma tarefa arquivada encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm || priorityFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca.' 
                    : 'Você ainda não possui tarefas arquivadas.'
                  }
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <DeleteTaskConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setTaskToDelete(null)
        }}
        onConfirm={() => {
          if (taskToDelete) {
            handleDeletePermanently([taskToDelete.id])
            setDeleteModalOpen(false)
            setTaskToDelete(null)
          }
        }}
        task={taskToDelete}
      />
    </div>
  )
}