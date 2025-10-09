import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  X,
  MoreHorizontal,
  Archive,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectiveUser } from "@/hooks/use-effective-user";
import { TaskResponsibles } from "./TaskResponsibles";
import { TaskAttachments } from "./TaskAttachments";
import { TaskDatePicker } from "./TaskDatePicker";
import { TaskActivityTabs } from "./TaskActivityTabs";
import { TaskChecklists } from "./TaskChecklists";
import { TaskTimeTracker } from "@/components/task-time/TaskTimeTracker";
import type {
  TarefaCompleta,
  TarefaComentario,
  TarefaAtividade,
  PrioridadeTarefa,
  StatusTarefa,
  TarefaTempoSessao,
} from "@/types/task";
const taskSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().optional(),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"]),
  data_conclusao: z.date(),
  horario_conclusao: z.string().default("18:00"),
  responsaveis: z.array(z.string()).default([]),
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
  type: "user" | "team";
}
interface TaskAttachment {
  id: string;
  tarefa_id: string;
  tipo: "imagem" | "link";
  url: string;
  nome: string;
  tamanho?: number;
  usuario_id: string;
  created_at: string;
}
export function TaskModal({ taskId, open, onOpenChange, onTaskUpdated }: TaskModalProps) {
  const { usuario } = useAuth();
  const { usuario: usuarioEfetivo } = useEffectiveUser();
  const [tarefa, setTarefa] = useState<TarefaCompleta | null>(null);
  const [loading, setLoading] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [responsibleOptions, setResponsibleOptions] = useState<ResponsibleOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Edit states for inline editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      prioridade: "media",
      horario_conclusao: "18:00",
      responsaveis: [],
    },
  });

  // Track changes to save on close
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (tarefa && values) {
        const hasChanges =
          values.titulo !== tarefa.titulo ||
          (values.descricao || "") !== (tarefa.descricao || "") ||
          values.prioridade !== tarefa.prioridade ||
          format(values.data_conclusao, "yyyy-MM-dd") !== tarefa.data_conclusao ||
          values.horario_conclusao !== tarefa.horario_conclusao ||
          JSON.stringify(values.responsaveis.sort()) !==
            JSON.stringify(
              tarefa.responsaveis
                .map((r) => r.usuario_id || r.equipe_id || "")
                .filter(Boolean)
                .sort(),
            );
        setHasUnsavedChanges(hasChanges);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, tarefa]);
  useEffect(() => {
    if (taskId && open) {
      loadTask();
      loadResponsibleOptions();
    } else if (!open) {
      // Limpar dados ao fechar o modal
      setTarefa(null);
      setNovoComentario('');
      setEditingTitle(false);
      setEditingDescription(false);
      setTempTitle('');
      setTempDescription('');
      setHasUnsavedChanges(false);
      setAttachments([]);
      form.reset({
        titulo: '',
        descricao: '',
        prioridade: 'media',
        horario_conclusao: '18:00',
        responsaveis: [],
      });
    }
  }, [taskId, open]);
  useEffect(() => {
    if (tarefa) {
      form.reset({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || "",
        prioridade: tarefa.prioridade,
        data_conclusao: new Date(tarefa.data_conclusao),
        horario_conclusao: tarefa.horario_conclusao,
        responsaveis: tarefa.responsaveis.map((r) => r.usuario_id || r.equipe_id || "").filter(Boolean),
      });
      setTempTitle(tarefa.titulo);
      setTempDescription(tarefa.descricao || "");
    }
  }, [tarefa, form]);
  const loadTask = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const { data: tarefaData, error: tarefaError } = await supabase
        .from("tarefas")
        .select("*")
        .eq("id", taskId)
        .single();
      if (tarefaError) throw tarefaError;
      const { data: responsaveisData } = await supabase
        .from("tarefas_responsaveis")
        .select(
          `
          *,
          usuarios:usuario_id(nome, email),
          equipes:equipe_id(nome, descricao)
        `,
        )
        .eq("tarefa_id", taskId);
      const { data: checklistsData } = await supabase
        .from("tarefas_checklists")
        .select(
          `
          *,
          tarefas_checklist_itens(*)
        `,
        )
        .eq("tarefa_id", taskId);
      const { data: comentariosData } = await supabase
        .from("tarefas_comentarios")
        .select(
          `
          *,
          usuario:usuarios(nome)
        `,
        )
        .eq("tarefa_id", taskId)
        .order("created_at", {
          ascending: false,
        });
      const { data: atividadesData } = await supabase
        .from("tarefas_atividades")
        .select(
          `
          *,
          usuario:usuarios(nome)
        `,
        )
        .eq("tarefa_id", taskId)
        .order("created_at", {
          ascending: false,
        });
      const { data: anexosData } = await supabase
        .from("tarefas_anexos")
        .select("*")
        .eq("tarefa_id", taskId)
        .order("created_at", {
          ascending: false,
        });

      // Fetch time sessions
      const { data: tempoSessoesData } = await supabase
        .from("tarefas_tempo_sessoes")
        .select("*")
        .eq("tarefa_id", taskId)
        .order("created_at", {
          ascending: false,
        });

      const tarefaCompleta: TarefaCompleta = {
        ...tarefaData,
        responsaveis: responsaveisData || [],
        checklists:
          checklistsData?.map((cl) => ({
            ...cl,
            itens: cl.tarefas_checklist_itens || [],
          })) || [],
        comentarios: comentariosData || [],
        atividades: atividadesData || [],
        tempo_sessoes: tempoSessoesData || [],
      };
      
      setTarefa(tarefaCompleta);
      setAttachments((anexosData || []) as TaskAttachment[]);
    } catch (error) {
      console.error("Error loading task:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tarefa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const loadResponsibleOptions = async () => {
    const options: ResponsibleOption[] = [];
    const members: Record<string, string[]> = {};
    
    if (!usuario?.empresa_id) return;
    
    const { data: usersData } = await supabase
      .from("usuarios")
      .select("id, nome, email")
      .eq("ativo", true)
      .eq("empresa_id", usuario.empresa_id)
      .neq("tipo_usuario", "master");
    if (usersData) {
      options.push(
        ...usersData.map((u) => ({
          id: u.id,
          nome: u.nome,
          type: "user" as const,
        })),
      );
    }
    const { data: teamsData } = await supabase
      .from("equipes")
      .select("id, nome, descricao")
      .eq("empresa_id", usuario.empresa_id);
    if (teamsData) {
      options.push(
        ...teamsData.map((e) => ({
          id: e.id,
          nome: e.nome,
          type: "team" as const,
        })),
      );
      
      // Load team members
      for (const team of teamsData) {
        const { data: teamMembersData } = await supabase
          .from('usuarios_equipes')
          .select('usuario_id')
          .eq('equipe_id', team.id);
        
        if (teamMembersData) {
          members[team.id] = teamMembersData.map(m => m.usuario_id);
        }
      }
    }
    setResponsibleOptions(options);
    setTeamMembers(members);
  };
  const generateActivityDescription = (oldValues: any, newValues: z.infer<typeof taskSchema>) => {
    const changes = [];
    if (oldValues.titulo !== newValues.titulo) {
      changes.push(`Alterou o título de "${oldValues.titulo}" para "${newValues.titulo}"`);
    }
    if ((oldValues.descricao || "") !== (newValues.descricao || "")) {
      if (!oldValues.descricao && newValues.descricao) {
        changes.push("Adicionou descrição");
      } else if (oldValues.descricao && !newValues.descricao) {
        changes.push("Removeu a descrição");
      } else {
        changes.push("Alterou a descrição");
      }
    }
    if (oldValues.prioridade !== newValues.prioridade) {
      changes.push(`Alterou a prioridade de "${oldValues.prioridade}" para "${newValues.prioridade}"`);
    }
    if (format(oldValues.data_conclusao, "yyyy-MM-dd") !== format(newValues.data_conclusao, "yyyy-MM-dd")) {
      changes.push(`Alterou a data de conclusão para ${format(newValues.data_conclusao, "dd/MM/yyyy")}`);
    }
    if (oldValues.horario_conclusao !== newValues.horario_conclusao) {
      changes.push(`Alterou o horário de conclusão para ${newValues.horario_conclusao}`);
    }
    const oldResponsaveis = oldValues.responsaveis.sort();
    const newResponsaveis = newValues.responsaveis.sort();
    if (JSON.stringify(oldResponsaveis) !== JSON.stringify(newResponsaveis)) {
      const added = newResponsaveis.filter((r) => !oldResponsaveis.includes(r));
      const removed = oldResponsaveis.filter((r) => !newResponsaveis.includes(r));
      added.forEach((id) => {
        const responsible = responsibleOptions.find((r) => r.id === id);
        if (responsible) {
          changes.push(
            `${responsible.type === "user" ? "Adicionou o usuário" : "Adicionou a equipe"} ${responsible.nome}`,
          );
        }
      });
      removed.forEach((id) => {
        const responsible = responsibleOptions.find((r) => r.id === id);
        if (responsible) {
          changes.push(`${responsible.type === "user" ? "Removeu o usuário" : "Removeu a equipe"} ${responsible.nome}`);
        }
      });
    }
    return changes.join("; ");
  };
  const saveTask = async (values: z.infer<typeof taskSchema>, skipActivityLog = false) => {
    if (!tarefa || !usuario) return;
    setSaving(true);
    try {
      const oldValues = {
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || "",
        prioridade: tarefa.prioridade,
        data_conclusao: new Date(tarefa.data_conclusao),
        horario_conclusao: tarefa.horario_conclusao,
        responsaveis: tarefa.responsaveis.map((r) => r.usuario_id || r.equipe_id || "").filter(Boolean),
      };
      const { error: tarefaError } = await supabase
        .from("tarefas")
        .update({
          titulo: values.titulo,
          descricao: values.descricao || null,
          prioridade: values.prioridade,
          data_conclusao: format(values.data_conclusao, "yyyy-MM-dd"),
          horario_conclusao: values.horario_conclusao,
        })
        .eq("id", tarefa.id);
      if (tarefaError) throw tarefaError;
      await supabase.from("tarefas_responsaveis").delete().eq("tarefa_id", tarefa.id);
      if (values.responsaveis && values.responsaveis.length > 0) {
        const responsibleInserts = values.responsaveis
          .map((responsibleId) => {
            const responsible = responsibleOptions.find((r) => r.id === responsibleId);
            if (responsible) {
              return {
                tarefa_id: tarefa.id,
                usuario_id: responsible.type === "user" ? responsible.id : null,
                equipe_id: responsible.type === "team" ? responsible.id : null,
              };
            }
            return null;
          })
          .filter(Boolean);
        if (responsibleInserts.length > 0) {
          await supabase.from("tarefas_responsaveis").insert(responsibleInserts);
        }
      }
      if (!skipActivityLog) {
        const activityDescription = generateActivityDescription(oldValues, values);
        if (activityDescription) {
          await supabase.from("tarefas_atividades").insert({
            tarefa_id: tarefa.id,
            usuario_id: usuario.id,
            acao: "editou",
            descricao: activityDescription,
          });
        }
      }
      setHasUnsavedChanges(false);
      loadTask();
      onTaskUpdated?.();
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar tarefa",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  const enviarComentario = async () => {
    if (!novoComentario.trim() || !tarefa || !usuario) return;
    setEnviandoComentario(true);
    try {
      await supabase.from("tarefas_comentarios").insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        comentario: novoComentario.trim(),
      });
      await supabase.from("tarefas_atividades").insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        acao: "comentou",
        descricao: "Adicionou um comentário",
      });
      setNovoComentario("");
      loadTask();
      toast({
        title: "Sucesso",
        description: "Comentário adicionado",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar comentário",
        variant: "destructive",
      });
    } finally {
      setEnviandoComentario(false);
    }
  };
  const handleTitleSave = async () => {
    if (!tarefa || !usuario || tempTitle === tarefa.titulo) {
      setEditingTitle(false);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("tarefas").update({ titulo: tempTitle }).eq("id", tarefa.id);

      if (error) throw error;

      await supabase.from("tarefas_atividades").insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        acao: "editou",
        descricao: `Alterou o título de "${tarefa.titulo}" para "${tempTitle}"`,
      });

      setEditingTitle(false);
      loadTask();
      onTaskUpdated?.();
      toast({ title: "Sucesso", description: "Título atualizado" });
    } catch (error) {
      console.error("Error saving title:", error);
      toast({ title: "Erro", description: "Erro ao salvar título", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDescriptionSave = async () => {
    if (!tarefa || !usuario || tempDescription === (tarefa.descricao || "")) {
      setEditingDescription(false);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("tarefas")
        .update({ descricao: tempDescription || null })
        .eq("id", tarefa.id);

      if (error) throw error;

      const oldDesc = tarefa.descricao || "";
      let activityDesc = "";
      if (!oldDesc && tempDescription) {
        activityDesc = "Adicionou descrição";
      } else if (oldDesc && !tempDescription) {
        activityDesc = "Removeu a descrição";
      } else {
        activityDesc = "Alterou a descrição";
      }

      await supabase.from("tarefas_atividades").insert({
        tarefa_id: tarefa.id,
        usuario_id: usuario.id,
        acao: "editou",
        descricao: activityDesc,
      });

      setEditingDescription(false);
      loadTask();
      onTaskUpdated?.();
      toast({ title: "Sucesso", description: "Descrição atualizada" });
    } catch (error) {
      console.error("Error saving description:", error);
      toast({ title: "Erro", description: "Erro ao salvar descrição", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const handleClose = async () => {
    if (hasUnsavedChanges) {
      const values = form.getValues();
      await saveTask(values, true); // Skip activity log for auto-save
    }
    onOpenChange(false);
  };

  const handleArchiveTask = async () => {
    if (!tarefa || !usuarioEfetivo) return;

    try {
      const { error } = await supabase.from("tarefas").update({ arquivada: true }).eq("id", tarefa.id);

      if (error) throw error;

      // Add activity log
      await supabase.from("tarefas_atividades").insert({
        tarefa_id: tarefa.id,
        usuario_id: usuarioEfetivo.id,
        acao: "arquivou",
        descricao: "Tarefa arquivada",
      });

      setShowArchiveModal(false);
      onOpenChange(false);
      onTaskUpdated?.();

      toast({
        title: "Sucesso",
        description: "Tarefa arquivada com sucesso",
      });
    } catch (error) {
      console.error("Error archiving task:", error);
      toast({
        title: "Erro",
        description: "Erro ao arquivar tarefa",
        variant: "destructive",
      });
    }
  };
  const getPriorityIcon = (priority: PrioridadeTarefa) => {
    switch (priority) {
      case "urgente":
        return <Zap className="w-4 h-4" />;
      case "alta":
        return <AlertCircle className="w-4 h-4" />;
      case "media":
        return <Clock className="w-4 h-4" />;
      case "baixa":
        return <Clock className="w-4 h-4" />;
    }
  };
  const getPriorityColor = (priority: PrioridadeTarefa) => {
    switch (priority) {
      case "urgente":
        return "bg-red-500 text-white";
      case "alta":
        return "bg-priority-high text-white";
      case "media":
        return "bg-priority-medium text-white";
      case "baixa":
        return "bg-priority-low text-white";
    }
  };
  if (!tarefa) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            {loading ? "Carregando..." : "Tarefa não encontrada"}
          </div>
        </DialogContent>
      </Dialog>
    );
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
                    if (e.key === "Enter") {
                      handleTitleSave();
                    } else if (e.key === "Escape") {
                      setTempTitle(tarefa.titulo);
                      setEditingTitle(false);
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
            {saving && <span className="text-sm text-muted-foreground">Salvando...</span>}
            {(usuarioEfetivo?.tipo_usuario === "proprietario" || usuarioEfetivo?.tipo_usuario === "gestor") && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowArchiveModal(true)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar tarefa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
              <TaskDatePicker
                date={new Date(tarefa.data_conclusao)}
                time={tarefa.horario_conclusao}
                onDateChange={async (date) => {
                  if (!tarefa || !usuario) return;
                  setSaving(true);
                  try {
                    const { error } = await supabase
                      .from("tarefas")
                      .update({ data_conclusao: format(date, "yyyy-MM-dd") })
                      .eq("id", tarefa.id);

                    if (error) throw error;

                    await supabase.from("tarefas_atividades").insert({
                      tarefa_id: tarefa.id,
                      usuario_id: usuario.id,
                      acao: "editou",
                      descricao: `Alterou a data de conclusão para ${format(date, "dd/MM/yyyy")}`,
                    });

                    loadTask();
                    onTaskUpdated?.();
                    toast({ title: "Sucesso", description: "Data atualizada" });
                  } catch (error) {
                    console.error("Error saving date:", error);
                    toast({ title: "Erro", description: "Erro ao salvar data", variant: "destructive" });
                  } finally {
                    setSaving(false);
                  }
                }}
                onTimeChange={async (time) => {
                  if (!tarefa || !usuario) return;
                  setSaving(true);
                  try {
                    const { error } = await supabase
                      .from("tarefas")
                      .update({ horario_conclusao: time })
                      .eq("id", tarefa.id);

                    if (error) throw error;

                    await supabase.from("tarefas_atividades").insert({
                      tarefa_id: tarefa.id,
                      usuario_id: usuario.id,
                      acao: "editou",
                      descricao: `Alterou o horário de conclusão para ${time}`,
                    });

                    loadTask();
                    onTaskUpdated?.();
                    toast({ title: "Sucesso", description: "Horário atualizado" });
                  } catch (error) {
                    console.error("Error saving time:", error);
                    toast({ title: "Erro", description: "Erro ao salvar horário", variant: "destructive" });
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              />
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
                    if (e.key === "Escape") {
                      setTempDescription(tarefa.descricao || "");
                      setEditingDescription(false);
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
            <TaskResponsibles
              responsibles={tarefa.responsaveis}
              options={responsibleOptions}
              teamMembers={teamMembers}
              selectedIds={form.watch("responsaveis") || []}
              onSelectionChange={async (ids) => {
                if (!tarefa || !usuario) return;

                setSaving(true);
                try {
                  const oldIds = tarefa.responsaveis.map((r) => r.usuario_id || r.equipe_id || "").filter(Boolean);

                  // Delete existing responsibles
                  await supabase.from("tarefas_responsaveis").delete().eq("tarefa_id", tarefa.id);

                  // Add new responsibles
                  if (ids.length > 0) {
                    const responsibleInserts = ids
                      .map((responsibleId) => {
                        const responsible = responsibleOptions.find((r) => r.id === responsibleId);
                        if (responsible) {
                          return {
                            tarefa_id: tarefa.id,
                            usuario_id: responsible.type === "user" ? responsible.id : null,
                            equipe_id: responsible.type === "team" ? responsible.id : null,
                          };
                        }
                        return null;
                      })
                      .filter(Boolean);

                    if (responsibleInserts.length > 0) {
                      await supabase.from("tarefas_responsaveis").insert(responsibleInserts);
                    }
                  }

                  // Log activity
                  const added = ids.filter((id) => !oldIds.includes(id));
                  const removed = oldIds.filter((id) => !ids.includes(id));
                  const changes = [];

                  added.forEach((id) => {
                    const responsible = responsibleOptions.find((r) => r.id === id);
                    if (responsible) {
                      changes.push(
                        `${responsible.type === "user" ? "Adicionou o usuário" : "Adicionou a equipe"} ${responsible.nome}`,
                      );
                    }
                  });

                  removed.forEach((id) => {
                    const responsible = responsibleOptions.find((r) => r.id === id);
                    if (responsible) {
                      changes.push(
                        `${responsible.type === "user" ? "Removeu o usuário" : "Removeu a equipe"} ${responsible.nome}`,
                      );
                    }
                  });

                  if (changes.length > 0) {
                    await supabase.from("tarefas_atividades").insert({
                      tarefa_id: tarefa.id,
                      usuario_id: usuario.id,
                      acao: "editou",
                      descricao: changes.join("; "),
                    });
                  }

                  loadTask();
                  onTaskUpdated?.();
                  toast({ title: "Sucesso", description: "Responsáveis atualizados" });
                } catch (error) {
                  console.error("Error saving responsibles:", error);
                  toast({ title: "Erro", description: "Erro ao salvar responsáveis", variant: "destructive" });
                } finally {
                  setSaving(false);
                }
              }}
            />

            {/* Checklists */}
            <TaskChecklists
              taskId={tarefa.id}
              checklists={tarefa.checklists}
              onChecklistsChange={() => {
                loadTask();
              }}
            />

            {/* Attachments */}
            <TaskAttachments
              taskId={tarefa.id}
              attachments={attachments}
              onAttachmentsChange={() => {
                loadTask();
              }}
            />

            {/* Time Tracking */}
            <TaskTimeTracker
              tempoGastoMinutos={tarefa.tempo_gasto_minutos}
              tempoInicio={tarefa.tempo_inicio}
              tempoFim={tarefa.tempo_fim}
              status={tarefa.status}
              sessoes={tarefa.tempo_sessoes}
            />
          </div>

          {/* Right Column - Comments & Activity */}
          <div className="lg:col-span-1 flex flex-col h-full min-h-0">
            <TaskActivityTabs
              comments={tarefa.comentarios}
              activities={tarefa.atividades}
              newComment={novoComentario}
              onCommentChange={setNovoComentario}
              onSubmitComment={enviarComentario}
              isSubmitting={enviandoComentario}
            />
          </div>
        </div>
      </DialogContent>

      {/* Archive Confirmation Modal */}
      <Dialog open={showArchiveModal} onOpenChange={setShowArchiveModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-600" />
              Arquivar Tarefa
            </DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja arquivar esta tarefa? Ela será movida para a seção de tarefas arquivadas e não
              será mais visível no quadro principal.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">{tarefa?.titulo}</h4>
            <p className="text-sm text-muted-foreground">
              Esta ação pode ser desfeita através da seção de tarefas arquivadas.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveModal(false)}>
              Cancelar
            </Button>
            <Button variant="default" onClick={handleArchiveTask}>
              <Archive className="h-4 w-4 mr-2" />
              Arquivar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
