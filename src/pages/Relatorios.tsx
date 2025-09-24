import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Clock, Users, Download, RefreshCw } from "lucide-react"
import { getDateStatus } from "@/utils/date-utils"

const Relatorios = () => {
  const stats = [
    {
      title: "Tarefas Validadas",
      value: "1",
      subtitle: "tarefas validadas",
      icon: BarChart3,
      color: "text-kanban-validated",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Em Execução", 
      value: "3",
      subtitle: "tarefas ativas",
      icon: Clock,
      color: "text-kanban-executing",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "Atrasadas",
      value: "0",
      subtitle: "fora do prazo",
      icon: TrendingUp,
      color: "text-destructive",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Taxa de Conclusão",
      value: "25%",
      subtitle: "taxa de sucesso",
      icon: Users,
      color: "text-kanban-completed",
      bgColor: "bg-green-500/10"
    }
  ]

  const recentTasks = [
    { 
      id: 1, 
      title: "Análise de vendas Q4", 
      status: "concluida", 
      dueDate: "2025-01-20",
      team: "Vendas",
      teamColor: "bg-blue-500"
    },
    { 
      id: 2, 
      title: "Reunião com cliente ABC", 
      status: "executando", 
      dueDate: "2025-01-22",
      team: "Comercial",
      teamColor: "bg-green-500"
    },
    { 
      id: 3, 
      title: "Campanha de marketing", 
      status: "criada", 
      dueDate: "2025-01-25",
      team: "Marketing",
      teamColor: "bg-purple-500"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluida": return "bg-kanban-completed"
      case "executando": return "bg-kanban-executing"
      case "criada": return "bg-kanban-created"
      default: return "bg-muted"
    }
  }

  const weeklyData = [
    { day: "Seg", value: 0 },
    { day: "Ter", value: 1 },
    { day: "Qua", value: 0 },
    { day: "Qui", value: 0 },
    { day: "Sex", value: 2 },
    { day: "Sáb", value: 1 },
    { day: "Dom", value: 0 }
  ]

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
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 pt-12 pb-6 bg-gradient-kanban">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <Card key={index} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <IconComponent className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Produtividade Semanal</CardTitle>
                <p className="text-sm text-muted-foreground">Tarefas criadas ou validadas nos últimos 7 dias</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyData.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium text-muted-foreground">{item.day}</div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${(item.value / 4) * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm font-medium text-card-foreground">{item.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
                <p className="text-sm text-muted-foreground">Visão geral do status das tarefas</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-kanban-validated rounded-full"></div>
                      <span className="text-sm font-medium">Validada</span>
                    </div>
                    <Badge variant="secondary">25%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-kanban-executing rounded-full"></div>
                      <span className="text-sm font-medium">Em Execução</span>
                    </div>
                    <Badge variant="secondary">75%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-kanban-created rounded-full"></div>
                      <span className="text-sm font-medium">Atrasada</span>
                    </div>
                    <Badge variant="secondary">0%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Tarefas Recentes</CardTitle>
              <p className="text-sm text-muted-foreground">Últimas atividades da equipe</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{task.title}</p>
                        <Badge className={`text-xs ${task.teamColor} text-white border-0 px-2 py-1`}>
                          {task.team}
                        </Badge>
                      </div>
                      <p className={`text-xs ${getDateStatus(task.dueDate).className}`}>
                        Vencimento: {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {task.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Ranking de Produtividade
              </CardTitle>
              <p className="text-sm text-muted-foreground">Os colaboradores mais produtivos da semana</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-sidebar-accent-foreground">SR</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-card-foreground">Sergio Ricardo</h4>
                    <p className="text-sm text-muted-foreground">1 tarefas validadas</p>
                  </div>
                  <Badge className="bg-kanban-completed text-white">25%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;