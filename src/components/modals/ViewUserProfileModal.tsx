import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Clock, Calendar, Users } from 'lucide-react';
import { formatCelularForDisplay } from '@/lib/utils';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  celular: string;
  funcao_empresa: string | null;
  tipo_usuario: string;
  ativo: boolean;
}

interface ViewUserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Usuario | null;
}

interface Tarefa {
  id: string;
  titulo: string;
  status: string;
  data_conclusao: string;
  prioridade: string;
}

interface Reuniao {
  id: string;
  titulo: string;
  data_reuniao: string;
  horario_inicio: string;
  duracao_minutos: number;
}

export function ViewUserProfileModal({ open, onOpenChange, user }: ViewUserProfileModalProps) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      loadUserData();
    }
  }, [open, user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Carregar tarefas
      const { data: tarefasData } = await supabase
        .from('tarefas_responsaveis')
        .select(`
          tarefas (
            id,
            titulo,
            status,
            data_conclusao,
            prioridade
          )
        `)
        .eq('usuario_id', user.id);

      const tarefasList = tarefasData?.map((t: any) => t.tarefas).filter(Boolean) || [];
      setTarefas(tarefasList);

      // Carregar reuniões
      const { data: reunioesData } = await supabase
        .from('reunioes_participantes')
        .select(`
          reunioes (
            id,
            titulo,
            data_reuniao,
            horario_inicio,
            duracao_minutos
          )
        `)
        .eq('usuario_id', user.id);

      const reunioesList = reunioesData?.map((r: any) => r.reunioes).filter(Boolean) || [];
      setReunioes(reunioesList);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaxaConclusao = () => {
    if (tarefas.length === 0) return 0;
    const concluidas = tarefas.filter(t => t.status === 'concluida').length;
    return Math.round((concluidas / tarefas.length) * 100);
  };

  const getInitials = (nome: string) => {
    const nomes = nome.split(' ');
    return nomes.length >= 2 
      ? `${nomes[0][0]}${nomes[nomes.length - 1][0]}`.toUpperCase()
      : nome.substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      criada: { label: 'Criada', variant: 'outline' },
      em_andamento: { label: 'Em Andamento', variant: 'default' },
      concluida: { label: 'Concluída', variant: 'secondary' },
    };
    return statusMap[status] || { label: status, variant: 'outline' };
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridadeMap: Record<string, { label: string; variant: any }> = {
      alta: { label: 'Alta', variant: 'destructive' },
      media: { label: 'Média', variant: 'default' },
      baixa: { label: 'Baixa', variant: 'secondary' },
    };
    return prioridadeMap[prioridade] || { label: prioridade, variant: 'outline' };
  };

  if (!user) return null;

  const taxaConclusao = getTaxaConclusao();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Perfil do Colaborador</DialogTitle>
          <DialogDescription>
            Visualize informações detalhadas sobre o colaborador
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Informações do Usuário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {getInitials(user.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-semibold">{user.nome}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Email: {user.email}</p>
                      <p>Celular: {formatCelularForDisplay(user.celular)}</p>
                      {user.funcao_empresa && <p>Função: {user.funcao_empresa}</p>}
                    </div>
                    <Badge variant={user.ativo ? 'default' : 'secondary'}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Taxa de Conclusão */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Taxa de Conclusão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{taxaConclusao}%</span>
                    <span className="text-sm text-muted-foreground">
                      {tarefas.filter(t => t.status === 'concluida').length} de {tarefas.length} tarefas concluídas
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div 
                      className="bg-primary rounded-full h-3 transition-all" 
                      style={{ width: `${taxaConclusao}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tarefas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Tarefas Atribuídas ({tarefas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">Carregando...</div>
                ) : tarefas.length > 0 ? (
                  <div className="space-y-3">
                    {tarefas.map((tarefa) => {
                      const statusInfo = getStatusBadge(tarefa.status);
                      const prioridadeInfo = getPrioridadeBadge(tarefa.prioridade);
                      return (
                        <div key={tarefa.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium">{tarefa.titulo}</h4>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant={prioridadeInfo.variant} className="text-xs">
                              {prioridadeInfo.label}
                            </Badge>
                            <span>•</span>
                            <span>Conclusão: {new Date(tarefa.data_conclusao).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma tarefa atribuída</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reuniões */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Reuniões Participando ({reunioes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">Carregando...</div>
                ) : reunioes.length > 0 ? (
                  <div className="space-y-3">
                    {reunioes.map((reuniao) => (
                      <div key={reuniao.id} className="p-3 border rounded-lg space-y-2">
                        <h4 className="font-medium">{reuniao.titulo}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(reuniao.data_reuniao).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {reuniao.horario_inicio} ({reuniao.duracao_minutos} min)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma reunião agendada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
