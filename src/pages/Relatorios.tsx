import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { RefreshCw, Download } from "lucide-react"
import { TaskStats } from "@/components/reports/TaskStats"
import { WeeklyProductivity } from "@/components/reports/WeeklyProductivity" 
import { StatusDistribution } from "@/components/reports/StatusDistribution"
import { RecentTasks } from "@/components/reports/RecentTasks"
import { ProductivityRanking } from "@/components/reports/ProductivityRanking"

const Relatorios = () => {
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
              <p className="text-muted-foreground">Acompanhe a produtividade e performance da equipe no CDE</p>
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

          <RecentTasks />

          <ProductivityRanking />
        </div>
      </div>
    </div>
  );
};

export default Relatorios;