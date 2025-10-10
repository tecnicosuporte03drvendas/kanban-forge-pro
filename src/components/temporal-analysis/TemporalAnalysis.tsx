import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Clock, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectiveUser } from '@/hooks/use-effective-user';
import { ResponsiblePerformance } from "@/components/ResponsiblePerformance";

interface TemporalMetrics {
  totalTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  averageProductivity: number;
  priorityDistribution: {
    alta: number;
    media: number;
    baixa: number;
    urgente: number;
  };
  statusDistribution: {
    concluida: number;
    validada: number;
    executando: number;
    assumida: number;
    criada: number;
  };
}

type TimePeriod = 'esta-semana' | 'este-mes' | 'este-ano';

export const TemporalAnalysis = () => {
  const { usuario } = useEffectiveUser()
  const [metrics, setMetrics] = useState<TemporalMetrics>({
    totalTasks: 0,
    completionRate: 0,
    averageCompletionTime: 0,
    averageProductivity: 0,
    priorityDistribution: { alta: 0, media: 0, baixa: 0, urgente: 0 },
    statusDistribution: { concluida: 0, validada: 0, executando: 0, assumida: 0, criada: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('esta-semana');

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadTemporalMetrics();
    }
  }, [usuario?.empresa_id, period]);

  const getDateRange = (period: TimePeriod) => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'esta-semana':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Início da semana
        break;
      case 'este-mes':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Início do mês
        break;
      case 'este-ano':
        startDate = new Date(now.getFullYear(), 0, 1); // Início do ano
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    return {
      start: startDate.toISOString(),
      end: now.toISOString()
    };
  };

  const loadTemporalMetrics = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange(period);

      // Buscar todas as tarefas da empresa no período
      const { data: tarefas } = await supabase
        .from('tarefas')
        .select('*')
        .eq('empresa_id', usuario?.empresa_id)
        .gte('created_at', start)
        .lte('created_at', end)
        .eq('arquivada', false);

      if (tarefas) {
        // Calcular métricas
        const totalTasks = tarefas.length;
        const completedTasks = tarefas.filter(t => 
          t.status === 'concluida' || t.status === 'validada'
        ).length;
        
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Calcular tempo médio de conclusão (em horas)
        const completedTasksWithTime = tarefas.filter(t => 
          (t.status === 'concluida' || t.status === 'validada') && 
          t.tempo_gasto_minutos !== null
        );
        
        const averageCompletionTime = completedTasksWithTime.length > 0
          ? completedTasksWithTime.reduce((acc, t) => acc + (t.tempo_gasto_minutos || 0), 0) 
            / completedTasksWithTime.length / 60 // Converter para horas
          : 0;

        // Calcular produtividade média
        const totalMinutes = tarefas.reduce((acc, t) => acc + (t.tempo_gasto_minutos || 0), 0);
        const averageProductivity = totalTasks > 0 ? totalMinutes / totalTasks / 60 : 0;

        // Distribuição de prioridades
        const priorityDistribution = {
          alta: tarefas.filter(t => t.prioridade === 'alta').length,
          media: tarefas.filter(t => t.prioridade === 'media').length,
          baixa: tarefas.filter(t => t.prioridade === 'baixa').length,
          urgente: tarefas.filter(t => t.prioridade === 'urgente').length,
        };

        // Distribuição de status
        const statusDistribution = {
          concluida: tarefas.filter(t => t.status === 'concluida').length,
          validada: tarefas.filter(t => t.status === 'validada').length,
          executando: tarefas.filter(t => t.status === 'executando').length,
          assumida: tarefas.filter(t => t.status === 'assumida').length,
          criada: tarefas.filter(t => t.status === 'criada').length,
        };

        setMetrics({
          totalTasks,
          completionRate: Math.round(completionRate),
          averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
          averageProductivity: Math.round(averageProductivity * 100) / 100,
          priorityDistribution,
          statusDistribution
        });
      }
    } catch (error) {
      console.error('Erro ao carregar métricas temporais:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-600';
      case 'alta': return 'bg-red-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': 
      case 'validada': return 'bg-green-500';
      case 'executando': return 'bg-blue-500';
      case 'assumida': return 'bg-orange-500';
      case 'criada': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'esta-semana': return 'nesta semana';
      case 'este-mes': return 'neste mês';
      case 'este-ano': return 'neste ano';
      default: return 'no período';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Análise Temporal</h2>
            <p className="text-muted-foreground">Métricas de produtividade e tempo</p>
          </div>
          <div className="h-10 w-40 bg-muted animate-pulse rounded"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border bg-card animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                  </div>
                  <div className="h-10 w-10 bg-muted rounded-lg"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Análise Temporal</h2>
          <p className="text-muted-foreground">Métricas de produtividade e tempo</p>
        </div>
        <Select value={period} onValueChange={(value: TimePeriod) => setPeriod(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="esta-semana">Esta Semana</SelectItem>
            <SelectItem value="este-mes">Este Mês</SelectItem>
            <SelectItem value="este-ano">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Tarefas</p>
                <p className="text-2xl font-bold text-foreground">{metrics.totalTasks}</p>
                <p className="text-xs text-muted-foreground">{getPeriodLabel(period)}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-foreground">{metrics.completionRate}%</p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${metrics.completionRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio de Conclusão</p>
                <p className="text-2xl font-bold text-foreground">{metrics.averageCompletionTime}h</p>
                <p className="text-xs text-muted-foreground">por tarefa</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produtividade Média</p>
                <p className="text-2xl font-bold text-foreground">{metrics.averageProductivity}h</p>
                <p className="text-xs text-muted-foreground">tempo por tarefa</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Target className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Distribuição de Prioridades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.priorityDistribution).map(([priority, count]) => {
              const percentage = metrics.totalTasks > 0 ? Math.round((count / metrics.totalTasks) * 100) : 0;
              return (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`}></div>
                    <span className="text-sm text-foreground capitalize">
                      {priority === 'urgente' ? 'Urgente' : 
                       priority === 'alta' ? 'Alta Prioridade' :
                       priority === 'media' ? 'Média Prioridade' : 'Baixa Prioridade'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{count}</span>
                    <span className={`text-xs text-white px-2 py-1 rounded ${getPriorityColor(priority)}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Visão Geral dos Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.statusDistribution).map(([status, count]) => {
              const percentage = metrics.totalTasks > 0 ? (count / metrics.totalTasks) * 100 : 0;
              const statusLabels: Record<string, string> = {
                concluida: 'Concluídas',
                validada: 'Validadas',
                executando: 'Em Execução',
                assumida: 'Assumidas',
                criada: 'Criadas'
              };
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{statusLabels[status] || status}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{count}</span>
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(status)}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <ResponsiblePerformance />
    </div>
  );
};