import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Download, User, Users } from "lucide-react"
import { TaskStats } from "@/components/reports/TaskStats"
import { StatusDistribution } from "@/components/reports/StatusDistribution"
import { RecentTasks } from "@/components/reports/RecentTasks"
import { ProductivityRanking } from "@/components/reports/ProductivityRanking"
import { WeeklyChart } from "@/components/performance/WeeklyChart"
import { TeamStats } from "@/components/performance/TeamStats"
import { CompanyStats } from "@/components/performance/CompanyStats"
import { RecentActivities } from "@/components/performance/RecentActivities"
import { useEffectiveUser } from "@/hooks/use-effective-user"
import { supabase } from "@/integrations/supabase/client"
import { CompanyUsersRanking } from "@/components/reports/CompanyUsersRanking"
import { CompanyTeamsRanking } from "@/components/reports/CompanyTeamsRanking"

const Relatorios = () => {
  const { usuario } = useEffectiveUser()
  const isCollaborator = usuario?.tipo_usuario === 'colaborador'
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [hasTeam, setHasTeam] = useState(false)
  const [showCompanyStats, setShowCompanyStats] = useState(false)


  useEffect(() => {
    if (!usuario?.empresa_id) return

    // Verificar se usuário faz parte de uma equipe
    const checkTeamMembership = async () => {
      const { data } = await supabase
        .from('usuarios_equipes')
        .select('id')
        .eq('usuario_id', usuario.id)
        .limit(1)
      
      setHasTeam(!!data && data.length > 0)
    }

    checkTeamMembership()

    const channel = supabase
      .channel('relatorios-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tarefas',
          filter: `empresa_id=eq.${usuario.empresa_id}`
        },
        () => {
          setRefreshKey(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tarefas_atividades'
        },
        () => {
          setRefreshKey(prev => prev + 1)
        }
      )
      .subscribe()

    setTimeout(() => setIsLoading(false), 800)

    return () => {
      supabase.removeChannel(channel)
    }
  }, [usuario?.empresa_id, usuario?.id])
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleExport = () => {
    console.log('Exportando relatórios...')
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <div className="space-y-6">

          {!isCollaborator && (
            <div className="flex gap-2 flex-wrap items-center">
              <Button
                variant={showCompanyStats ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCompanyStats(!showCompanyStats)}
              >
                <Users className="w-4 h-4 mr-2" />
                Empresa
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-64" />
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {isCollaborator ? (
                <>
                  {/* Seção Pessoal */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold text-foreground">Pessoal</h2>
                    </div>
                    
                    <TaskStats 
                      key={`stats-personal-${refreshKey}`} 
                      dateRange={undefined} 
                      viewMode="individual"
                      userId={usuario?.id}
                    />

                    <StatusDistribution 
                      key={`status-personal-${refreshKey}`} 
                      dateRange={undefined}
                      viewMode="individual"
                      userId={usuario?.id}
                    />

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className="xl:col-span-2">
                        <WeeklyChart 
                          key={`chart-personal-${refreshKey}`} 
                          userId={usuario?.id} 
                          dateRange={undefined}
                          viewMode="individual"
                          filterType="semana"
                          showAllHistory={true}
                        />
                      </div>
                      <div>
                        <CompanyUsersRanking 
                          key={`ranking-personal-${refreshKey}`}
                          dateRange={undefined}
                          userId={usuario?.id}
                        />
                      </div>
                    </div>

                    <RecentTasks 
                      key={`tasks-personal-${refreshKey}`} 
                      dateRange={undefined}
                      viewMode="individual"
                      userId={usuario?.id}
                    />
                  </div>

                  {/* Seção Equipe - Colaboradores veem apenas se fazem parte de uma equipe */}
                  {hasTeam && (
                    <div className="space-y-4 pt-8 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold text-foreground">Equipe</h2>
                      </div>
                      
                      <TaskStats 
                        key={`stats-team-${refreshKey}`} 
                        dateRange={undefined} 
                        viewMode="equipe"
                        userId={usuario?.id}
                      />

                      <StatusDistribution 
                        key={`status-team-${refreshKey}`} 
                        dateRange={undefined}
                        viewMode="equipe"
                        userId={usuario?.id}
                      />

                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2">
                          <WeeklyChart 
                            key={`chart-team-${refreshKey}`} 
                            userId={usuario?.id} 
                            dateRange={undefined}
                            viewMode="equipe"
                            filterType="semana"
                            showAllHistory={true}
                          />
                        </div>
                        <div>
                          <CompanyTeamsRanking 
                            key={`ranking-team-${refreshKey}`}
                            dateRange={undefined}
                          />
                        </div>
                      </div>

                      <RecentTasks 
                        key={`tasks-team-${refreshKey}`} 
                        dateRange={undefined}
                        viewMode="equipe"
                        userId={usuario?.id}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {!showCompanyStats ? (
                    <>
                      {/* Seção Pessoal */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          <h2 className="text-xl font-semibold text-foreground">Pessoal</h2>
                        </div>
                        
                        <TaskStats 
                          key={`stats-personal-${refreshKey}`} 
                          dateRange={undefined} 
                          viewMode="individual"
                          userId={usuario?.id}
                        />

                        <StatusDistribution 
                          key={`status-personal-${refreshKey}`} 
                          dateRange={undefined}
                          viewMode="individual"
                          userId={usuario?.id}
                        />

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                          <div className="xl:col-span-2">
                            <WeeklyChart 
                              key={`chart-personal-${refreshKey}`} 
                              userId={usuario?.id} 
                              dateRange={undefined}
                              viewMode="individual"
                              filterType="semana"
                              showAllHistory={true}
                            />
                          </div>
                          <div>
                            <CompanyUsersRanking 
                              key={`ranking-personal-${refreshKey}`}
                              dateRange={undefined}
                              userId={usuario?.id}
                            />
                          </div>
                        </div>

                        <RecentTasks 
                          key={`tasks-personal-${refreshKey}`} 
                          dateRange={undefined}
                          viewMode="individual"
                          userId={usuario?.id}
                        />
                      </div>

                      {/* Seção Equipe - Gestores/Proprietários veem todas as equipes da empresa */}
                      <div className="space-y-4 pt-8 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          <h2 className="text-xl font-semibold text-foreground">Equipes</h2>
                        </div>
                          
                          <TaskStats 
                            key={`stats-team-${refreshKey}`} 
                            dateRange={undefined} 
                            viewMode="equipe"
                            userId={usuario?.id}
                          />

                          <StatusDistribution 
                            key={`status-team-${refreshKey}`} 
                            dateRange={undefined}
                            viewMode="equipe"
                            userId={usuario?.id}
                          />

                          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="xl:col-span-2">
                            <WeeklyChart 
                              key={`chart-team-${refreshKey}`} 
                              userId={usuario?.id} 
                              dateRange={undefined}
                              viewMode="equipe"
                              filterType="semana"
                              showAllHistory={true}
                            />
                            </div>
                            <div>
                            <CompanyTeamsRanking 
                              key={`ranking-team-${refreshKey}`}
                              dateRange={undefined}
                            />
                            </div>
                          </div>

                        <RecentTasks 
                          key={`tasks-team-${refreshKey}`} 
                          dateRange={undefined}
                          viewMode="equipe"
                          userId={usuario?.id}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold text-foreground">Empresa</h2>
                      </div>
                      
                      <TaskStats 
                        key={`stats-company-${refreshKey}`} 
                        dateRange={undefined} 
                        viewMode="geral"
                        userId={usuario?.id}
                      />

                      <StatusDistribution 
                        key={`status-company-${refreshKey}`} 
                        dateRange={undefined}
                        viewMode="geral"
                        userId={usuario?.id}
                      />

                      <TeamStats key={`team-performance-${refreshKey}`} dateRange={undefined} />

                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2">
                          <CompanyStats key={`company-stats-${refreshKey}`} dateRange={undefined} />
                        </div>
                        <div>
                          <CompanyTeamsRanking 
                            key={`ranking-company-${refreshKey}`}
                            dateRange={undefined}
                          />
                        </div>
                      </div>

                      <RecentActivities 
                        key={`activities-company-${refreshKey}`} 
                        dateRange={undefined}
                      />

                      <RecentTasks 
                        key={`tasks-company-${refreshKey}`} 
                        dateRange={undefined}
                        viewMode="geral"
                        userId={usuario?.id}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Relatorios;