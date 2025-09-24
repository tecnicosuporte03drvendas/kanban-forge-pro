import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Download, TrendingUp, Clock, Target, CheckSquare, CheckCircle } from "lucide-react"
import { getDateStatus } from "@/utils/date-utils"

const Desempenho = () => {
  const performanceData = {
    tasksCompleted: 1,
    tasksPending: 3,
    tasksOverdue: 0,
    productivity: 25,
    weeklyGoal: 4,
    monthlyGoal: 16
  }

  const insights = [
    {
      type: "success",
      title: "Excelente Performance!",
      description: "Sua produtividade de 25% está acima da média da equipe (20%).",
      icon: TrendingUp,
      color: "text-kanban-completed"
    },
    {
      type: "tip",
      title: "Dica",
      description: "Tente manter uma rotina consistente para melhorar ainda mais sua produtividade.",
      icon: Target,
      color: "text-primary"
    }
  ]

  const weeklyProgress = [
    { day: "Segunda", tasks: 0, goal: 1 },
    { day: "Terça", tasks: 1, goal: 1 },
    { day: "Quarta", tasks: 0, goal: 1 },
    { day: "Quinta", tasks: 0, goal: 1 },
    { day: "Sexta", tasks: 0, goal: 1 },
    { day: "Sábado", tasks: 0, goal: 0 },
    { day: "Domingo", tasks: 0, goal: 0 }
  ]

  const recentActivities = [
    {
      id: 1,
      action: "Tarefa concluída",
      task: "Análise de vendas Q4",
      time: "2 horas atrás",
      team: "Vendas",
      teamColor: "bg-blue-500",
      dueDate: "2025-01-20"
    },
    {
      id: 2,
      action: "Nova tarefa criada",
      task: "Reunião com cliente ABC",
      time: "4 horas atrás",
      team: "Comercial",
      teamColor: "bg-green-500",
      dueDate: "2025-01-22"
    },
    {
      id: 3,
      action: "Tarefa atualizada",
      task: "Campanha de marketing",
      time: "1 dia atrás",
      team: "Marketing",
      teamColor: "bg-purple-500",
      dueDate: "2025-01-25"
    }
  ]

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meu Desempenho</h1>
              <p className="text-muted-foreground">Acompanhe sua produtividade e performance no workspace atual</p>
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
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    DrVendas - Workspace
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      Ativo
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Workspace Ativo</p>
                </div>
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-medium text-lg">
                    DV
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tarefas Concluídas
                </CardTitle>
                <CheckSquare className="h-4 w-4 text-kanban-completed" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{performanceData.tasksCompleted}</div>
                <p className="text-xs text-muted-foreground">de 4 tarefas</p>
                <div className="mt-2 w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-kanban-completed h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(performanceData.tasksCompleted / 4) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tarefas Pendentes
                </CardTitle>
                <Clock className="h-4 w-4 text-kanban-executing" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{performanceData.tasksPending}</div>
                <p className="text-xs text-muted-foreground">aguardando conclusão</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tarefas Atrasadas
                </CardTitle>
                <Target className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{performanceData.tasksOverdue}</div>
                <p className="text-xs text-muted-foreground">fora do prazo</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Produtividade
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{performanceData.productivity}%</div>
                <p className="text-xs text-muted-foreground">+5% da semana</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <Tabs defaultValue="performance" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 bg-card">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="equipe">Equipe</TabsTrigger>
                  <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
                  <TabsTrigger value="metas">Metas</TabsTrigger>
                </TabsList>

                <TabsContent value="performance">
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Histórico de Performance</CardTitle>
                      <p className="text-sm text-muted-foreground">Acompanhe sua evolução ao longo do tempo</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {weeklyProgress.map((day, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-20 text-sm font-medium text-muted-foreground">{day.day}</div>
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  day.tasks >= day.goal ? 'bg-kanban-completed' : 'bg-kanban-executing'
                                }`}
                                style={{ width: day.goal > 0 ? `${(day.tasks / day.goal) * 100}%` : '0%' }}
                              />
                            </div>
                            <div className="w-16 text-sm font-medium text-card-foreground">
                              {day.tasks}/{day.goal}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="equipe">
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Performance da Equipe</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Comparação com outros membros da equipe.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="workspaces">
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Meus Workspaces</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Histórico de performance em diferentes workspaces.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

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
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Insights de Performance</CardTitle>
                  <p className="text-sm text-muted-foreground">Análises baseadas no seu desempenho</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights.map((insight, index) => {
                    const IconComponent = insight.icon
                    return (
                      <div key={index} className="p-3 border border-border rounded-lg bg-background/50">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${insight.type === 'success' ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                            <IconComponent className={`w-4 h-4 ${insight.color}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-card-foreground">{insight.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Atividades Recentes</CardTitle>
                  <p className="text-sm text-muted-foreground">Suas últimas ações no sistema</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border-l-2 border-primary/20 bg-accent/30 rounded-r-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{activity.action}</p>
                          <Badge className={`text-xs ${activity.teamColor} text-white border-0 px-2 py-1`}>
                            {activity.team}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground mb-1">{activity.task}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{activity.time}</span>
                          <span className={getDateStatus(activity.dueDate).className}>
                            • Vencimento: {new Date(activity.dueDate).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Desempenho;