import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, Target, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEffectiveUser } from "@/hooks/use-effective-user";
export function DashboardStats() {
  const {
    usuario
  } = useEffectiveUser();
  const [stats, setStats] = useState({
    total: 0,
    concluidas: 0,
    executando: 0,
    atrasadas: 0
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (usuario?.empresa_id) {
      loadStats();
    }
  }, [usuario?.empresa_id]);
  const loadStats = async () => {
    if (!usuario?.empresa_id) return;
    try {
      let query = supabase.from('tarefas').select(`
          status, 
          data_conclusao,
          tarefas_responsaveis(
            usuarios:usuario_id(id),
            equipes:equipe_id(id)
          )
        `).eq('empresa_id', usuario.empresa_id);
      const {
        data: tarefas,
        error
      } = await query;
      if (error) throw error;
      let filteredTarefas = tarefas || [];

      // If user is colaborador, filter tasks to show only those they're responsible for
      if (usuario.tipo_usuario === 'colaborador') {
        // Get user's team memberships
        const {
          data: userTeams
        } = await supabase.from('usuarios_equipes').select('equipe_id').eq('usuario_id', usuario.id);
        const userTeamIds = userTeams?.map(ut => ut.equipe_id) || [];

        // Filter tasks to show only those where:
        // 1. User is directly responsible, OR
        // 2. User's team is responsible
        filteredTarefas = tarefas?.filter((tarefa: any) => {
          const responsaveis = tarefa.tarefas_responsaveis || [];

          // Check if user is directly responsible
          const isUserResponsible = responsaveis.some((r: any) => r.usuarios && r.usuarios.id === usuario.id);

          // Check if any of user's teams is responsible
          const isTeamResponsible = responsaveis.some((r: any) => r.equipes && userTeamIds.includes(r.equipes.id));
          return isUserResponsible || isTeamResponsible;
        }) || [];
      }
      const total = filteredTarefas?.length || 0;
      const concluidas = filteredTarefas?.filter(t => t.status === 'concluida' || t.status === 'aprovada').length || 0;
      const executando = filteredTarefas?.filter(t => t.status === 'executando' || t.status === 'aceita').length || 0;

      // Check overdue tasks
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const atrasadas = filteredTarefas?.filter(t => {
        const dataVencimento = new Date(t.data_conclusao);
        dataVencimento.setHours(0, 0, 0, 0);
        return dataVencimento < hoje && t.status !== 'concluida' && t.status !== 'aprovada';
      }).length || 0;
      setStats({
        total,
        concluidas,
        executando,
        atrasadas
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };
  const statsData = [{
    title: usuario?.tipo_usuario === 'colaborador' ? "Minhas Tarefas" : "Total de Tarefas",
    value: loading ? "..." : stats.total.toString(),
    description: usuario?.tipo_usuario === 'colaborador' ? "tarefas atribuídas" : "tarefas no workspace",
    icon: CheckSquare,
    color: "text-primary",
    bgColor: "bg-primary/10"
  }, {
    title: "Concluídas",
    value: loading ? "..." : stats.concluidas.toString(),
    description: "tarefas finalizadas",
    icon: Target,
    color: "text-kanban-completed",
    bgColor: "bg-green-500/10"
  }, {
    title: "Em Execução",
    value: loading ? "..." : stats.executando.toString(),
    description: "tarefas ativas",
    icon: Clock,
    color: "text-kanban-executing",
    bgColor: "bg-yellow-500/10"
  }, {
    title: "Atrasadas",
    value: loading ? "..." : stats.atrasadas.toString(),
    description: "passaram do prazo",
    icon: TrendingUp,
    color: "text-destructive",
    bgColor: "bg-red-500/10"
  }];
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {statsData.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}