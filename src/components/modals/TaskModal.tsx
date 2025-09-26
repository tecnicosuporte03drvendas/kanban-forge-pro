import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, User, Users, MessageSquare, Activity, CheckSquare, AlertCircle, Zap, Plus, Calendar, Paperclip, X, MoreHorizontal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { TaskResponsibles } from './TaskResponsibles';
import { TaskAttachments } from './TaskAttachments';
import { TaskDatePicker } from './TaskDatePicker';
import { TaskActivityTabs } from './TaskActivityTabs';
import { TaskChecklists } from './TaskChecklists';
import type { TarefaCompleta, TarefaComentario, TarefaAtividade, PrioridadeTarefa, StatusTarefa } from '@/types/task';
const taskSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  data_conclusao: z.date(),
  horario_conclusao: z.string().default('18:00'),
  responsaveis: z.array(z.string()).default([])
});
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
interface TaskAttachment {
  id: string;
  tarefa_id: string;
  tipo: 'imagem' | 'link';
  url: string;
  nome: string;
  tamanho?: number;
  usuario_id: string;
  created_at: string;
}
export function TaskModal({
  taskId,
  open,
  onOpenChange,
  onTaskUpdated
}: TaskModalProps) {
  const {
    usuario
  } = useAuth();
  const [tarefa, setTarefa] = useState<TarefaCompleta | null>(null);
  const [loading, setLoading] = useState(false);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [responsibleOptions, setResponsibleOptions] = useState<ResponsibleOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  // Edit states for inline editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      prioridade: 'media',
      horario_conclusao: '18:00',
      responsaveis: []
    }
  });

  // Track changes to save on close
  useEffect(() => {
    const subscription = form.watch(values => {
      if (tarefa && values) {
        const hasChanges = values.titulo !== tarefa.titulo || (values.descricao || '') !== (tarefa.descricao || '') || values.prioridade !== tarefa.prioridade || format(values.data_conclusao, 'yyyy-MM-dd') !== tarefa.data_conclusao || values.horario_conclusao !== tarefa.horario_conclusao || JSON.stringify(values.responsaveis.sort()) !== JSON.stringify(tarefa.responsaveis.map(r => r.usuario_id || r.equipe_id || '').filter(Boolean).sort());
        setHasUnsavedChanges(hasChanges);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, tarefa]);
  useEffect(() => {
    if (taskId && open) {
      loadTask();
      loadResponsibleOptions();
    }
  }, [taskId, open]);
  useEffect(() => {
    if (tarefa) {
      form.reset({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        prioridade: tarefa.prioridade,
        data_conclusao: new Date(tarefa.data_conclusao),
        horario_conclusao: tarefa.horario_conclusao,
        responsaveis: tarefa.responsaveis.map(r => r.usuario_id || r.equipe_id || '').filter(Boolean)
      });
      setTempTitle(tarefa.titulo);
      setTempDescription(tarefa.descricao || '');
    }
  }, [tarefa, form]);
  const loadTask = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const {
        data: tarefaData,
        error: tarefaError
      } = await supabase.from('tarefas').select('*').eq('id', taskId).single();
      if (tarefaError) throw tarefaError;
      const {
        data: responsaveisData
      } = await supabase.from('tarefas_responsaveis').select(`
          *,
          usuarios:usuario_id(nome, email),
          equipes:equipe_id(nome, descricao)
        `).eq('tarefa_id', taskId);
      const {
        data: checklistsData
      } = await supabase.from('tarefas_checklists').select(`
          *,
          tarefas_checklist_itens(*)
        `).eq('tarefa_id', taskId);
      const {
        data: comentariosData
      } = await supabase.from('tarefas_comentarios').select(`
          *,
          usuario:usuarios(nome)
        `).eq('tarefa_id', taskId).order('created_at', {
        ascending: false
      });
      const {
        data: atividadesData
      } = await supabase.from('tarefas_atividades').select(`
          *,
          usuario:usuarios(nome)
        `).eq('tarefa_id', taskId).order('created_at', {
        ascending: false
      });
      const {
        data: anexosData
      } = await supabase.from('tarefas_anexos').select('*').eq('tarefa_id', taskId).order('created_at', {
        ascending: false
      });
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
      setAttachments((anexosData || []) as TaskAttachment[]);
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
  const loadResponsibleOptions = async () => {
    const options: ResponsibleOption[] = [];
    const {
      data: usersData
    } = await supabase.from('usuarios').select('id, nome, email').eq('ativo', true).neq('tipo_usuario', 'master');
    if (usersData) {
      options.push(...usersData.map(u => ({
        id: u.id,
        nome: u.nome,
        type: 'user' as const
      })));
    }
    const {
      data: teamsData
    } = await supabase.from('equipes').select('id, nome, descricao');
    if (teamsData) {
      options.push(...teamsData.map(e => ({
        id: e.id,
        nome: e.nome,
        type: 'team' as const
      })));
    }
    setResponsibleOptions(options);
  };
  const generateActivityDescription = (oldValues: any, newValues: z.infer<typeof taskSchema>) => {
    const changes = [];
    if (oldValues.titulo !== newValues.titulo) {
      changes.push(`Alterou o título de "${oldValues.titulo}" para "${newValues.titulo}"`);
    }
    if ((oldValues.descricao || '') !== (newValues.descricao || '')) {
      if (!oldValues.descricao && newValues.descricao) {
        changes.push('Adicionou descrição');
      } else if (oldValues.descricao && !newValues.descricao) {
        changes.push('Removeu a descrição');
      } else {
        changes.push('Alterou a descrição');
      }
    }
    if (oldValues.prioridade !== newValues.prioridade) {
      changes.push(`Alterou a prioridade de "${oldValues.prioridade}" para "${newValues.prioridade}"`);
    }
    if (format(oldValues.data_conclusao, 'yyyy-MM-dd') !== format(newValues.data_conclusao, 'yyyy-MM-dd')) {
      changes.push(`Alterou a data de conclusão para ${format(newValues.data_conclusao, 'dd/MM/yyyy')}`);
    }
    if (oldValues.horario_conclusao !== newValues.horario_conclusao) {
      changes.push(`Alterou o horário de conclusão para ${newValues.horario_conclusao}`);
    }
    const oldResponsaveis = oldValues.responsaveis.sort();
    const newResponsaveis = newValues.responsaveis.sort();
    if (JSON.stringify(oldResponsaveis) !== JSON.stringify(newResponsaveis)) {
      const added = newResponsaveis.filter(r => !oldResponsaveis.includes(r));
      const removed = oldResponsaveis.filter(r => !newResponsaveis.includes(r));
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
    }
    return changes.join('; ');
  };
  const saveTask = async (values: z.infer<typeof taskSchema>, skipActivityLog = false) => {
    if (!tarefa || !usuario) return;
    setSaving(true);
    try {
      const oldValues = {
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        prioridade: tarefa.prioridade,
        data_conclusao: new Date(tarefa.data_conclusao),
        horario_conclusao: tarefa.horario_conclusao,
        responsaveis: tarefa.responsaveis.map(r => r.usuario_id || r.equipe_id || '').filter(Boolean)
      };
      const {
        error: tarefaError
      } = await supabase.from('tarefas').update({
        titulo: values.titulo,
        descricao: values.descricao || null,
        prioridade: values.prioridade,
        data_conclusao: format(values.data_conclusao, 'yyyy-MM-dd'),
        horario_conclusao: values.horario_conclusao
      }).eq('id', tarefa.id);
      if (tarefaError) throw tarefaError;
      await supabase.from('tarefas_responsaveis').delete().eq('tarefa_id', tarefa.id);
      if (values.responsaveis && values.responsaveis.length > 0) {
        const responsibleInserts = values.responsaveis.map(responsibleId => {
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
      if (!skipActivityLog) {
        const activityDescription = generateActivityDescription(oldValues, values);
        if (activityDescription) {
          await supabase.from('tarefas_atividades').insert({
            tarefa_id: tarefa.id,
            usuario_id: usuario.id,
            acao: 'editou',
            descricao: activityDescription
          });
        }
      }
      setHasUnsavedChanges(false);
      loadTask();
      onTaskUpdated?.();
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar tarefa',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  const enviarComentario = async () => {
    if (!novoComentario.trim() || !tarefa || !usuario) return;
    setEnviandoComentario(true);
    try {
      await supabase.from('tarefas_comentarios').insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        comentario: novoComentario.trim()
      });
      await supabase.from('tarefas_atividades').insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        acao: 'comentou',
        descricao: 'Adicionou um comentário'
      });
      setNovoComentario('');
      loadTask();
      toast({
        title: 'Sucesso',
        description: 'Comentário adicionado'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar comentário',
        variant: 'destructive'
      });
    } finally {
      setEnviandoComentario(false);
    }
  };
  const handleTitleSave = async () => {
    if (!tarefa || tempTitle === tarefa.titulo) {
      setEditingTitle(false);
      return;
    }
    form.setValue('titulo', tempTitle);
    setEditingTitle(false);
  };
  const handleDescriptionSave = async () => {
    if (!tarefa || tempDescription === (tarefa.descricao || '')) {
      setEditingDescription(false);
      return;
    }
    form.setValue('descricao', tempDescription);
    setEditingDescription(false);
  };
  const handleClose = async () => {
    if (hasUnsavedChanges) {
      const values = form.getValues();
      await saveTask(values);
      toast({
        title: 'Sucesso',
        description: 'Alterações salvas'
      });
    }
    onOpenChange(false);
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
        return 'bg-priority-high text-white';
      case 'media':
        return 'bg-priority-medium text-white';
      case 'baixa':
        return 'bg-priority-low text-white';
    }
  };
  if (!tarefa) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            {loading ? 'Carregando...' : 'Tarefa não encontrada'}
          </div>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3 flex-1">
            <CheckSquare className="h-5 w-5 text-primary" />
            {editingTitle ? <div className="flex-1 flex items-center gap-2">
                <Input value={tempTitle} onChange={e => setTempTitle(e.target.value)} className="text-lg font-semibold border-none bg-transparent p-0 focus-visible:ring-0" onBlur={handleTitleSave} onKeyDown={e => {
              if (e.key === 'Enter') {
                handleTitleSave();
              } else if (e.key === 'Escape') {
                setTempTitle(tarefa.titulo);
                setEditingTitle(false);
              }
            }} autoFocus />
              </div> : <h1 className="text-lg font-semibold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded -mx-2 flex-1" onClick={() => setEditingTitle(true)}>
                {tarefa.titulo}
              </h1>}
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && <span className="text-sm text-amber-600">Alterações não salvas</span>}
            {saving && <span className="text-sm text-muted-foreground">Salvando...</span>}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose}>
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
              
              <TaskDatePicker date={new Date(tarefa.data_conclusao)} time={tarefa.horario_conclusao} onDateChange={date => {
              form.setValue('data_conclusao', date);
            }} onTimeChange={time => {
              form.setValue('horario_conclusao', time);
            }} disabled={saving} />
              
              <Button variant="outline" size="sm">
                <CheckSquare className="h-4 w-4 mr-1" />
                Checklist
              </Button>
              
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4 mr-1" />
                Anexo
              </Button>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-1 bg-muted rounded"></div>
                <span className="font-medium">Descrição</span>
              </div>
              
              {editingDescription ? <Textarea value={tempDescription} onChange={e => setTempDescription(e.target.value)} placeholder="Adicione uma descrição mais detalhada..." className="min-h-[100px] resize-none" onBlur={handleDescriptionSave} onKeyDown={e => {
              if (e.key === 'Escape') {
                setTempDescription(tarefa.descricao || '');
                setEditingDescription(false);
              }
            }} autoFocus /> : <div className="min-h-[100px] p-3 rounded-md border border-dashed border-muted-foreground/30 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setEditingDescription(true)}>
                  {tarefa.descricao ? <p className="text-sm text-foreground whitespace-pre-wrap">{tarefa.descricao}</p> : <p className="text-sm text-muted-foreground">Adicione uma descrição mais detalhada...</p>}
                </div>}
            </div>

            {/* Responsibles */}
            <TaskResponsibles responsibles={tarefa.responsaveis} options={responsibleOptions} selectedIds={form.watch('responsaveis') || []} onSelectionChange={ids => {
            form.setValue('responsaveis', ids);
          }} />

            {/* Checklists */}
            <TaskChecklists taskId={tarefa.id} checklists={tarefa.checklists} onChecklistsChange={() => {
            loadTask();
          }} />

            {/* Attachments */}
            <TaskAttachments taskId={tarefa.id} attachments={attachments} onAttachmentsChange={() => {
            loadTask();
          }} />

          </div>

          {/* Right Column - Comments & Activity */}
          <TaskActivityTabs comments={tarefa.comentarios} activities={tarefa.atividades} newComment={novoComentario} onCommentChange={setNovoComentario} onSubmitComment={enviarComentario} isSubmitting={enviandoComentario} />
        </div>
      </DialogContent>
    </Dialog>;
}