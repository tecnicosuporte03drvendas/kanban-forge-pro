import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock, Users, Video, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface Usuario {
  id: string
  nome: string
}

interface Equipe {
  id: string
  nome: string
}

interface ResponsibleOption {
  type: 'usuario' | 'equipe'
  id: string
  name: string
}

const meetingSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  data_reuniao: z.date({ required_error: 'Data é obrigatória' }),
  horario_inicio: z.string().min(1, 'Horário é obrigatório'),
  duracao_minutos: z.number().min(1, 'Duração deve ser maior que zero'),
  link_reuniao: z.string().optional(),
  participantes: z.array(z.string()).min(1, 'Selecione pelo menos um participante'),
})

type MeetingFormData = z.infer<typeof meetingSchema>

interface CreateMeetingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMeetingCreated?: () => void
}

export function CreateMeetingModal({
  open,
  onOpenChange,
  onMeetingCreated,
}: CreateMeetingModalProps) {
  const [responsibleOptions, setResponsibleOptions] = useState<ResponsibleOption[]>([])
  const [loading, setLoading] = useState(false)
  const { usuario } = useAuth()
  const { toast } = useToast()

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      horario_inicio: '09:00',
      duracao_minutos: 60,
      link_reuniao: '',
      participantes: [],
    },
  })

  useEffect(() => {
    if (open && usuario?.empresa_id) {
      loadResponsibleOptions()
    }
  }, [open, usuario?.empresa_id])

  const loadResponsibleOptions = async () => {
    if (!usuario?.empresa_id) return

    try {
      const [usuariosResult, equipesResult] = await Promise.all([
        supabase
          .from('usuarios')
          .select('id, nome')
          .eq('empresa_id', usuario.empresa_id)
          .neq('tipo_usuario', 'master')
          .eq('ativo', true),
        supabase
          .from('equipes')
          .select('id, nome')
          .eq('empresa_id', usuario.empresa_id)
      ])

      if (usuariosResult.error) throw usuariosResult.error
      if (equipesResult.error) throw equipesResult.error

      const options: ResponsibleOption[] = []

      usuariosResult.data?.forEach((usuario: Usuario) => {
        options.push({
          type: 'usuario',
          id: usuario.id,
          name: usuario.nome,
        })
      })

      equipesResult.data?.forEach((equipe: Equipe) => {
        options.push({
          type: 'equipe',
          id: equipe.id,
          name: `Equipe: ${equipe.nome}`,
        })
      })

      setResponsibleOptions(options)
    } catch (error) {
      console.error('Erro ao carregar opções de responsáveis:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários e equipes',
        variant: 'destructive',
      })
    }
  }

  const onSubmit = async (data: MeetingFormData) => {
    if (!usuario?.empresa_id) return

    setLoading(true)
    try {
      // Criar reunião
      const { data: reuniao, error: reuniaoError } = await supabase
        .from('reunioes')
        .insert({
          titulo: data.titulo,
          descricao: data.descricao || null,
          data_reuniao: format(data.data_reuniao, 'yyyy-MM-dd'),
          horario_inicio: data.horario_inicio,
          duracao_minutos: data.duracao_minutos,
          link_reuniao: data.link_reuniao || null,
          empresa_id: usuario.empresa_id,
          criado_por: usuario.id,
        })
        .select()
        .single()

      if (reuniaoError) throw reuniaoError

      // Processar participantes (usuários e equipes)
      const participantesData = []
      const equipesIds = []
      const usuariosIds = []

      for (const participanteId of data.participantes) {
        const option = responsibleOptions.find(opt => opt.id === participanteId)
        if (!option) continue

        if (option.type === 'usuario') {
          usuariosIds.push(participanteId)
          participantesData.push({
            reuniao_id: reuniao.id,
            usuario_id: participanteId,
          })
        } else if (option.type === 'equipe') {
          equipesIds.push(participanteId)
          participantesData.push({
            reuniao_id: reuniao.id,
            equipe_id: participanteId,
          })

          // Buscar membros da equipe para adicionar individualmente
          const { data: membrosEquipe } = await supabase
            .from('usuarios_equipes')
            .select('usuario_id')
            .eq('equipe_id', participanteId)

          if (membrosEquipe) {
            membrosEquipe.forEach((membro) => {
              usuariosIds.push(membro.usuario_id)
              participantesData.push({
                reuniao_id: reuniao.id,
                usuario_id: membro.usuario_id,
              })
            })
          }
        }
      }

      // Salvar participantes
      if (participantesData.length > 0) {
        const { error: participantesError } = await supabase
          .from('reunioes_participantes')
          .insert(participantesData)

        if (participantesError) throw participantesError
      }

      // Enviar webhook para N8N
      try {
        await supabase.functions.invoke('notify-meeting-created', {
          body: {
            reuniao,
            participantes: {
              usuarios: usuariosIds,
              equipes: equipesIds,
            },
            empresa: {
              id: usuario.empresa_id,
              nome: usuario.empresa_id, // Pode buscar nome real depois
            },
            criador: {
              id: usuario.id,
              nome: usuario.nome,
            },
          },
        })
      } catch (webhookError) {
        console.error('Erro ao enviar webhook:', webhookError)
        // Não falha a criação se o webhook der erro
      }

      toast({
        title: 'Reunião criada!',
        description: 'A reunião foi criada com sucesso.',
      })

      form.reset()
      onMeetingCreated?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao criar reunião:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar reunião. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Nova Reunião
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o título da reunião" {...field} />
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
                      <Textarea 
                        placeholder="Descreva o objetivo da reunião"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data_reuniao"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data da Reunião *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
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
                  name="horario_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Horário *
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duracao_minutos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (minutos) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="60"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="link_reuniao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link da Reunião</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="participantes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Participantes *
                    </FormLabel>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      <div className="space-y-3">
                        {responsibleOptions.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={option.id}
                              checked={field.value?.includes(option.id) || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, option.id])
                                } else {
                                  field.onChange(
                                    field.value.filter((id: string) => id !== option.id)
                                  )
                                }
                              }}
                            />
                            <label
                              htmlFor={option.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option.name}
                            </label>
                          </div>
                        ))}
                        {responsibleOptions.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Carregando participantes...
                          </p>
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Reunião'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}