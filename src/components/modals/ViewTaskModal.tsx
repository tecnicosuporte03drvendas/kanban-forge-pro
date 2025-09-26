import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, User, Users, MessageSquare, Activity, CheckSquare } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import type { TarefaCompleta, TarefaComentario, TarefaAtividade, PrioridadeTarefa, StatusTarefa } from '@/types/task'

interface ViewTaskModalProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityColors = {
  baixa: 'bg-gray-100 text-gray-700',
  media: 'bg-blue-100 text-blue-700', 
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
}

const statusColors = {
  criada: 'bg-gray-100 text-gray-700',
  assumida: 'bg-blue-100 text-blue-700',
  executando: 'bg-yellow-100 text-yellow-700',
  concluida: 'bg-green-100 text-green-700',
  validada: 'bg-purple-100 text-purple-700',
}

export function ViewTaskModal({ taskId, open, onOpenChange }: ViewTaskModalProps) {
  const [tarefa, setTarefa] = useState<TarefaCompleta | null>(null)
  const [loading, setLoading] = useState(false)
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  useEffect(() => {
    if (taskId && open) {
      loadTask()
    }
  }, [taskId, open])

  const loadTask = async () => {
    if (!taskId) return
    
    setLoading(true)
    try {
      // Load task basic data
      const { data: tarefaData, error: tarefaError } = await supabase
        .from('tarefas')
        .select('*')
        .eq('id', taskId)
        .single()

      if (tarefaError) throw tarefaError

      // Load responsibles
      const { data: responsaveisData } = await supabase
        .from('tarefas_responsaveis')
        .select(`
          *,
          usuarios:usuario_id(nome, email),
          equipes:equipe_id(nome, descricao)
        `)
        .eq('tarefa_id', taskId)

      // Load checklists with items
      const { data: checklistsData } = await supabase
        .from('tarefas_checklists')
        .select(`
          *,
          tarefas_checklist_itens(*)
        `)
        .eq('tarefa_id', taskId)

      // Load comments
      const { data: comentariosData } = await supabase
        .from('tarefas_comentarios')
        .select(`
          *,
          usuarios(nome)
        `)
        .eq('tarefa_id', taskId)
        .order('created_at', { ascending: false })

      // Load activities
      const { data: atividadesData } = await supabase
        .from('tarefas_atividades')
        .select(`
          *,
          usuarios(nome)
        `)
        .eq('tarefa_id', taskId)
        .order('created_at', { ascending: false })

      const tarefaCompleta: TarefaCompleta = {
        ...tarefaData,
        responsaveis: responsaveisData || [],
        checklists: checklistsData?.map(cl => ({
          ...cl,
          itens: cl.tarefas_checklist_itens || []
        })) || [],
        comentarios: comentariosData || [],
        atividades: atividadesData || [],
      }

      setTarefa(tarefaCompleta)
    } catch (error) {
      console.error('Error loading task:', error)
      toast({ title: 'Erro', description: 'Erro ao carregar tarefa', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const toggleChecklistItem = async (itemId: string, concluido: boolean) => {
    try {
      const { error } = await supabase
        .from('tarefas_checklist_itens')
        .update({ concluido: !concluido })
        .eq('id', itemId)

      if (error) throw error

      // Update local state
      setTarefa(prev => {
        if (!prev) return prev
        return {
          ...prev,
          checklists: prev.checklists.map(checklist => ({
            ...checklist,
            itens: checklist.itens.map(item =>
              item.id === itemId ? { ...item, concluido: !concluido } : item
            )
          }))
        }
      })

      // Create activity
      const { data: { user } } = await supabase.auth.getUser()
      if (user && tarefa) {
        await supabase.from('tarefas_atividades').insert({
          tarefa_id: tarefa.id,
          usuario_id: user.id,
          acao: concluido ? 'desmarcou' : 'marcou',
          descricao: `Item do checklist ${concluido ? 'desmarcado' : 'marcado'}`,
        })
      }

      loadTask() // Refresh to get new activity
    } catch (error) {
      console.error('Error updating checklist item:', error)
      toast({ title: 'Erro', description: 'Erro ao atualizar item', variant: 'destructive' })
    }
  }

  const enviarComentario = async () => {
    if (!novoComentario.trim() || !tarefa) return

    setEnviandoComentario(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' })
        return
      }

      const { error } = await supabase.from('tarefas_comentarios').insert({
        tarefa_id: tarefa.id,
        usuario_id: user.id,
        comentario: novoComentario.trim(),
      })

      if (error) throw error

      // Create activity
      await supabase.from('tarefas_atividades').insert({
        tarefa_id: tarefa.id,
        usuario_id: user.id,
        acao: 'comentou',
        descricao: 'Adicionou um comentário',
      })

      setNovoComentario('')
      toast({ title: 'Sucesso', description: 'Comentário adicionado!' })
      loadTask() // Refresh data
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({ title: 'Erro', description: 'Erro ao adicionar comentário', variant: 'destructive' })
    } finally {
      setEnviandoComentario(false)
    }
  }

  if (!tarefa) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            {loading ? 'Carregando...' : 'Tarefa não encontrada'}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {tarefa.titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 overflow-y-auto">
            {/* Task Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className={priorityColors[tarefa.prioridade]}>
                  {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
                </Badge>
                <Badge className={statusColors[tarefa.status]}>
                  {tarefa.status.charAt(0).toUpperCase() + tarefa.status.slice(1)}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(tarefa.data_conclusao), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {tarefa.horario_conclusao}
                </div>
              </div>

              {tarefa.descricao && (
                <div>
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{tarefa.descricao}</p>
                </div>
              )}
            </div>

            {/* Responsibles */}
            <div>
              <h4 className="font-medium mb-3">Responsáveis</h4>
              <div className="flex flex-wrap gap-2">
                {tarefa.responsaveis.map((responsavel) => (
                  <Badge key={responsavel.id} variant="outline" className="flex items-center gap-1">
                    {responsavel.usuario_id ? (
                      <>
                        <User className="h-3 w-3" />
                        {(responsavel as any).usuarios?.nome || 'Usuário'}
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3" />
                        {(responsavel as any).equipes?.nome || 'Equipe'}
                      </>
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Checklists */}
            {tarefa.checklists.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Checklists</h4>
                <div className="space-y-4">
                  {tarefa.checklists.map((checklist) => (
                    <div key={checklist.id} className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3">{checklist.titulo}</h5>
                      <div className="space-y-2">
                        {checklist.itens.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={item.concluido}
                              onCheckedChange={() => toggleChecklistItem(item.id, item.concluido)}
                            />
                            <span className={`text-sm ${item.concluido ? 'line-through text-muted-foreground' : ''}`}>
                              {item.item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Comments & Activities */}
          <div className="border-l pl-6 overflow-hidden">
            <Tabs defaultValue="comentarios" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comentarios">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Comentários
                </TabsTrigger>
                <TabsTrigger value="atividades">
                  <Activity className="h-4 w-4 mr-1" />
                  Atividade
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comentarios" className="flex-1 flex flex-col space-y-4">
                {/* Add Comment */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Adicione um comentário..."
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={enviarComentario} 
                    disabled={!novoComentario.trim() || enviandoComentario}
                    size="sm"
                  >
                    {enviandoComentario ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>

                <Separator />

                {/* Comments List */}
                <ScrollArea className="flex-1">
                  <div className="space-y-4">
                    {tarefa.comentarios.map((comentario) => (
                      <div key={comentario.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">{comentario.usuario?.nome || 'Usuário'}</span>
                          <span>•</span>
                          <span>{format(new Date(comentario.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                        </div>
                        <p className="text-sm">{comentario.comentario}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="atividades" className="flex-1">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {tarefa.atividades.map((atividade) => (
                      <div key={atividade.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">{atividade.usuario?.nome || 'Usuário'}</span>
                          <span>•</span>
                          <span>{format(new Date(atividade.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">{atividade.acao}</span>
                          {atividade.descricao && `: ${atividade.descricao}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}