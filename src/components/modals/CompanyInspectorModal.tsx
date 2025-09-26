import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CompanyInspectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    nome_fantasia: string;
    razao_social: string;
  } | null;
}

interface CompanyStats {
  totalUsers: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalTeams: number;
  recentActivities: any[];
}

export const CompanyInspectorModal: React.FC<CompanyInspectorModalProps> = ({
  open,
  onOpenChange,
  company
}) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CompanyStats | null>(null);

  const fetchCompanyStats = async () => {
    if (!company) return;

    setLoading(true);
    try {
      // Buscar estatísticas da empresa
      const [usersRes, tasksRes, teamsRes, activitiesRes] = await Promise.all([
        // Total de usuários
        supabase
          .from('usuarios')
          .select('id, nome, tipo_usuario, ativo')
          .eq('empresa_id', company.id)
          .eq('ativo', true),
        
        // Tarefas
        supabase
          .from('tarefas')
          .select('id, titulo, status, created_at')
          .eq('empresa_id', company.id),
        
        // Equipes
        supabase
          .from('equipes')
          .select('id, nome')
          .eq('empresa_id', company.id),
        
        // Atividades recentes
        supabase
          .from('tarefas_atividades')
          .select(`
            id,
            acao,
            descricao,
            created_at,
            tarefa_id,
            tarefas!inner(titulo, empresa_id),
            usuarios!inner(nome)
          `)
          .eq('tarefas.empresa_id', company.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const totalUsers = usersRes.data?.length || 0;
      const totalTasks = tasksRes.data?.length || 0;
      const completedTasks = tasksRes.data?.filter(t => t.status === 'concluida').length || 0;
      const pendingTasks = totalTasks - completedTasks;
      const totalTeams = teamsRes.data?.length || 0;
      const recentActivities = activitiesRes.data || [];

      setStats({
        totalUsers,
        totalTasks,
        completedTasks,
        pendingTasks,
        totalTeams,
        recentActivities
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as estatísticas da empresa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && company) {
      fetchCompanyStats();
    }
  }, [open, company]);

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Inspeção da Empresa
          </DialogTitle>
          <DialogDescription>
            Visualização completa do ambiente corporativo de <strong>{company.nome_fantasia}</strong>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Estatísticas Gerais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Colaboradores da empresa</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tarefas Totais</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTasks}</div>
                  <p className="text-xs text-muted-foreground">Tarefas criadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Equipes</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTeams}</div>
                  <p className="text-xs text-muted-foreground">Equipes criadas</p>
                </CardContent>
              </Card>
            </div>

            {/* Status das Tarefas */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalTasks > 0 ? 
                      `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% do total` : 
                      'Nenhuma tarefa criada'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalTasks > 0 ? 
                      `${Math.round((stats.pendingTasks / stats.totalTasks) * 100)}% do total` : 
                      'Nenhuma tarefa criada'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Atividades Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Atividades Recentes
                </CardTitle>
                <CardDescription>
                  Últimas 10 atividades registradas na empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma atividade registrada ainda
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {stats.recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{activity.usuarios?.nome}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.acao}
                            </Badge>
                          </div>
                          {activity.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.descricao}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Tarefa: {activity.tarefas?.titulo} • {new Date(activity.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Erro ao carregar dados da empresa</p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};