import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, AlertCircle, Clock, User, Users, Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useEffectiveUser } from '@/hooks/use-effective-user'
import { useStealth } from '@/hooks/use-stealth'
import type { PrioridadeTarefa } from '@/types/task'

interface Usuario {
  id: string;
  nome: string;
  email: string;
}

interface Equipe {
  id: string;
  nome: string;
  descricao?: string;
}

interface ResponsibleOption {
  id: string;
  nome: string;
  type: 'user' | 'team';
}

const taskSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  data_conclusao: z.date({
    required_error: 'Data de conclusão é obrigatória',
  }),
  horario_conclusao: z.string().default('18:00'),
  responsaveis: z.array(z.string()).default([]),
})

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}

export function CreateTaskModal({ open, onOpenChange, onTaskCreated }: CreateTaskModalProps) {
  const [responsibleOptions, setResponsibleOptions] = useState<ResponsibleOption[]>([])
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([])
  const [teamMembers, setTeamMembers] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const { usuario } = useEffectiveUser()
  const { shouldSuppressLogs } = useStealth()

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

  // Load users and teams when modal opens
  useEffect(() => {
    if (open) {
      loadResponsibleOptions()
    }
  }, [open])

  const loadResponsibleOptions = async () => {
    const options: ResponsibleOption[] = []
    
    if (!usuario?.empresa_id) return
    
    // Load users (excluding master users)
    const { data: usersData } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('ativo', true)
      .eq('empresa_id', usuario.empresa_id)
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
      .eq('empresa_id', usuario.empresa_id)
    
    if (teamsData) {
      options.push(...teamsData.map(e => ({ 
        id: e.id, 
        nome: e.nome, 
        type: 'team' as const 
      })))
    }

    setResponsibleOptions(options)
    
    // Load team members for all teams
    if (teamsData) {
      await loadTeamMembers(teamsData.map(t => t.id))
    }
  }

  const loadTeamMembers = async (teamIds: string[]) => {
    const { data: teamMembersData } = await supabase
      .from('usuarios_equipes')
      .select('equipe_id, usuario_id')
      .in('equipe_id', teamIds)
    
    if (teamMembersData) {
      const membersMap: Record<string, string[]> = {}
      teamMembersData.forEach(member => {
        if (!membersMap[member.equipe_id]) {
          membersMap[member.equipe_id] = []
        }
        membersMap[member.equipe_id].push(member.usuario_id)
      })
      setTeamMembers(membersMap)
    }
  }

  const isUserDisabled = (userId: string, selectedResponsibleIds: string[]) => {
    const selectedTeams = selectedResponsibleIds.filter(id => 
      responsibleOptions.find(option => option.id === id && option.type === 'team')
    )
    
    return selectedTeams.some(teamId => teamMembers[teamId]?.includes(userId))
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

  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    setLoading(true)
    try {
      if (!usuario) {
        toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' })
        return
      }

      if (!usuario.empresa_id) {
        toast({ title: 'Erro', description: 'Empresa não encontrada', variant: 'destructive' })
        return
      }

      // Create task
      const { data: tarefa, error: tarefaError } = await supabase
        .from('tarefas')
        .insert({
          titulo: values.titulo,
          descricao: values.descricao,
          prioridade: values.prioridade,
          data_conclusao: format(values.data_conclusao, 'yyyy-MM-dd'),
          horario_conclusao: values.horario_conclusao,
          empresa_id: usuario.empresa_id,
          criado_por: usuario.id,
        })
        .select()
        .single()

      if (tarefaError) throw tarefaError

      // Add responsibles if selected
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

      // Create activity record only if not in stealth mode
      if (!shouldSuppressLogs) {
        await supabase.from('tarefas_atividades').insert({
          tarefa_id: tarefa.id,
          usuario_id: usuario.id,
          acao: 'criou',
          descricao: 'Tarefa criada',
        })
      }

      toast({ title: 'Sucesso', description: 'Tarefa criada com sucesso!' })
      form.reset()
      onTaskCreated?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating task:', error)
      toast({ title: 'Erro', description: 'Erro ao criar tarefa', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-semibold">Nova Tarefa</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-6">
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
                    <Textarea {...field} placeholder="Descreva a tarefa" rows={2} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsaveis"
                render={({ field }) => {
                  const teams = responsibleOptions.filter(r => r.type === 'team')
                  const selectedTeams = (field.value || []).filter(id => 
                    teams.some(t => t.id === id)
                  )
                  
                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Equipes
                      </FormLabel>
                      <Select
                        value=""
                        onValueChange={(teamId) => {
                          const updatedValue = field.value || []
                          if (!updatedValue.includes(teamId)) {
                            field.onChange([...updatedValue, teamId])
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione equipes" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem 
                              key={team.id} 
                              value={team.id}
                              disabled={selectedTeams.includes(team.id)}
                            >
                              {team.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTeams.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTeams.map((teamId) => {
                            const team = teams.find(t => t.id === teamId)
                            return (
                              <Badge key={teamId} variant="secondary" className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {team?.nome}
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange((field.value || []).filter(id => id !== teamId))
                                  }}
                                  className="ml-1 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name="responsaveis"
                render={({ field }) => {
                  const users = responsibleOptions.filter(r => r.type === 'user')
                  const selectedUsers = (field.value || []).filter(id => 
                    users.some(u => u.id === id)
                  )
                  
                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Colaboradores
                      </FormLabel>
                      <Select
                        value=""
                        onValueChange={(userId) => {
                          const updatedValue = field.value || []
                          if (!updatedValue.includes(userId)) {
                            field.onChange([...updatedValue, userId])
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione colaboradores" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => {
                            const isDisabled = isUserDisabled(user.id, field.value || [])
                            return (
                              <SelectItem 
                                key={user.id} 
                                value={user.id}
                                disabled={isDisabled || selectedUsers.includes(user.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {user.nome}
                                  {isDisabled && <span className="text-xs text-muted-foreground">(na equipe)</span>}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedUsers.map((userId) => {
                            const user = users.find(u => u.id === userId)
                            return (
                              <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {user?.nome}
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange((field.value || []).filter(id => id !== userId))
                                  }}
                                  className="ml-1 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_conclusao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Conclusão</FormLabel>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
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
                          onSelect={(date) => {
                            field.onChange(date)
                            setDatePickerOpen(false)
                          }}
                          disabled={false}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
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
                      <Input 
                        type="time" 
                        {...field} 
                        className="[color-scheme:dark]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary-hover">
                {loading ? 'Criando...' : 'Criar Tarefa'}
              </Button>
              </div>
            </form>
          </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}