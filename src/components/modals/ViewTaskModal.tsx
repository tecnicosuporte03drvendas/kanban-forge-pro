import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock, User, Users, MessageSquare, Activity, CheckSquare, Edit, Save, X, AlertCircle, Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { TarefaCompleta, TarefaComentario, TarefaAtividade, PrioridadeTarefa, StatusTarefa } from '@/types/task'

const taskEditSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  data_conclusao: z.date({
    required_error: 'Data de conclusão é obrigatória',
  }),
  horario_conclusao: z.string().default('18:00'),
  responsaveis: z.array(z.string()).default([]),
})

interface ViewTaskModalProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
}

interface ResponsibleOption {
  id: string;
  nome: string;
  type: 'user' | 'team';
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

export function ViewTaskModal({ taskId, open, onOpenChange, onTaskUpdated }: ViewTaskModalProps) {
  const { usuario } = useAuth()
  const [tarefa, setTarefa] = useState<TarefaCompleta | null>(null)
  const [loading, setLoading] = useState(false)
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [responsibleOptions, setResponsibleOptions] = useState<ResponsibleOption[]>([])
  const [saving, setSaving] = useState(false)

  const form = useForm<z.infer<typeof taskEditSchema>>({
    resolver: zodResolver(taskEditSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      prioridade: 'media',
      horario_conclusao: '18:00',
      responsaveis: [],
    },
  })

  useEffect(() => {
    if (taskId && open) {
      loadTask()
      loadResponsibleOptions()
    }
  }, [taskId, open])

  // Update form when task data changes
  useEffect(() => {
    if (tarefa) {
      form.reset({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        prioridade: tarefa.prioridade,
        data_conclusao: new Date(tarefa.data_conclusao),
        horario_conclusao: tarefa.horario_conclusao,
        responsaveis: tarefa.responsaveis.map(r => r.usuario_id || r.equipe_id || '').filter(Boolean),
      })
    }
  }, [tarefa, form])

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
      const { data: comentariosData, error: comentariosError } = await supabase
        .from('tarefas_comentarios')
        .select(`
          id,
          tarefa_id,
          usuario_id,
          comentario,
          created_at,
          usuarios!usuario_id(nome)
        `)
        .eq('tarefa_id', taskId)
        .order('created_at', { ascending: false })

      if (comentariosError) {
        console.error('Error loading comments:', comentariosError)
      }

      // Load activities
      const { data: atividadesData, error: atividadesError } = await supabase
        .from('tarefas_atividades')
        .select(`
          id,
          tarefa_id,
          usuario_id,
          acao,
          descricao,
          created_at,
          usuarios!usuario_id(nome)
        `)
        .eq('tarefa_id', taskId)
        .order('created_at', { ascending: false })

      if (atividadesError) {
        console.error('Error loading activities:', atividadesError)
      }

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
      if (usuario && tarefa) {
        await supabase.from('tarefas_atividades').insert({
          tarefa_id: tarefa.id,
          usuario_id: usuario.id,
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

  const loadResponsibleOptions = async () => {
    const options: ResponsibleOption[] = []
    
    // Load users (excluding master users)
    const { data: usersData } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('ativo', true)
      .neq('tipo_usuario', 'master')
    
    if (usersData) {
      options.push(...usersData.map(u => ({ 
        id: u.id, 
        nome: u.nome, 
        type: 'user' as const 
      })))
    }

    // Load teams
    const { data: teamsData } = await supabase
      .from('equipes')
      .select('id, nome, descricao')
    
    if (teamsData) {
      options.push(...teamsData.map(e => ({ 
        id: e.id, 
        nome: e.nome, 
        type: 'team' as const 
      })))
    }

    setResponsibleOptions(options)
  }

  const getPriorityIcon = (priority: PrioridadeTarefa) => {
    switch (priority) {
      case 'urgente': return <Zap className="w-4 h-4" />
      case 'alta': return <AlertCircle className="w-4 h-4" />
      case 'media': return <Clock className="w-4 h-4" />
      case 'baixa': return <Clock className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: PrioridadeTarefa) => {
    switch (priority) {
      case 'urgente': return 'bg-red-500 text-white'
      case 'alta': return 'bg-orange-500 text-white'
      case 'media': return 'bg-yellow-500 text-white'
      case 'baixa': return 'bg-green-500 text-white'
    }
  }

  const handleSaveTask = async (values: z.infer<typeof taskEditSchema>) => {
    if (!tarefa || !usuario) return

    setSaving(true)
    try {
      // Update task
      const { error: tarefaError } = await supabase
        .from('tarefas')
        .update({
          titulo: values.titulo,
          descricao: values.descricao || null,
          prioridade: values.prioridade,
          data_conclusao: format(values.data_conclusao, 'yyyy-MM-dd'),
          horario_conclusao: values.horario_conclusao,
        })
        .eq('id', tarefa.id)

      if (tarefaError) throw tarefaError

      // Update responsibles - first delete existing ones
      await supabase
        .from('tarefas_responsaveis')
        .delete()
        .eq('tarefa_id', tarefa.id)

      // Add new responsibles if selected
      if (values.responsaveis && values.responsaveis.length > 0) {
        const responsibleInserts = values.responsaveis.map(responsibleId => {
          const responsible = responsibleOptions.find(r => r.id === responsibleId)
          if (responsible) {
            return {
              tarefa_id: tarefa.id,
              usuario_id: responsible.type === 'user' ? responsible.id : null,
              equipe_id: responsible.type === 'team' ? responsible.id : null,
            }
          }
          return null
        }).filter(Boolean)

        if (responsibleInserts.length > 0) {
          await supabase.from('tarefas_responsaveis').insert(responsibleInserts)
        }
      }

      // Create activity record
      await supabase.from('tarefas_atividades').insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        acao: 'editou',
        descricao: 'Tarefa editada',
      })

      toast({ title: 'Sucesso', description: 'Tarefa atualizada com sucesso!' })
      setIsEditing(false)
      loadTask() // Refresh data
      onTaskUpdated?.()
    } catch (error) {
      console.error('Error updating task:', error)
      toast({ title: 'Erro', description: 'Erro ao atualizar tarefa', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const enviarComentario = async () => {
    if (!novoComentario.trim() || !tarefa) return

    setEnviandoComentario(true)
    try {
      if (!usuario) {
        toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' })
        return
      }

      const { error } = await supabase.from('tarefas_comentarios').insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        comentario: novoComentario.trim(),
      })

      if (error) throw error

      // Create activity
      await supabase.from('tarefas_atividades').insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
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
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              {isEditing ? 'Editando Tarefa' : tarefa.titulo}
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={form.handleSubmit(handleSaveTask)}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 overflow-y-auto">
            {isEditing ? (
              /* Edit Mode */
              <Form {...form}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Tarefa</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite o título da tarefa" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Descreva a tarefa" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prioridade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baixa">
                              <div className="flex items-center gap-2">
                                {getPriorityIcon('baixa')}
                                <span>Baixa</span>
                                <Badge className={getPriorityColor('baixa')}>Baixa</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="media">
                              <div className="flex items-center gap-2">
                                {getPriorityIcon('media')}
                                <span>Média</span>
                                <Badge className={getPriorityColor('media')}>Média</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="alta">
                              <div className="flex items-center gap-2">
                                {getPriorityIcon('alta')}
                                <span>Alta</span>
                                <Badge className={getPriorityColor('alta')}>Alta</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="urgente">
                              <div className="flex items-center gap-2">
                                {getPriorityIcon('urgente')}
                                <span>Urgente</span>
                                <Badge className={getPriorityColor('urgente')}>Urgente</Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsaveis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsáveis</FormLabel>
                        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                          {responsibleOptions.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={option.id}
                                checked={field.value?.includes(option.id) || false}
                                onCheckedChange={(checked) => {
                                  const updatedValue = field.value || []
                                  if (checked) {
                                    field.onChange([...updatedValue, option.id])
                                  } else {
                                    field.onChange(updatedValue.filter((id) => id !== option.id))
                                  }
                                }}
                              />
                              <label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer text-sm">
                                {option.type === 'user' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                {option.nome}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="data_conclusao"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Conclusão</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'dd/MM/yyyy')
                                  ) : (
                                    <span>Selecionar</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="horario_conclusao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Form>
            ) : (
              /* View Mode */
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge className={priorityColors[tarefa.prioridade]}>
                    {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
                  </Badge>
                  <Badge className={statusColors[tarefa.status]}>
                    {tarefa.status.charAt(0).toUpperCase() + tarefa.status.slice(1)}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
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
            )}

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