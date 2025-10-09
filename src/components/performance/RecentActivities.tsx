import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, User, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectiveUser } from '@/hooks/use-effective-user';
import { getDateStatus } from "@/utils/date-utils";

interface Activity {
  id: string;
  acao: string;
  descricao?: string;
  created_at: string;
  usuario_nome: string;
  tarefa_titulo?: string;
  tarefa_data_conclusao?: string;
}

interface RecentActivitiesProps {
  userId?: string; // Para mostrar apenas atividades do usuário específico
}

export const RecentActivities = ({ userId }: RecentActivitiesProps) => {
  const { usuario } = useEffectiveUser()
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadRecentActivities();
    }
  }, [usuario?.empresa_id, userId]);

  const loadRecentActivities = async () => {
    try {
      let query = supabase
        .from('tarefas_atividades')
        .select(`
          id,
          acao,
          descricao,
          created_at,
          usuarios!inner(nome),
          tarefas!inner(titulo, data_conclusao, empresa_id)
        `)
        .eq('tarefas.empresa_id', usuario?.empresa_id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Se userId for especificado, filtrar apenas atividades desse usuário
      if (userId) {
        query = query.eq('usuario_id', userId);
      }

      const { data } = await query;

      if (data) {
        const formattedActivities: Activity[] = data.map(activity => ({
          id: activity.id,
          acao: activity.acao,
          descricao: activity.descricao,
          created_at: activity.created_at,
          usuario_nome: activity.usuarios.nome,
          tarefa_titulo: activity.tarefas.titulo,
          tarefa_data_conclusao: activity.tarefas.data_conclusao
        }));

        setActivities(formattedActivities);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades recentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    if (action.toLowerCase().includes('conclu')) return CheckCircle;
    if (action.toLowerCase().includes('criad')) return FileText;
    if (action.toLowerCase().includes('atualiz')) return Clock;
    return User;
  };

  const getActivityColor = (action: string) => {
    if (action.toLowerCase().includes('conclu')) return 'text-kanban-completed';
    if (action.toLowerCase().includes('criad')) return 'text-primary';
    if (action.toLowerCase().includes('atualiz')) return 'text-kanban-executing';
    return 'text-muted-foreground';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h atrás`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d atrás`;
    }
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border-l-2 border-muted bg-muted/20 rounded-r-lg">
                <div className="w-5 h-5 bg-muted rounded mt-0.5"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
        <p className="text-sm text-muted-foreground">
          {userId ? 'Suas últimas ações no sistema' : 'Últimas ações da empresa'}
        </p>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma atividade recente encontrada.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.acao);
              const iconColor = getActivityColor(activity.acao);
              
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 border-l-2 border-primary/20 bg-accent/30 rounded-r-lg">
                  <IconComponent className={`w-5 h-5 ${iconColor} mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{activity.acao}</p>
                      {!userId && (
                        <Badge variant="outline" className="text-xs">
                          {activity.usuario_nome}
                        </Badge>
                      )}
                    </div>
                    {activity.tarefa_titulo && (
                      <p className="text-sm text-foreground mb-1 truncate">
                        {activity.tarefa_titulo}
                      </p>
                    )}
                    {activity.descricao && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {activity.descricao}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatTime(activity.created_at)}</span>
                      {activity.tarefa_data_conclusao && (
                        <span className={getDateStatus(activity.tarefa_data_conclusao).className}>
                          • Vencimento: {new Date(activity.tarefa_data_conclusao).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};