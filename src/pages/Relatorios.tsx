import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Download } from "lucide-react"
import { TaskStats } from "@/components/reports/TaskStats"
import { StatusDistribution } from "@/components/reports/StatusDistribution"
import { RecentTasks } from "@/components/reports/RecentTasks"
import { ProductivityRanking } from "@/components/reports/ProductivityRanking"
import { WeeklyChart } from "@/components/performance/WeeklyChart"
import { TeamStats } from "@/components/performance/TeamStats"
import { CompanyStats } from "@/components/performance/CompanyStats"
import { RecentActivities } from "@/components/performance/RecentActivities"
import { DateRangeFilter, DateFilterType } from "@/components/reports/DateRangeFilter"
import { useEffectiveUser } from "@/hooks/use-effective-user"
import { supabase } from "@/integrations/supabase/client"
import { DateRange } from "react-day-picker"

const Relatorios = () => {
  const { usuario } = useEffectiveUser()
  const isCollaborator = usuario?.tipo_usuario === 'colaborador'
  const [filterType, setFilterType] = useState<DateFilterType>('semana')
  const [customRange, setCustomRange] = useState<DateRange | undefined>()
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => getWeekRange())
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  function getWeekRange() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)
    
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    
    return { from: monday, to: sunday }
  }

  function getDayRange() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)
    return { from: today, to: endOfDay }
  }

  function getMonthRange() {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    firstDay.setHours(0, 0, 0, 0)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    lastDay.setHours(23, 59, 59, 999)
    return { from: firstDay, to: lastDay }
  }

  const handleFilterChange = (type: DateFilterType, range?: DateRange) => {
    setIsLoading(true)
    setFilterType(type)
    
    if (type === 'customizado' && range?.from && range?.to) {
      const from = new Date(range.from)
      from.setHours(0, 0, 0, 0)
      const to = new Date(range.to)
      to.setHours(23, 59, 59, 999)
      setCustomRange(range)
      setDateRange({ from, to })
    } else if (type === 'dia') {
      setDateRange(getDayRange())
    } else if (type === 'semana') {
      setDateRange(getWeekRange())
    } else if (type === 'mes') {
      setDateRange(getMonthRange())
    }
    
    setRefreshKey(prev => prev + 1)
    setTimeout(() => setIsLoading(false), 500)
  }

  useEffect(() => {
    if (!usuario?.empresa_id) return

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
  }, [usuario?.empresa_id])
  
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
          <div className="flex justify-between items-center">
            <DateRangeFilter
              selectedType={filterType}
              dateRange={customRange}
              onFilterChange={handleFilterChange}
            />
          </div>

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
              <TaskStats key={`stats-${refreshKey}`} dateRange={dateRange} />

              <StatusDistribution key={`status-${refreshKey}`} dateRange={dateRange} />

              <ProductivityRanking key={`ranking-${refreshKey}`} dateRange={dateRange} />

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
                      <WeeklyChart 
                        key={`chart-${refreshKey}`} 
                        userId={isCollaborator ? usuario?.id : undefined} 
                        dateRange={dateRange} 
                      />
                    </TabsContent>

                    {!isCollaborator && (
                      <TabsContent value="equipe">
                        <TeamStats key={`team-${refreshKey}`} dateRange={dateRange} />
                      </TabsContent>
                    )}

                    {!isCollaborator && (
                      <TabsContent value="empresa">
                        <CompanyStats key={`company-${refreshKey}`} dateRange={dateRange} />
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
                  <RecentActivities 
                    key={`activities-${refreshKey}`} 
                    userId={isCollaborator ? usuario?.id : undefined} 
                    dateRange={dateRange}
                  />
                </div>
              </div>

              <RecentTasks key={`tasks-${refreshKey}`} dateRange={dateRange} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Relatorios;