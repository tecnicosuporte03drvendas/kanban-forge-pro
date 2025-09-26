import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, AlertCircle, Clock, User, Users, Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
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
  responsavel: z.string().optional(),
  categoria: z.string().optional(),
})

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}

export function CreateTaskModal({ open, onOpenChange, onTaskCreated }: CreateTaskModalProps) {
  const [responsibleOptions, setResponsibleOptions] = useState<ResponsibleOption[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      prioridade: 'media',
      horario_conclusao: '18:00',
      responsavel: '',
      categoria: '',
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

  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' })
        return
      }

      // Get user's empresa_id
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

      if (!usuario?.empresa_id) {
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
          criado_por: user.id,
        })
        .select()
        .single()

      if (tarefaError) throw tarefaError

      // Add responsible if selected
      if (values.responsavel) {
        const responsible = responsibleOptions.find(r => r.id === values.responsavel)
        if (responsible) {
          await supabase.from('tarefas_responsaveis').insert({
            tarefa_id: tarefa.id,
            usuario_id: responsible.type === 'user' ? responsible.id : null,
            equipe_id: responsible.type === 'team' ? responsible.id : null,
          })
        }
      }

      // Create activity record
      await supabase.from('tarefas_atividades').insert({
        tarefa_id: tarefa.id,
        usuario_id: user.id,
        acao: 'criou',
        descricao: 'Tarefa criada',
      })

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Nova Tarefa</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um responsável" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {responsibleOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center gap-2">
                            {option.type === 'user' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            {option.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      <SelectItem value="vendas">Vendas</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                      <SelectItem value="suporte">Suporte</SelectItem>
                      <SelectItem value="administrativo">Administrativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
      </DialogContent>
    </Dialog>
  )
}