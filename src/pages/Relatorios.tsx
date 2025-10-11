import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Download } from "lucide-react"
import { TaskStats } from "@/components/reports/TaskStats"
import { WeeklyProductivity } from "@/components/reports/WeeklyProductivity" 
import { StatusDistribution } from "@/components/reports/StatusDistribution"
import { RecentTasks } from "@/components/reports/RecentTasks"
import { ProductivityRanking } from "@/components/reports/ProductivityRanking"
import { WeeklyChart } from "@/components/performance/WeeklyChart"
import { TeamStats } from "@/components/performance/TeamStats"
import { CompanyStats } from "@/components/performance/CompanyStats"
import { RecentActivities } from "@/components/performance/RecentActivities"
import { useEffectiveUser } from "@/hooks/use-effective-user"

const Relatorios = () => {
  const { usuario } = useEffectiveUser()
  const isCollaborator = usuario?.tipo_usuario === 'colaborador'
  
  const handleRefresh = () => {
    window.location.reload()
  }

  const handleExport = () => {
    // TODO: Implementar funcionalidade de export
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
          <TaskStats />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <WeeklyProductivity />
            <StatusDistribution />
          </div>

          <ProductivityRanking />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <Tabs defaultValue="performance" className="space-y-4">
                <TabsList className={`grid w-full ${isCollaborator ? 'grid-cols-2' : 'grid-cols-4'} bg-card`}>
                  <TabsTrigger value="performance">
                    {isCollaborator ? 'Minha Performance' : 'Performance Individual'}
                  </TabsTrigger>
                  {!isCollaborator && <TabsTrigger value="equipe">Equipe</TabsTrigger>}
                  {!isCollaborator && <TabsTrigger value="empresa">Empresa</TabsTrigger>}
                  <TabsTrigger value="metas">Metas</TabsTrigger>
                </TabsList>

                <TabsContent value="performance">
                  <WeeklyChart userId={isCollaborator ? usuario?.id : undefined} />
                </TabsContent>

                {!isCollaborator && (
                  <TabsContent value="equipe">
                    <TeamStats />
                  </TabsContent>
                )}

                {!isCollaborator && (
                  <TabsContent value="empresa">
                    <CompanyStats />
                  </TabsContent>
                )}

                <TabsContent value="metas">
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Metas e Objetivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Defina e acompanhe suas metas pessoais.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <RecentActivities userId={isCollaborator ? usuario?.id : undefined} />
            </div>
          </div>

          <RecentTasks />
        </div>
      </div>
    </div>
  );
};

export default Relatorios;