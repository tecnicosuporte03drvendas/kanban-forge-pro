import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectiveUser } from '@/hooks/use-effective-user';

import { DateFilterType } from "@/components/reports/DateRangeFilter"

interface WeeklyData {
  day: string;
  tasks: number;
  completed: number;
}

interface WeeklyChartProps {
  userId?: string;
  dateRange?: { from: Date; to: Date }
  viewMode?: 'geral' | 'individual' | 'equipe'
  filterType?: DateFilterType
  showAllHistory?: boolean
}

export const WeeklyChart = ({ userId, dateRange, viewMode = 'geral', filterType = 'semana', showAllHistory = false }: WeeklyChartProps) => {
  const { usuario } = useEffectiveUser()
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || usuario?.id;

  // Define título baseado no período
  const getChartTitle = () => {
    if (showAllHistory) {
      return 'Histórico Completo de Performance'
    }
    
    switch (filterType) {
      case 'dia':
        return 'Histórico de Performance do Dia'
      case 'semana':
        return 'Histórico de Performance Semanal'
      case 'mes':
        return 'Histórico de Performance Mensal'
      case 'customizado':
        return 'Histórico de Performance no Período'
      default:
        return 'Histórico de Performance'
    }
  }

  const getChartSubtitle = () => {
    if (showAllHistory) {
      return 'Selecione um período para visualizar o histórico detalhado'
    }
    
    const target = userId ? 'Sua evolução' : 'Evolução da equipe'
    switch (filterType) {
      case 'dia':
        return `${target} ao longo do dia`
      case 'semana':
        return `${target} ao longo da semana`
      case 'mes':
        return `${target} ao longo do mês`
      case 'customizado':
        return `${target} no período selecionado`
      default:
        return target
    }
  }

  useEffect(() => {
    if (usuario?.empresa_id) {
      setLoading(true)
      loadWeeklyData()
    }
  }, [targetUserId, usuario?.empresa_id, dateRange, viewMode, filterType]);

  const loadWeeklyData = async () => {
    try {
      // Se showAllHistory for true e não houver dateRange, não exibir gráfico semanal
      if (showAllHistory && !dateRange) {
        setWeeklyData([])
        setLoading(false)
        return
      }

      const from = dateRange?.from || (() => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return weekStart;
      })();
      const to = dateRange?.to || new Date();
      
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const weeklyStats: WeeklyData[] = [];

      // Buscar equipes se viewMode for 'equipe'
      let teamIds: string[] = []
      if (viewMode === 'equipe' && targetUserId) {
        const { data: userTeams } = await supabase
          .from('usuarios_equipes')
          .select('equipe_id')
          .eq('usuario_id', targetUserId)
        
        teamIds = userTeams?.map(ut => ut.equipe_id) || []
      }

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(from);
        currentDay.setDate(from.getDate() + i);
        
        let query = supabase
          .from('tarefas_atividades')
          .select(`
            id,
            acao,
            usuario_id,
            tarefas!inner(
              id,
              status,
              empresa_id
            )
          `)
          .eq('tarefas.empresa_id', usuario?.empresa_id)
          .gte('created_at', currentDay.toISOString().split('T')[0] + 'T00:00:00.000Z')
          .lt('created_at', new Date(currentDay.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00.000Z');

        if (viewMode === 'individual' && targetUserId) {
          query = query.eq('usuario_id', targetUserId);
        } else if (viewMode === 'equipe' && teamIds.length > 0) {
          // Buscar usuários das equipes
          const { data: teamMembers } = await supabase
            .from('usuarios_equipes')
            .select('usuario_id')
            .in('equipe_id', teamIds)
          
          const memberIds = teamMembers?.map(m => m.usuario_id) || []
          if (memberIds.length > 0) {
            query = query.in('usuario_id', memberIds)
          }
        }

        const { data: activities } = await query;
        
        const tasksWorked = activities?.length || 0;
        const tasksCompleted = activities?.filter(a => 
          a.acao.toLowerCase().includes('conclu') || 
          a.acao.toLowerCase().includes('finaliz')
        ).length || 0;

        weeklyStats.push({
          day: dayNames[i],
          tasks: tasksWorked,
          completed: tasksCompleted
        });
      }

      setWeeklyData(weeklyStats);
    } catch (error) {
      console.error('Erro ao carregar dados semanais:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>{getChartTitle()}</CardTitle>
          <p className="text-sm text-muted-foreground">{getChartSubtitle()}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-20 h-4 bg-muted rounded animate-shimmer"></div>
                <div className="flex-1 h-2 bg-muted rounded animate-shimmer"></div>
                <div className="w-16 h-4 bg-muted rounded animate-shimmer"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxTasks = Math.max(...weeklyData.map(d => d.tasks), 1);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {getChartSubtitle()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weeklyData.map((day, index) => (
            <div key={index} className="flex items-center gap-4 animate-fade-in">
              <div className="w-20 text-sm font-medium text-muted-foreground">
                {day.day}
              </div>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-300"
                  style={{ width: `${(day.tasks / maxTasks) * 100}%` }}
                />
              </div>
              <div className="w-16 text-sm font-medium text-card-foreground">
                {day.completed}/{day.tasks}
              </div>
            </div>
          ))}
        </div>
        
        {showAllHistory && weeklyData.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Para visualizar o histórico semanal, selecione um período específico.
          </p>
        ) : weeklyData.every(d => d.tasks === 0) && (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma atividade registrada neste período.
          </p>
        )}
      </CardContent>
    </Card>
  );
};