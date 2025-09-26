import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Plus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
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

interface Checklist {
  titulo: string;
  itens: string[];
}

const taskSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  data_conclusao: z.date({
    required_error: 'Data de conclusão é obrigatória',
  }),
  horario_conclusao: z.string().default('18:00'),
  usuarios_selecionados: z.array(z.string()).default([]),
  equipes_selecionadas: z.array(z.string()).default([]),
})

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}

export function CreateTaskModal({ open, onOpenChange, onTaskCreated }: CreateTaskModalProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      prioridade: 'media',
      horario_conclusao: '18:00',
      usuarios_selecionados: [],
      equipes_selecionadas: [],
    },
  })

  // Load users and teams when modal opens
  useEffect(() => {
    if (open) {
      loadUsuarios()
      loadEquipes()
    }
  }, [open])

  const loadUsuarios = async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('ativo', true)
    
    if (data) setUsuarios(data)
  }

  const loadEquipes = async () => {
    const { data } = await supabase
      .from('equipes')
      .select('id, nome, descricao')
    
    if (data) setEquipes(data)
  }

  const addChecklist = () => {
    setChecklists([...checklists, { titulo: '', itens: [''] }])
  }

  const removeChecklist = (index: number) => {
    setChecklists(checklists.filter((_, i) => i !== index))
  }

  const updateChecklistTitulo = (index: number, titulo: string) => {
    const updated = [...checklists]
    updated[index].titulo = titulo
    setChecklists(updated)
  }

  const addChecklistItem = (checklistIndex: number) => {
    const updated = [...checklists]
    updated[checklistIndex].itens.push('')
    setChecklists(updated)
  }

  const removeChecklistItem = (checklistIndex: number, itemIndex: number) => {
    const updated = [...checklists]
    updated[checklistIndex].itens = updated[checklistIndex].itens.filter((_, i) => i !== itemIndex)
    setChecklists(updated)
  }

  const updateChecklistItem = (checklistIndex: number, itemIndex: number, value: string) => {
    const updated = [...checklists]
    updated[checklistIndex].itens[itemIndex] = value
    setChecklists(updated)
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

      // Add responsibles (users)
      if (values.usuarios_selecionados.length > 0) {
        await supabase.from('tarefas_responsaveis').insert(
          values.usuarios_selecionados.map(usuarioId => ({
            tarefa_id: tarefa.id,
            usuario_id: usuarioId,
          }))
        )
      }

      // Add responsibles (teams)
      if (values.equipes_selecionadas.length > 0) {
        await supabase.from('tarefas_responsaveis').insert(
          values.equipes_selecionadas.map(equipeId => ({
            tarefa_id: tarefa.id,
            equipe_id: equipeId,
          }))
        )
      }

      // Add checklists
      for (const checklist of checklists) {
        if (checklist.titulo.trim()) {
          const { data: checklistData } = await supabase
            .from('tarefas_checklists')
            .insert({
              tarefa_id: tarefa.id,
              titulo: checklist.titulo,
            })
            .select()
            .single()

          if (checklistData) {
            const items = checklist.itens.filter(item => item.trim())
            if (items.length > 0) {
              await supabase.from('tarefas_checklist_itens').insert(
                items.map(item => ({
                  checklist_id: checklistData.id,
                  item,
                }))
              )
            }
          }
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
      setChecklists([])
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Tarefa *</FormLabel>
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
                      <FormLabel>Prioridade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
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
                        <FormLabel>Data de Conclusão *</FormLabel>
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
                                  <span>Selecionar data</span>
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
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Responsáveis */}
                <div>
                  <Label className="text-sm font-medium">Responsáveis</Label>
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Usuários</Label>
                      <div className="space-y-2 mt-1 max-h-32 overflow-y-auto">
                        {usuarios.map((usuario) => (
                          <FormField
                            key={usuario.id}
                            control={form.control}
                            name="usuarios_selecionados"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(usuario.id)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...(field.value || []), usuario.id]
                                        : (field.value || []).filter((value) => value !== usuario.id)
                                      field.onChange(updatedValue)
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {usuario.nome}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Equipes</Label>
                      <div className="space-y-2 mt-1">
                        {equipes.map((equipe) => (
                          <FormField
                            key={equipe.id}
                            control={form.control}
                            name="equipes_selecionadas"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(equipe.id)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...(field.value || []), equipe.id]
                                        : (field.value || []).filter((value) => value !== equipe.id)
                                      field.onChange(updatedValue)
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {equipe.nome}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklists */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Checklists</Label>
                <Button type="button" variant="outline" size="sm" onClick={addChecklist}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Checklist
                </Button>
              </div>
              
              <div className="space-y-4 mt-3">
                {checklists.map((checklist, checklistIndex) => (
                  <div key={checklistIndex} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Título do checklist"
                        value={checklist.titulo}
                        onChange={(e) => updateChecklistTitulo(checklistIndex, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChecklist(checklistIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {checklist.itens.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-2">
                          <Input
                            placeholder="Item do checklist"
                            value={item}
                            onChange={(e) => updateChecklistItem(checklistIndex, itemIndex, e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChecklistItem(checklistIndex, itemIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addChecklistItem(checklistIndex)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Item
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Tarefa'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}