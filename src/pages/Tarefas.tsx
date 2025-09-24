import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Filter, Download, Calendar, User, BarChart3, Tag, Archive, RefreshCw, TrendingUp, Clock, Users, MoreHorizontal, CheckSquare, PlayCircle, Trash2, X, FileText } from "lucide-react"
import { getDateStatus } from "@/utils/date-utils"
import { useState } from "react"

const tasks = [
  {
    id: "1",
    title: "Organizar reunião de vendas",
    description: "Preparar agenda e convidar equipe para reunião semanal de vendas",
    status: "criada",
    priority: "alta",
    dueDate: "2025-01-20",
    assignee: "Sergio Ricardo",
    team: "Vendas",
    teamColor: "bg-blue-500"
  },
  {
    id: "2", 
    title: "Revisar proposta comercial",
    description: "Analisar e revisar proposta para o cliente ABC Ltda",
    status: "executando",
    priority: "media",
    dueDate: "2025-01-25",
    assignee: "Sergio Ricardo",
    team: "Comercial",
    teamColor: "bg-green-500"
  },
  {
    id: "3",
    title: "Atualizar CRM com novos leads",
    description: "Inserir os leads capturados na campanha de marketing no sistema CRM",
    status: "criada",
    priority: "media",
    dueDate: "2025-01-23",
    assignee: "Sergio Ricardo",
    team: "Marketing",
    teamColor: "bg-purple-500"
  },
  {
    id: "4",
    title: "Preparar relatório mensal de vendas",
    description: "Compilar dados de vendas do mês e preparar apresentação para diretoria",
    status: "validada",
    priority: "alta",
    dueDate: "2025-01-22",
    assignee: "Sergio Ricardo",
    team: "Vendas",
    teamColor: "bg-blue-500"
  }
]

const relatos = [
  {
    id: "1",
    title: "Reunião semanal de vendas",
    description: "Discutimos as metas do mês e revisamos os leads em andamento. A equipe está motivada e com bons resultados.",
    tags: ["vendas", "reunião", "metas"],
    relator: "Sergio Ricardo",
    date: "2025-01-20",
    status: "ativo"
  },
  {
    id: "2",
    title: "Feedback do cliente ABC Ltda",
    description: "Cliente expressou satisfação com o produto, mas sugeriu melhorias na interface do usuário e no tempo de resposta.",
    tags: ["feedback", "cliente", "produto"],
    relator: "Maria Silva",
    date: "2025-01-19",
    status: "ativo"
  },
  {
    id: "3",
    title: "Problemas técnicos identificados",
    description: "Sistema apresentou instabilidade durante o pico de acesso. Equipe técnica está investigando as causas.",
    tags: ["técnico", "sistema", "problema"],
    relator: "João Santos",
    date: "2025-01-18",
    status: "ativo"
  }
]

