import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, User, Users, MessageSquare, Activity, CheckSquare, AlertCircle, Zap, MoreHorizontal, Archive } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffectiveUser } from '@/hooks/use-effective-user';
import { TaskResponsibles } from './TaskResponsibles';
import { TaskDatePicker } from './TaskDatePicker';
import { parseLocalDate } from '@/utils/date-utils';
import type { TarefaCompleta, TarefaComentario, TarefaAtividade, PrioridadeTarefa, StatusTarefa } from '@/types/task';
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
  urgente: 'bg-red-100 text-red-700'
};
const statusColors = {
  criada: 'bg-gray-100 text-gray-700',
  assumida: 'bg-blue-100 text-blue-700',
  executando: 'bg-yellow-100 text-yellow-700',
  concluida: 'bg-green-100 text-green-700',
  validada: 'bg-purple-100 text-purple-700'
};
export function ViewTaskModal({
  taskId,
  open,
  onOpenChange,
  onTaskUpdated
}: ViewTaskModalProps) {
  const {
    usuario
  } = useEffectiveUser();
  const [tarefa, setTarefa] = useState<TarefaCompleta | null>(null);
  const [loading, setLoading] = useState(false);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [responsibleOptions, setResponsibleOptions] = useState<ResponsibleOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [visibleActivities, setVisibleActivities] = useState(5);

  // Edit states for inline editing
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  useEffect(() => {
    if (taskId && open) {
      loadTask();
      loadResponsibleOptions();
    } else if (!open) {
      // Limpar dados ao fechar o modal
      setTarefa(null);
      setNovoComentario('');
      setEditingDescription(false);
      setTempDescription('');
      setEditingTitle(false);
      setTempTitle('');
      setVisibleActivities(5);
    }
  }, [taskId, open]);
  useEffect(() => {
    if (tarefa) {
      setTempDescription(tarefa.descricao || '');
      setTempTitle(tarefa.titulo || '');
    }
  }, [tarefa]);
  const loadTask = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      // Load task basic data
      const {
        data: tarefaData,
        error: tarefaError
      } = await supabase.from('tarefas').select('*').eq('id', taskId).single();
      if (tarefaError) throw tarefaError;

      // Load responsibles
      const {
        data: responsaveisData
      } = await supabase.from('tarefas_responsaveis').select(`
          *,
          usuarios:usuario_id(nome, email),
          equipes:equipe_id(nome, descricao)
        `).eq('tarefa_id', taskId);

      // Load checklists with items
      const {
        data: checklistsData
      } = await supabase.from('tarefas_checklists').select(`
          *,
          tarefas_checklist_itens(*)
        `).eq('tarefa_id', taskId);

      // Load comments
      const {
        data: comentariosData,
        error: comentariosError
      } = await supabase.from('tarefas_comentarios').select(`
          id,
          tarefa_id,
          usuario_id,
          comentario,
          created_at,
          usuarios!usuario_id(nome)
        `).eq('tarefa_id', taskId).order('created_at', {
        ascending: false
      });
      if (comentariosError) {
        console.error('Error loading comments:', comentariosError);
      }

      // Load activities
      const {
        data: atividadesData,
        error: atividadesError
      } = await supabase.from('tarefas_atividades').select(`
          id,
          tarefa_id,
          usuario_id,
          acao,
          descricao,
          created_at,
          usuarios!usuario_id(nome)
        `).eq('tarefa_id', taskId).order('created_at', {
        ascending: false
      });
      if (atividadesError) {
        console.error('Error loading activities:', atividadesError);
      }
      const tarefaCompleta: TarefaCompleta = {
        ...tarefaData,
        responsaveis: responsaveisData || [],
        checklists: checklistsData?.map(cl => ({
          ...cl,
          itens: cl.tarefas_checklist_itens || []
        })) || [],
        comentarios: comentariosData || [],
        atividades: atividadesData || []
      };
      setTarefa(tarefaCompleta);
    } catch (error) {
      console.error('Error loading task:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar tarefa',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const toggleChecklistItem = async (itemId: string, concluido: boolean) => {
    try {
      const {
        error
      } = await supabase.from('tarefas_checklist_itens').update({
        concluido: !concluido
      }).eq('id', itemId);
      if (error) throw error;

      // Update local state
      setTarefa(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          checklists: prev.checklists.map(checklist => ({
            ...checklist,
            itens: checklist.itens.map(item => item.id === itemId ? {
              ...item,
              concluido: !concluido
            } : item)
          }))
        };
      });

      // Create activity
      if (usuario && tarefa) {
        await supabase.from('tarefas_atividades').insert({
          tarefa_id: tarefa.id,
          usuario_id: usuario.id,
          acao: concluido ? 'desmarcou' : 'marcou',
          descricao: `Item do checklist ${concluido ? 'desmarcado' : 'marcado'}`
        });
      }
      loadTask(); // Refresh to get new activity
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar item',
        variant: 'destructive'
      });
    }
  };
  const loadResponsibleOptions = async () => {
    const options: ResponsibleOption[] = [];
    const members: Record<string, string[]> = {};
    if (!usuario?.empresa_id) return;

    // Load users (excluding master users)
    const {
      data: usersData
    } = await supabase.from('usuarios').select('id, nome, email').eq('ativo', true).eq('empresa_id', usuario.empresa_id).neq('tipo_usuario', 'master');
    if (usersData) {
      options.push(...usersData.map(u => ({
        id: u.id,
        nome: u.nome,
        type: 'user' as const
      })));
    }

    // Load teams
    const {
      data: teamsData
    } = await supabase.from('equipes').select('id, nome, descricao').eq('empresa_id', usuario.empresa_id);
    if (teamsData) {
      options.push(...teamsData.map(e => ({
        id: e.id,
        nome: e.nome,
        type: 'team' as const
      })));

      // Load team members
      for (const team of teamsData) {
        const {
          data: teamMembersData
        } = await supabase.from('usuarios_equipes').select('usuario_id').eq('equipe_id', team.id);
        if (teamMembersData) {
          members[team.id] = teamMembersData.map(m => m.usuario_id);
        }
      }
    }
    setResponsibleOptions(options);
    setTeamMembers(members);
  };
  const getPriorityIcon = (priority: PrioridadeTarefa) => {
    switch (priority) {
      case 'urgente':
        return <Zap className="w-4 h-4" />;
      case 'alta':
        return <AlertCircle className="w-4 h-4" />;
      case 'media':
        return <Clock className="w-4 h-4" />;
      case 'baixa':
        return <Clock className="w-4 h-4" />;
    }
  };
  const getPriorityColor = (priority: PrioridadeTarefa) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-500 text-white';
      case 'alta':
        return 'bg-orange-500 text-white';
      case 'media':
        return 'bg-yellow-500 text-white';
      case 'baixa':
        return 'bg-green-500 text-white';
    }
  };
  const handleTitleSave = async () => {
    if (!tarefa || !usuario || !tempTitle.trim() || tempTitle === tarefa.titulo) {
      setEditingTitle(false);
      return;
    }
    const previousTitle = tarefa.titulo;

    // Optimistic update - atualizar UI imediatamente
    setTarefa({
      ...tarefa,
      titulo: tempTitle.trim()
    });
    setEditingTitle(false);

    // Fazer update no banco em segundo plano
    setSaving(true);
    try {
      const {
        error
      } = await supabase.from('tarefas').update({
        titulo: tempTitle.trim()
      }).eq('id', tarefa.id);
      if (error) throw error;
      await supabase.from('tarefas_atividades').insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        acao: 'editou',
        descricao: 'Alterou o título da tarefa'
      });
      loadTask();
      onTaskUpdated?.();
    } catch (error) {
      console.error('Error saving title:', error);
      // Reverter para título anterior em caso de erro
      setTarefa({
        ...tarefa,
        titulo: previousTitle
      });
      toast({
        title: 'Erro',
        description: 'Erro ao salvar título',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  const handleDescriptionSave = async () => {
    if (!tarefa || !usuario || tempDescription === (tarefa.descricao || '')) {
      setEditingDescription(false);
      return;
    }
    const previousDescription = tarefa.descricao;

    // Optimistic update - atualizar UI imediatamente
    setTarefa({
      ...tarefa,
      descricao: tempDescription || null
    });
    setEditingDescription(false);

    // Fazer update no banco em segundo plano
    setSaving(true);
    try {
      const {
        error
      } = await supabase.from('tarefas').update({
        descricao: tempDescription || null
      }).eq('id', tarefa.id);
      if (error) throw error;
      const oldDesc = previousDescription || '';
      let activityDesc = '';
      if (!oldDesc && tempDescription) {
        activityDesc = 'Adicionou descrição';
      } else if (oldDesc && !tempDescription) {
        activityDesc = 'Removeu a descrição';
      } else {
        activityDesc = 'Alterou a descrição';
      }
      await supabase.from('tarefas_atividades').insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        acao: 'editou',
        descricao: activityDesc
      });
      loadTask();
      onTaskUpdated?.();
    } catch (error) {
      console.error('Error saving description:', error);
      // Reverter para descrição anterior em caso de erro
      setTarefa({
        ...tarefa,
        descricao: previousDescription
      });
      toast({
        title: 'Erro',
        description: 'Erro ao salvar descrição',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  const enviarComentario = async () => {
    if (!novoComentario.trim() || !tarefa || !usuario) return;
    const tempComment = {
      id: `temp-${Date.now()}`,
      tarefa_id: tarefa.id,
      usuario_id: usuario.id,
      comentario: novoComentario.trim(),
      created_at: new Date().toISOString(),
      usuario: {
        nome: usuario.nome
      }
    };

    // Optimistic update - adicionar comentário imediatamente na UI
    setTarefa({
      ...tarefa,
      comentarios: [tempComment, ...tarefa.comentarios]
    });
    setNovoComentario('');

    // Salvar no banco em segundo plano
    setEnviandoComentario(true);
    try {
      const {
        error
      } = await supabase.from('tarefas_comentarios').insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        comentario: tempComment.comentario
      });
      if (error) throw error;

      // Create activity
      await supabase.from('tarefas_atividades').insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        acao: 'comentou',
        descricao: 'Adicionou um comentário'
      });
      loadTask(); // Refresh data
      onTaskUpdated?.();
    } catch (error) {
      console.error('Error adding comment:', error);
      // Reverter em caso de erro
      setTarefa({
        ...tarefa,
        comentarios: tarefa.comentarios.filter(c => c.id !== tempComment.id)
      });
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar comentário',
        variant: 'destructive'
      });
    } finally {
      setEnviandoComentario(false);
    }
  };
  const handleArchiveTask = async () => {
    if (!tarefa || !usuario) return;
    setArchiving(true);
    try {
      const {
        error
      } = await supabase.from('tarefas').update({
        arquivada: true
      }).eq('id', tarefa.id);
      if (error) throw error;

      // Create activity record
      await supabase.from('tarefas_atividades').insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        acao: 'arquivou',
        descricao: 'Tarefa arquivada'
      });
      toast({
        title: 'Sucesso',
        description: 'Tarefa arquivada com sucesso!'
      });
      onOpenChange(false);
      onTaskUpdated?.();
    } catch (error) {
      console.error('Error archiving task:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao arquivar tarefa',
        variant: 'destructive'
      });
    } finally {
      setArchiving(false);
    }
  };
  if (!tarefa) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            {loading ? 'Carregando...' : 'Tarefa não encontrada'}
          </div>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {editingTitle ? <input type="text" value={tempTitle} onChange={e => setTempTitle(e.target.value)} onBlur={handleTitleSave} onKeyDown={e => {
            if (e.key === 'Enter') {
              handleTitleSave();
            } else if (e.key === 'Escape') {
              setTempTitle(tarefa.titulo);
              setEditingTitle(false);
            }
          }} className="flex-1 text-lg font-semibold bg-transparent border-b-2 border-primary focus:outline-none px-2 py-1" autoFocus /> : <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setEditingTitle(true)}>
                <CheckSquare className="h-5 w-5" />
                {tarefa.titulo}
              </div>}
            <div className="flex items-center gap-2">
              {saving && <span className="text-sm text-muted-foreground">Salvando...</span>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={e => e.preventDefault()}>
                        <Archive className="h-4 w-4 mr-2" />
                        Arquivar Tarefa
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Arquivar Tarefa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja arquivar esta tarefa? A tarefa será movida para o arquivo e não aparecerá mais na lista de tarefas ativas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchiveTask} disabled={archiving}>
                          {archiving ? 'Arquivando...' : 'Arquivar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 overflow-y-auto p-6">
            {/* Date and Time Picker */}
            <div className="flex items-center gap-4 flex-wrap">
              <TaskDatePicker date={parseLocalDate(tarefa.data_conclusao)} time={tarefa.horario_conclusao} onDateChange={async date => {
              if (!tarefa || !usuario) return;
              const previousDate = tarefa.data_conclusao;

              // Optimistic update
              setTarefa({
                ...tarefa,
                data_conclusao: format(date, 'yyyy-MM-dd')
              });
              setSaving(true);
              try {
                const {
                  error
                } = await supabase.from('tarefas').update({
                  data_conclusao: format(date, 'yyyy-MM-dd')
                }).eq('id', tarefa.id);
                if (error) throw error;
                await supabase.from('tarefas_atividades').insert({
                  tarefa_id: tarefa.id,
                  usuario_id: usuario.id,
                  acao: 'editou',
                  descricao: `Alterou a data de conclusão para ${format(date, 'dd/MM/yyyy')}`
                });
                loadTask();
                onTaskUpdated?.();
              } catch (error) {
                console.error('Error saving date:', error);
                setTarefa({
                  ...tarefa,
                  data_conclusao: previousDate
                });
                toast({
                  title: 'Erro',
                  description: 'Erro ao salvar data',
                  variant: 'destructive'
                });
              } finally {
                setSaving(false);
              }
            }} onTimeChange={async time => {
              if (!tarefa || !usuario) return;
              const previousTime = tarefa.horario_conclusao;

              // Optimistic update
              setTarefa({
                ...tarefa,
                horario_conclusao: time
              });
              setSaving(true);
              try {
                const {
                  error
                } = await supabase.from('tarefas').update({
                  horario_conclusao: time
                }).eq('id', tarefa.id);
                if (error) throw error;
                await supabase.from('tarefas_atividades').insert({
                  tarefa_id: tarefa.id,
                  usuario_id: usuario.id,
                  acao: 'editou',
                  descricao: `Alterou o horário de conclusão para ${time}`
                });
                loadTask();
                onTaskUpdated?.();
              } catch (error) {
                console.error('Error saving time:', error);
                setTarefa({
                  ...tarefa,
                  horario_conclusao: previousTime
                });
                toast({
                  title: 'Erro',
                  description: 'Erro ao salvar horário',
                  variant: 'destructive'
                });
              } finally {
                setSaving(false);
              }
            }} />
            </div>

            {/* Status and Priority Badges */}
            <div className="flex items-center gap-4 flex-wrap">
              <Badge className={priorityColors[tarefa.prioridade]}>
                {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
              </Badge>
              <Badge className={statusColors[tarefa.status]}>
                {tarefa.status.charAt(0).toUpperCase() + tarefa.status.slice(1)}
              </Badge>
              
              
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              {editingDescription ? <Textarea value={tempDescription} onChange={e => setTempDescription(e.target.value)} onBlur={handleDescriptionSave} rows={5} className="resize-none" onKeyDown={e => {
              if (e.key === 'Escape') {
                setTempDescription(tarefa.descricao || '');
                setEditingDescription(false);
              }
            }} autoFocus /> : <div className="min-h-[100px] p-3 rounded-md border border-dashed border-muted-foreground/30 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setEditingDescription(true)}>
                  {tarefa.descricao ? <p className="text-sm text-foreground whitespace-pre-wrap">{tarefa.descricao}</p> : <p className="text-sm text-muted-foreground">Adicione uma descrição mais detalhada...</p>}
                </div>}
            </div>

            {/* Responsibles */}
            <TaskResponsibles responsibles={tarefa.responsaveis} options={responsibleOptions} teamMembers={teamMembers} selectedIds={tarefa.responsaveis.map(r => r.usuario_id || r.equipe_id || '').filter(Boolean)} onSelectionChange={async ids => {
            if (!tarefa || !usuario) return;
            const oldResponsibles = tarefa.responsaveis;
            const oldIds = tarefa.responsaveis.map(r => r.usuario_id || r.equipe_id || '').filter(Boolean);

            // Optimistic update - atualizar UI imediatamente
            const newResponsibles = ids.map(responsibleId => {
              const responsible = responsibleOptions.find(r => r.id === responsibleId);
              if (responsible) {
                return {
                  id: `temp-${responsibleId}`,
                  tarefa_id: tarefa.id,
                  usuario_id: responsible.type === 'user' ? responsible.id : null,
                  equipe_id: responsible.type === 'team' ? responsible.id : null,
                  created_at: new Date().toISOString(),
                  usuarios: responsible.type === 'user' ? {
                    nome: responsible.nome,
                    email: ''
                  } : null,
                  equipes: responsible.type === 'team' ? {
                    nome: responsible.nome,
                    descricao: ''
                  } : null
                };
              }
              return null;
            }).filter(Boolean);
            setTarefa({
              ...tarefa,
              responsaveis: newResponsibles as any
            });

            // Fazer update no banco em segundo plano
            setSaving(true);
            try {
              // Delete existing responsibles
              await supabase.from('tarefas_responsaveis').delete().eq('tarefa_id', tarefa.id);

              // Add new responsibles
              if (ids.length > 0) {
                const responsibleInserts = ids.map(responsibleId => {
                  const responsible = responsibleOptions.find(r => r.id === responsibleId);
                  if (responsible) {
                    return {
                      tarefa_id: tarefa.id,
                      usuario_id: responsible.type === 'user' ? responsible.id : null,
                      equipe_id: responsible.type === 'team' ? responsible.id : null
                    };
                  }
                  return null;
                }).filter(Boolean);
                if (responsibleInserts.length > 0) {
                  await supabase.from('tarefas_responsaveis').insert(responsibleInserts);
                }
              }

              // Log activity
              const added = ids.filter(id => !oldIds.includes(id));
              const removed = oldIds.filter(id => !ids.includes(id));
              const changes = [];
              added.forEach(id => {
                const responsible = responsibleOptions.find(r => r.id === id);
                if (responsible) {
                  changes.push(`${responsible.type === 'user' ? 'Adicionou o usuário' : 'Adicionou a equipe'} ${responsible.nome}`);
                }
              });
              removed.forEach(id => {
                const responsible = responsibleOptions.find(r => r.id === id);
                if (responsible) {
                  changes.push(`${responsible.type === 'user' ? 'Removeu o usuário' : 'Removeu a equipe'} ${responsible.nome}`);
                }
              });
              if (changes.length > 0) {
                await supabase.from('tarefas_atividades').insert({
                  tarefa_id: tarefa.id,
                  usuario_id: usuario.id,
                  acao: 'editou',
                  descricao: changes.join(', ')
                });
              }
              loadTask();
              onTaskUpdated?.();
            } catch (error) {
              console.error('Error saving responsibles:', error);
              // Reverter para responsáveis anteriores em caso de erro
              setTarefa({
                ...tarefa,
                responsaveis: oldResponsibles
              });
              toast({
                title: 'Erro',
                description: 'Erro ao salvar responsáveis',
                variant: 'destructive'
              });
            } finally {
              setSaving(false);
            }
          }} />

            {/* Checklists */}
            {tarefa.checklists.length > 0 && <div>
                <h4 className="font-medium mb-3">Checklists</h4>
                <div className="space-y-4">
                  {tarefa.checklists.map(checklist => <div key={checklist.id} className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3">{checklist.titulo}</h5>
                      <div className="space-y-2">
                        {checklist.itens.map(item => <div key={item.id} className="flex items-center gap-2">
                            <Checkbox checked={item.concluido} onCheckedChange={() => toggleChecklistItem(item.id, item.concluido)} />
                            <span className={`text-sm ${item.concluido ? 'line-through text-muted-foreground' : ''}`}>
                              {item.item}
                            </span>
                          </div>)}
                      </div>
                    </div>)}
                </div>
              </div>}

            {/* Activities Section */}
            <div className="border-t pt-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4" />
                <h4 className="font-medium">Atividades</h4>
              </div>

              {/* Activities List */}
              <div className="space-y-4">
                {tarefa.atividades.slice(0, visibleActivities).map(atividade => <div key={atividade.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{atividade.usuario?.nome || usuario?.nome || 'Usuário'}</span>
                      <span>•</span>
                      <span>{format(new Date(atividade.created_at), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR
                    })}</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{atividade.acao}</span>
                      {atividade.descricao && `: ${atividade.descricao}`}
                    </p>
                  </div>)}
                {tarefa.atividades.length > visibleActivities && <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setVisibleActivities(prev => prev + 5)}>
                    Ver mais
                  </Button>}
              </div>
            </div>
          </div>

          {/* Right Column - Comments */}
          <div className="border-l pl-6 overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4" />
              <h4 className="font-medium">Comentários</h4>
            </div>
            
            {/* Add Comment */}
            <div className="space-y-2 flex-shrink-0 mb-4">
              <Textarea placeholder="Adicione um comentário..." value={novoComentario} onChange={e => setNovoComentario(e.target.value)} rows={3} />
              <Button onClick={enviarComentario} disabled={!novoComentario.trim() || enviandoComentario} size="sm">
                {enviandoComentario ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>

            <Separator className="mb-4" />

            {/* Comments List */}
            <ScrollArea className="flex-1 h-full">
              <div className="space-y-4 pr-4">
                {tarefa.comentarios.map(comentario => <div key={comentario.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{comentario.usuario?.nome || usuario?.nome || 'Usuário'}</span>
                      <span>•</span>
                      <span>{format(new Date(comentario.created_at), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR
                    })}</span>
                    </div>
                    <p className="text-sm">{comentario.comentario}</p>
                  </div>)}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}