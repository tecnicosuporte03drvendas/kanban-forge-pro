import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectiveUser } from '@/hooks/use-effective-user';

interface WeeklyData {
  day: string;
  tasks: number;
  completed: number;
}

interface WeeklyChartProps {
  userId?: string;
}

export const WeeklyChart = ({ userId }: WeeklyChartProps) => {
  const { usuario } = useEffectiveUser()
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || usuario?.id;

  useEffect(() => {
    if (targetUserId && usuario?.empresa_id) {
      loadWeeklyData();
    }
  }, [targetUserId, usuario?.empresa_id]);

  const loadWeeklyData = async () => {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Início da semana (domingo)
      
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const weeklyStats: WeeklyData[] = [];

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(weekStart.getDate() + i);
        
        // Buscar tarefas atualizadas neste dia específico
        let query = supabase
          .from('tarefas_atividades')
          .select(`
            id,
            acao,
            tarefas!inner(
              id,
              status,
              empresa_id
            )
          `)
          .eq('tarefas.empresa_id', usuario?.empresa_id)
          .gte('created_at', currentDay.toISOString().split('T')[0] + 'T00:00:00.000Z')
          .lt('created_at', new Date(currentDay.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00.000Z');

        if (userId) {
          query = query.eq('usuario_id', userId);
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
          <CardTitle>Histórico de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-20 h-4 bg-muted rounded"></div>
                <div className="flex-1 h-2 bg-muted rounded"></div>
                <div className="w-16 h-4 bg-muted rounded"></div>
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
        <CardTitle>Histórico de Performance Semanal</CardTitle>
        <p className="text-sm text-muted-foreground">
          {userId ? 'Sua evolução' : 'Evolução da equipe'} ao longo da semana
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weeklyData.map((day, index) => (
            <div key={index} className="flex items-center gap-4">
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
        
        {weeklyData.every(d => d.tasks === 0) && (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma atividade registrada nesta semana.
          </p>
        )}
      </CardContent>
    </Card>
  );
};