const Tarefas = () => {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "criada": return "bg-kanban-created text-white"
      case "assumida": return "bg-kanban-assigned text-white"
      case "executando": return "bg-kanban-executing text-white"
      case "concluida": return "bg-kanban-completed text-white"
      case "validada": return "bg-kanban-validated text-white"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-priority-high text-white"
      case "media": return "bg-priority-medium text-white"
      case "baixa": return "bg-priority-low text-white"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const selectAllTasks = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(tasks.map(task => task.id))
    }
  }

  const handleBulkAction = (action: string) => {
    console.log(`Executing ${action} on tasks:`, selectedTasks)
    // Implementar as ações aqui
    setSelectedTasks([])
  }

  const handleTaskAction = (taskId: string, action: string) => {
    console.log(`Executing ${action} on task:`, taskId)
    // Implementar as ações individuais aqui
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gerenciar Tarefas</h1>
              <p className="text-muted-foreground">Gerencie, filtre e organize suas tarefas com ferramentas avançadas</p>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <Tabs defaultValue="tarefas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card">
            <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
            <TabsTrigger value="analise">Análise Temporal</TabsTrigger>
            <TabsTrigger value="relatos">Relatos</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="arquivadas">Tarefas Arquivadas</TabsTrigger>
          </TabsList>

          <TabsContent value="tarefas" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros e Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Buscar tarefas..." className="pl-10" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="criada">Criada</SelectItem>
                        <SelectItem value="executando">Executando</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="validada">Validada</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {selectedTasks.length > 0 && (
                <Card className="border-primary bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {selectedTasks.length} tarefas selecionadas
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTasks([])}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleBulkAction('archive')}
                            className="h-8"
                          >
                            <Archive className="w-4 h-4 mr-1" />
                            Arquivar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleBulkAction('pending')}
                            className="h-8"
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Pendente
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleBulkAction('executing')}
                            className="h-8"
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Em Execução
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleBulkAction('completed')}
                            className="h-8"
                          >
                            <CheckSquare className="w-4 h-4 mr-1" />
                            Concluída
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleBulkAction('delete')}
                            className="h-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {tasks.length} de {tasks.length} tarefas encontradas
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground"
                  onClick={selectAllTasks}
                >
                  {selectedTasks.length === tasks.length ? "Desselecionar todas" : "Selecionar todas"}
                </Button>
              </div>

              {tasks.map((task) => (
                <Card key={task.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-border" 
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                          />
                          <h4 className="font-medium text-card-foreground">{task.title}</h4>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${task.teamColor} text-white border-0 px-2 py-1`}>
                            {task.team}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {task.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{task.assignee}</span>
                          </div>
                          <div className={`flex items-center gap-1 ${getDateStatus(task.dueDate).className}`}>
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(task.dueDate).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedTasks.length === 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'archive')}>
                              <Archive className="w-4 h-4 mr-2" />
                              Arquivar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'pending')}>
                              <Clock className="w-4 h-4 mr-2" />
                              Marcar como Pendente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'executing')}>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Marcar como Em Execução
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'completed')}>
                              <CheckSquare className="w-4 h-4 mr-2" />
                              Marcar como Concluída
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleTaskAction(task.id, 'delete')}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analise" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Análise Temporal</h2>
                <p className="text-muted-foreground">Métricas de produtividade e tempo</p>
              </div>
              <Select defaultValue="esta-semana">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="esta-semana">Esta Semana</SelectItem>
                  <SelectItem value="este-mes">Este Mês</SelectItem>
                  <SelectItem value="este-ano">Este Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Tarefas</p>
                      <p className="text-2xl font-bold text-foreground">4</p>
                      <p className="text-xs text-muted-foreground">nesta semana</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                      <p className="text-2xl font-bold text-foreground">25%</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tempo Médio de Conclusão</p>
                      <p className="text-2xl font-bold text-foreground">0.0h</p>
                      <p className="text-xs text-muted-foreground">por tarefa</p>
                    </div>
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Produtividade Média</p>
                      <p className="text-2xl font-bold text-foreground">0%</p>
                      <p className="text-xs text-muted-foreground">eficiência diária</p>
                    </div>
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Distribuição de Prioridades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm text-foreground">Alta Prioridade</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">2</span>
                      <span className="text-xs text-white bg-red-500 px-2 py-1 rounded">50%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-foreground">Média Prioridade</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">2</span>
                      <span className="text-xs text-white bg-yellow-500 px-2 py-1 rounded">50%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-foreground">Baixa Prioridade</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">0</span>
                      <span className="text-xs text-white bg-gray-500 px-2 py-1 rounded">0%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Visão Geral dos Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Concluídas</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">1</span>
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Em Execução</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">1</span>
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Pendentes</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">2</span>
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Performance por Responsável
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Sergio Ricardo</p>
                      <p className="text-sm text-muted-foreground">4 tarefas • 0.0h trabalhadas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">1/4 concluídas</p>
                    <p className="text-xs text-muted-foreground">25%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relatos" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Gestão de Relatos</h2>
                <p className="text-muted-foreground">Visualize e gerencie relatos de atividades e feedback</p>
              </div>
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Novo Relato
              </Button>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros e Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Buscar relatos..." className="pl-10" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="todos">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="arquivado">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {relatos.length} relatos encontrados
              </h3>
            </div>

            <div className="grid gap-4">
              {relatos.map((relato) => (
                <Card key={relato.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <h4 className="font-medium text-card-foreground text-lg">{relato.title}</h4>
                        </div>
                        
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {relato.description}
                        </p>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          {relato.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{relato.relator}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(relato.date).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Editar Relato
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="w-4 h-4 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Gestão de Tags</h2>
                <p className="text-muted-foreground">Crie e gerencie tags para classificar suas tarefas</p>
              </div>
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Tag
              </Button>
            </div>

            <Card className="border-border bg-card min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Tag className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Nenhuma tag encontrada</h3>
                  <p className="text-muted-foreground mb-4">Comece criando sua primeira tag para classificar suas tarefas.</p>
                  <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Tag
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="arquivadas" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Tarefas Arquivadas</h2>
                <p className="text-muted-foreground">Visualize e gerencie suas tarefas arquivadas</p>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Filtros e Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Buscar tarefas arquivadas..." className="pl-10" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="todos">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="todas">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="vendas">Vendas</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                0 de 0 tarefas encontradas
              </h3>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Selecionar todas
              </Button>
            </div>

            <Card className="border-border bg-card min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Archive className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Nenhuma tarefa arquivada encontrada</h3>
                  <p className="text-muted-foreground">Você ainda não possui tarefas arquivadas.</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Tarefas;