import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TeamMember {
  id: string;
  nome: string;
  email: string;
  totalTasks: number;
  completedTasks: number;
  hoursWorked: number;
  productivity: number;
}

export const TeamStats = () => {
  const { usuario } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadTeamStats();
    }
  }, [usuario?.empresa_id]);

  const loadTeamStats = async () => {
    try {
      // Buscar todos os usuários da empresa
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('empresa_id', usuario?.empresa_id)
        .eq('ativo', true);

      if (usuarios) {
        const teamStatsPromises = usuarios.map(async (user) => {
          // Buscar tarefas do usuário
          const { data: tarefasResponsaveis } = await supabase
            .from('tarefas_responsaveis')
            .select(`
              tarefa_id,
              tarefas!inner(
                id,
                status,
                tempo_gasto_minutos,
                arquivada,
                empresa_id
              )
            `)
            .eq('usuario_id', user.id)
            .eq('tarefas.empresa_id', usuario?.empresa_id)
            .eq('tarefas.arquivada', false);

          const tarefas = tarefasResponsaveis?.map(tr => tr.tarefas) || [];
          const completed = tarefas.filter(t => t.status === 'concluida' || t.status === 'validada').length;
          const totalHours = tarefas.reduce((acc, t) => acc + (t.tempo_gasto_minutos || 0), 0) / 60;
          const productivity = tarefas.length > 0 ? (completed / tarefas.length) * 100 : 0;

          return {
            id: user.id,
            nome: user.nome,
            email: user.email,
            totalTasks: tarefas.length,
            completedTasks: completed,
            hoursWorked: Math.round(totalHours * 100) / 100,
            productivity: Math.round(productivity)
          };
        });

        const teamStats = await Promise.all(teamStatsPromises);
        // Ordenar por produtividade (maior para menor)
        teamStats.sort((a, b) => b.productivity - a.productivity);
        setTeamMembers(teamStats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas da equipe:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Performance da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-muted rounded w-12"></div>
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
        <CardTitle>Performance da Equipe</CardTitle>
        <p className="text-sm text-muted-foreground">Ranking de produtividade dos membros</p>
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhum membro encontrado na equipe.</p>
        ) : (
          <div className="space-y-4">
            {teamMembers.map((member, index) => {
              const initials = member.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              
              return (
                <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-background/50">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-card-foreground truncate">
                      {member.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.completedTasks}/{member.totalTasks} tarefas • {member.hoursWorked}h
                    </p>
                  </div>
                  
                  <Badge 
                    variant={member.productivity >= 80 ? "default" : member.productivity >= 60 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {member.productivity}%
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};