import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Users, 
  MessageSquare, 
  Activity, 
  CheckSquare, 
  AlertCircle, 
  Zap,
  Plus,
  Calendar,
  Paperclip,
  Hash,
  X,
  MoreHorizontal
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarComp } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { TarefaCompleta, TarefaComentario, TarefaAtividade, PrioridadeTarefa, StatusTarefa } from '@/types/task'

const taskSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  data_conclusao: z.date(),
  horario_conclusao: z.string().default('18:00'),
  responsaveis: z.array(z.string()).default([]),
})

interface TaskModalProps {
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

export function TaskModal({ taskId, open, onOpenChange, onTaskUpdated }: TaskModalProps) {
  const { usuario } = useAuth()
  const [tarefa, setTarefa] = useState<TarefaCompleta | null>(null)
  const [loading, setLoading] = useState(false)
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [responsibleOptions, setResponsibleOptions] = useState<ResponsibleOption[]>([])
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Edit states for inline editing
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const [tempDescription, setTempDescription] = useState('')

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      prioridade: 'media',
      horario_conclusao: '18:00',
      responsaveis: [],
    },
  })

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce(async (values: z.infer<typeof taskSchema>) => {
      if (!tarefa || !hasUnsavedChanges) return
      await saveTask(values)
    }, 1000),
    [tarefa, hasUnsavedChanges]
  )

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (tarefa && values.titulo && values.titulo !== tarefa.titulo) {
        setHasUnsavedChanges(true)
        debouncedSave(values as z.infer<typeof taskSchema>)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, tarefa, debouncedSave])

  useEffect(() => {
    if (taskId && open) {
      loadTask()
      loadResponsibleOptions()
    }
  }, [taskId, open])

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
      setTempTitle(tarefa.titulo)
      setTempDescription(tarefa.descricao || '')
    }
  }, [tarefa, form])

  const loadTask = async () => {
    if (!taskId) return
    
    setLoading(true)
    try {
      const { data: tarefaData, error: tarefaError } = await supabase
        .from('tarefas')
        .select('*')
        .eq('id', taskId)
        .single()

      if (tarefaError) throw tarefaError

      const { data: responsaveisData } = await supabase
        .from('tarefas_responsaveis')
        .select(`
          *,
          usuarios:usuario_id(nome, email),
          equipes:equipe_id(nome, descricao)
        `)
        .eq('tarefa_id', taskId)

      const { data: checklistsData } = await supabase
        .from('tarefas_checklists')
        .select(`
          *,
          tarefas_checklist_itens(*)
        `)
        .eq('tarefa_id', taskId)

      const { data: comentariosData } = await supabase
        .from('tarefas_comentarios')
        .select(`
          *,
          usuarios(nome)
        `)
        .eq('tarefa_id', taskId)
        .order('created_at', { ascending: false })

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

  const loadResponsibleOptions = async () => {
    const options: ResponsibleOption[] = []
    
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

  const saveTask = async (values: z.infer<typeof taskSchema>) => {
    if (!tarefa || !usuario) return

    setSaving(true)
    try {
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

      await supabase
        .from('tarefas_responsaveis')
        .delete()
        .eq('tarefa_id', tarefa.id)

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

      await supabase.from('tarefas_atividades').insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        acao: 'editou',
        descricao: 'Tarefa editada',
      })

      setHasUnsavedChanges(false)
      loadTask()
      onTaskUpdated?.()
    } catch (error) {
      console.error('Error saving task:', error)
      toast({ title: 'Erro', description: 'Erro ao salvar tarefa', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const enviarComentario = async () => {
    if (!novoComentario.trim() || !tarefa) return

    setEnviandoComentario(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('tarefas_comentarios').insert({
        tarefa_id: tarefa.id,
        usuario_id: user.id,
        comentario: novoComentario.trim(),
      })

      await supabase.from('tarefas_atividades').insert({
        tarefa_id: tarefa.id,
        usuario_id: user.id,
        acao: 'comentou',
        descricao: 'Adicionou um comentário',
      })

      setNovoComentario('')
      loadTask()
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({ title: 'Erro', description: 'Erro ao adicionar comentário', variant: 'destructive' })
    } finally {
      setEnviandoComentario(false)
    }
  }

  const handleTitleSave = async () => {
    if (!tarefa || tempTitle === tarefa.titulo) {
      setEditingTitle(false)
      return
    }

    const values = { ...form.getValues(), titulo: tempTitle }
    form.setValue('titulo', tempTitle)
    await saveTask(values)
    setEditingTitle(false)
  }

  const handleDescriptionSave = async () => {
    if (!tarefa || tempDescription === (tarefa.descricao || '')) {
      setEditingDescription(false)
      return
    }

    const values = { ...form.getValues(), descricao: tempDescription }
    form.setValue('descricao', tempDescription)
    await saveTask(values)
    setEditingDescription(false)
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
      case 'alta': return 'bg-priority-high text-white'
      case 'media': return 'bg-priority-medium text-white'
      case 'baixa': return 'bg-priority-low text-white'
    }
  }

  if (!tarefa) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            {loading ? 'Carregando...' : 'Tarefa não encontrada'}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3 flex-1">
            <CheckSquare className="h-5 w-5 text-primary" />
            {editingTitle ? (
              <div className="flex-1 flex items-center gap-2">
                <Input 
                  value={tempTitle} 
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-lg font-semibold border-none bg-transparent p-0 focus-visible:ring-0"
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTitleSave()
                    } else if (e.key === 'Escape') {
                      setTempTitle(tarefa.titulo)
                      setEditingTitle(false)
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <h1 
                className="text-lg font-semibold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded -mx-2 flex-1"
                onClick={() => setEditingTitle(true)}
              >
                {tarefa.titulo}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-sm text-muted-foreground">Salvando...</span>
            )}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 p-6 space-y-6 overflow-y-auto">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Datas
              </Button>
              <Button variant="outline" size="sm">
                <CheckSquare className="h-4 w-4 mr-1" />
                Checklist
              </Button>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-1" />
                Membros
              </Button>
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4 mr-1" />
                Anexo
              </Button>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Etiquetas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={getPriorityColor(tarefa.prioridade)}>
                  {getPriorityIcon(tarefa.prioridade)}
                  <span className="ml-1">{tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}</span>
                </Badge>
                <Badge variant="secondary" className="bg-tezeus-blue text-white">
                  Design
                </Badge>
                <Badge variant="secondary" className="bg-purple-500 text-white">
                  Design & UX
                </Badge>
                <Badge variant="secondary" className="bg-gray-500 text-white">
                  Documentação
                </Badge>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-sm">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-1 bg-muted rounded"></div>
                <span className="font-medium">Descrição</span>
              </div>
              
              {editingDescription ? (
                <Textarea 
                  value={tempDescription} 
                  onChange={(e) => setTempDescription(e.target.value)}
                  placeholder="Adicione uma descrição mais detalhada..."
                  className="min-h-[100px] resize-none"
                  onBlur={handleDescriptionSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setTempDescription(tarefa.descricao || '')
                      setEditingDescription(false)
                    }
                  }}
                  autoFocus
                />
              ) : (
                <div 
                  className="min-h-[100px] p-3 rounded-md border border-dashed border-muted-foreground/30 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setEditingDescription(true)}
                >
                  {tarefa.descricao ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{tarefa.descricao}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Adicione uma descrição mais detalhada...</p>
                  )}
                </div>
              )}
            </div>

            {/* Responsibles */}
            {tarefa.responsaveis.length > 0 && (
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
            )}

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
                              onCheckedChange={() => {}}
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

          {/* Right Column - Comments & Activity */}
          <div className="border-l border-border bg-muted/10 flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Comentários e atividade</span>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                Ocultar detalhes
              </Button>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Escrever um comentário..."
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <Button 
                  onClick={enviarComentario} 
                  disabled={!novoComentario.trim() || enviandoComentario}
                  size="sm"
                  className="w-full"
                >
                  {enviandoComentario ? 'Enviando...' : 'Comentar'}
                </Button>
              </div>

              <Separator />

              {/* Activity Feed */}
              <div className="space-y-4">
                {/* Activity example from image */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                    N
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">Nutra</span>
                      <span>adicionou este cartão a</span>
                      <span className="font-medium text-primary">Produto e UX Design</span>
                    </div>
                    <div className="text-xs text-muted-foreground">23 de jul. de 2025, 01:38</div>
                  </div>
                </div>

                {/* Comments */}
                {tarefa.comentarios.map((comentario) => (
                  <div key={comentario.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-medium">
                      {comentario.usuario?.nome?.[0] || 'U'}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{comentario.usuario?.nome || 'Usuário'}</span>
                        <span>{format(new Date(comentario.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                      </div>
                      <p className="text-sm bg-background border rounded-lg p-3">{comentario.comentario}</p>
                    </div>
                  </div>
                ))}

                {/* Activities */}
                {tarefa.atividades.map((atividade) => (
                  <div key={atividade.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{atividade.usuario?.nome || 'Usuário'}</span>
                        <span className="ml-1">{atividade.acao}</span>
                        {atividade.descricao && `: ${atividade.descricao}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(atividade.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}