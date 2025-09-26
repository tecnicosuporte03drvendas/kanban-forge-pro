import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isOverdue } from "@/utils/date-utils";

interface CompanyMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalUsers: number;
  activeUsers: number;
  totalHours: number;
  averageProductivity: number;
}

export const CompanyStats = () => {
  const { usuario } = useAuth();
  const [metrics, setMetrics] = useState<CompanyMetrics>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalHours: 0,
    averageProductivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadCompanyStats();
    }
  }, [usuario?.empresa_id]);

  const loadCompanyStats = async () => {
    try {
      // Buscar todas as tarefas da empresa
      const { data: tarefas } = await supabase
        .from('tarefas')
        .select('*')
        .eq('empresa_id', usuario?.empresa_id)
        .eq('arquivada', false);

      // Buscar todos os usuários da empresa
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('*')
        .eq('empresa_id', usuario?.empresa_id);

      if (tarefas && usuarios) {
        const completed = tarefas.filter(t => t.status === 'concluida' || t.status === 'validada').length;
        const pending = tarefas.filter(t => t.status !== 'concluida' && t.status !== 'validada').length;
        const overdue = tarefas.filter(t => 
          (t.status !== 'concluida' && t.status !== 'validada') && 
          isOverdue(t.data_conclusao)
        ).length;
        
        const totalHours = tarefas.reduce((acc, t) => acc + (t.tempo_gasto_minutos || 0), 0) / 60;
        const activeUsers = usuarios.filter(u => u.ativo).length;
        const averageProductivity = tarefas.length > 0 ? (completed / tarefas.length) * 100 : 0;

        setMetrics({
          totalTasks: tarefas.length,
          completedTasks: completed,
          pendingTasks: pending,
          overdueTasks: overdue,
          totalUsers: usuarios.length,
          activeUsers,
          totalHours: Math.round(totalHours * 100) / 100,
          averageProductivity: Math.round(averageProductivity)
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas da empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Performance da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-6 bg-muted rounded w-16"></div>
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
        <CardTitle>Performance da Empresa</CardTitle>
        <p className="text-sm text-muted-foreground">Métricas gerais e indicadores organizacionais</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total de Tarefas</span>
              <Badge variant="outline">{metrics.totalTasks}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tarefas Concluídas</span>
              <Badge className="bg-kanban-completed text-white border-0">
                {metrics.completedTasks}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tarefas Pendentes</span>
              <Badge className="bg-kanban-executing text-white border-0">
                {metrics.pendingTasks}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tarefas Atrasadas</span>
              <Badge variant="destructive">
                {metrics.overdueTasks}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total de Usuários</span>
              <Badge variant="outline">{metrics.totalUsers}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Usuários Ativos</span>
              <Badge className="bg-primary text-primary-foreground">
                {metrics.activeUsers}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Horas Trabalhadas</span>
              <Badge variant="secondary">
                {metrics.totalHours}h
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Produtividade Média</span>
              <Badge 
                variant={metrics.averageProductivity >= 80 ? "default" : metrics.averageProductivity >= 60 ? "secondary" : "destructive"}
              >
                {metrics.averageProductivity}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress bar para produtividade geral */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-sm text-muted-foreground">
              {metrics.completedTasks} de {metrics.totalTasks} tarefas
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary to-primary-hover h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${metrics.totalTasks > 0 ? (metrics.completedTasks / metrics.totalTasks) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};