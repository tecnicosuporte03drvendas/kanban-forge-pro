import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Video, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

interface Usuario {
  id: string;
  nome: string;
}

interface Equipe {
  id: string;
  nome: string;
}

interface ResponsibleOption {
  id: string;
  nome: string;
  type: 'user' | 'team';
}

const meetingSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório").max(100, "Título deve ter no máximo 100 caracteres"),
  descricao: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  data_reuniao: z.date({
    required_error: "Data da reunião é obrigatória",
  }),
  horario_inicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de horário inválido (HH:MM)"),
  duracao_minutos: z.number().min(15, "Duração mínima de 15 minutos").max(480, "Duração máxima de 8 horas"),
  link_reuniao: z.string().url("Link deve ser uma URL válida").optional().or(z.literal("")),
  participantes: z.array(z.string()).min(1, "Selecione pelo menos um participante"),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface EditMeetingModalProps {
  meetingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeetingUpdated?: () => void;
}

export const EditMeetingModal: React.FC<EditMeetingModalProps> = ({
  meetingId,
  open,
  onOpenChange,
  onMeetingUpdated,
}) => {
  const { usuario } = useAuth();
  const [responsibleOptions, setResponsibleOptions] = useState<ResponsibleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [meetingLoading, setMeetingLoading] = useState(false);

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      data_reuniao: new Date(),
      horario_inicio: "09:00",
      duracao_minutos: 60,
      link_reuniao: "",
      participantes: [],
    },
  });

  // Carregar dados da reunião quando o modal abrir
  useEffect(() => {
    if (open && meetingId && usuario?.empresa_id) {
      loadMeetingData();
      loadResponsibleOptions();
    }
  }, [open, meetingId, usuario?.empresa_id]);

  const loadMeetingData = async () => {
    if (!meetingId) return;
    
    setMeetingLoading(true);
    try {
      const { data: reuniao, error: reuniaoError } = await supabase
        .from('reunioes')
        .select(`
          *,
          reunioes_participantes(
            usuario_id,
            equipe_id
          )
        `)
        .eq('id', meetingId)
        .single();

      if (reuniaoError) throw reuniaoError;

      if (reuniao) {
        // Preparar participantes selecionados
        const participantesSelecionados = reuniao.reunioes_participantes?.map((p: any) => 
          p.usuario_id || p.equipe_id
        ) || [];

        form.reset({
          titulo: reuniao.titulo,
          descricao: reuniao.descricao || "",
          data_reuniao: new Date(reuniao.data_reuniao),
          horario_inicio: reuniao.horario_inicio,
          duracao_minutos: reuniao.duracao_minutos,
          link_reuniao: reuniao.link_reuniao || "",
          participantes: participantesSelecionados,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar reunião:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da reunião",
        variant: "destructive",
      });
    } finally {
      setMeetingLoading(false);
    }
  };

  const loadResponsibleOptions = async () => {
    if (!usuario?.empresa_id) return;

    try {
      // Buscar usuários da empresa (exceto master)
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome')
        .eq('empresa_id', usuario.empresa_id)
        .neq('tipo_usuario', 'master')
        .eq('ativo', true);

      if (usuariosError) throw usuariosError;

      // Buscar equipes da empresa
      const { data: equipes, error: equipesError } = await supabase
        .from('equipes')
        .select('id, nome')
        .eq('empresa_id', usuario.empresa_id);

      if (equipesError) throw equipesError;

      const options: ResponsibleOption[] = [
        ...(usuarios?.map((u: Usuario) => ({
          id: u.id,
          nome: u.nome,
          type: 'user' as const
        })) || []),
        ...(equipes?.map((e: Equipe) => ({
          id: e.id,
          nome: `Equipe: ${e.nome}`,
          type: 'team' as const
        })) || [])
      ];

      setResponsibleOptions(options);
    } catch (error) {
      console.error('Erro ao carregar opções de responsáveis:', error);
    }
  };

  const onSubmit = async (data: MeetingFormData) => {
    if (!meetingId) return;
    
    setLoading(true);
    try {
      // Atualizar reunião
      const { error: reuniaoError } = await supabase
        .from('reunioes')
        .update({
          titulo: data.titulo,
          descricao: data.descricao,
          data_reuniao: format(data.data_reuniao, 'yyyy-MM-dd'),
          horario_inicio: data.horario_inicio,
          duracao_minutos: data.duracao_minutos,
          link_reuniao: data.link_reuniao,
          updated_at: new Date().toISOString(),
        })
        .eq('id', meetingId);

      if (reuniaoError) throw reuniaoError;

      // Remover participantes existentes
      const { error: deleteError } = await supabase
        .from('reunioes_participantes')
        .delete()
        .eq('reuniao_id', meetingId);

      if (deleteError) throw deleteError;

      // Adicionar novos participantes
      const participantesData = [];

      for (const participanteId of data.participantes) {
        const option = responsibleOptions.find(opt => opt.id === participanteId);
        if (option) {
          if (option.type === 'user') {
            participantesData.push({
              reuniao_id: meetingId,
              usuario_id: participanteId,
              equipe_id: null
            });
          } else if (option.type === 'team') {
            // Buscar membros da equipe
            const { data: membros, error: membrosError } = await supabase
              .from('usuarios_equipes')
              .select('usuario_id')
              .eq('equipe_id', participanteId);

            if (!membrosError && membros) {
              for (const membro of membros) {
                participantesData.push({
                  reuniao_id: meetingId,
                  usuario_id: membro.usuario_id,
                  equipe_id: participanteId
                });
              }
            }
          }
        }
      }

      if (participantesData.length > 0) {
        const { error: participantesError } = await supabase
          .from('reunioes_participantes')
          .insert(participantesData);

        if (participantesError) throw participantesError;
      }

      toast({
        title: "Reunião atualizada",
        description: "A reunião foi atualizada com sucesso.",
      });

      onMeetingUpdated?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Erro ao atualizar reunião:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar a reunião. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Editar Reunião
          </DialogTitle>
        </DialogHeader>

        {meetingLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Carregando dados da reunião...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da Reunião</FormLabel>
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
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o objetivo e tópicos da reunião"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="data_reuniao"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data da Reunião</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
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
                            className="pointer-events-auto"
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
                        <Clock className="w-4 h-4" />
                        Horário de Início
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duracao_minutos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (minutos)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="15" 
                          max="480"
                          placeholder="60"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="link_reuniao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link da Reunião (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="url"
                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="participantes"
                render={() => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Participantes
                    </FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                      {responsibleOptions.map((option) => (
                        <FormField
                          key={option.id}
                          control={form.control}
                          name="participantes"
                          render={({ field }) => (
                            <FormItem
                              key={option.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, option.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== option.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {option.nome}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};