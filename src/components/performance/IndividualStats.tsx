import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectiveUser } from '@/hooks/use-effective-user';
import { isOverdue } from "@/utils/date-utils";

interface IndividualStatsProps {
  userId?: string; // Para permitir visualizar stats de outros usuários
}

export const IndividualStats = ({ userId }: IndividualStatsProps) => {
  const { usuario } = useEffectiveUser()
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksPending: 0,
    tasksOverdue: 0,
    totalTasks: 0,
    hoursWorked: 0,
    productivity: 0
  });
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || usuario?.id;

  useEffect(() => {
    if (targetUserId && usuario?.empresa_id) {
      loadStats();
    }
  }, [targetUserId, usuario?.empresa_id]);

  const loadStats = async () => {
    try {
      // Buscar todas as tarefas onde o usuário é responsável
      const { data: tarefasResponsaveis } = await supabase
        .from('tarefas_responsaveis')
        .select(`
          tarefa_id,
          tarefas!inner(
            id,
            status,
            data_conclusao,
            tempo_gasto_minutos,
            arquivada,
            empresa_id
          )
        `)
        .eq('usuario_id', targetUserId)
        .eq('tarefas.empresa_id', usuario?.empresa_id)
        .eq('tarefas.arquivada', false);

      if (tarefasResponsaveis) {
        const tarefas = tarefasResponsaveis.map(tr => tr.tarefas);
        
        const completed = tarefas.filter(t => t.status === 'concluida' || t.status === 'aprovada').length;
        const pending = tarefas.filter(t => t.status !== 'concluida' && t.status !== 'aprovada').length;
        const overdue = tarefas.filter(t => 
          (t.status !== 'concluida' && t.status !== 'aprovada') && 
          isOverdue(t.data_conclusao)
        ).length;
        
        const totalHours = tarefas.reduce((acc, t) => acc + (t.tempo_gasto_minutos || 0), 0) / 60;
        const productivity = tarefas.length > 0 ? (completed / tarefas.length) * 100 : 0;

        setStats({
          tasksCompleted: completed,
          tasksPending: pending,
          tasksOverdue: overdue,
          totalTasks: tarefas.length,
          hoursWorked: Math.round(totalHours * 100) / 100,
          productivity: Math.round(productivity)
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border bg-card animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tarefas Concluídas
          </CardTitle>
          <CheckSquare className="h-4 w-4 text-kanban-completed" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">{stats.tasksCompleted}</div>
          <p className="text-xs text-muted-foreground">de {stats.totalTasks} tarefas</p>
          {stats.totalTasks > 0 && (
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div 
                className="bg-kanban-completed h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.tasksCompleted / stats.totalTasks) * 100}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tarefas Pendentes
          </CardTitle>
          <Clock className="h-4 w-4 text-kanban-executing" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">{stats.tasksPending}</div>
          <p className="text-xs text-muted-foreground">aguardando conclusão</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tarefas Atrasadas
          </CardTitle>
          <Target className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">{stats.tasksOverdue}</div>
          <p className="text-xs text-muted-foreground">fora do prazo</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Produtividade
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">{stats.productivity}%</div>
          <p className="text-xs text-muted-foreground">{stats.hoursWorked}h trabalhadas</p>
        </CardContent>
      </Card>
    </div>
  );
};