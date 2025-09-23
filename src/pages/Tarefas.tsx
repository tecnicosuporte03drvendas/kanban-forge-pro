import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Download, Calendar, User, Clock } from "lucide-react"

const tasks = [
  {
    id: "1",
    title: "Organizar reunião de vendas",
    description: "Preparar agenda e convidar equipe para reunião semanal de vendas",
    status: "criada",
    priority: "alta",
    dueDate: "2025-09-25",
    assignee: "Sergio Ricardo",
    category: "Vendas"
  },
  {
    id: "2", 
    title: "Revisar proposta comercial",
    description: "Analisar e revisar proposta para o cliente ABC Ltda",
    status: "executando",
    priority: "media",
    dueDate: "2025-09-27",
    assignee: "Sergio Ricardo",
    category: "Comercial"
  },
  {
    id: "3",
    title: "Atualizar CRM com novos leads",
    description: "Inserir os leads capturados na campanha de marketing no sistema CRM",
    status: "criada",
    priority: "media",
    dueDate: "2025-09-24",
    assignee: "Sergio Ricardo",
    category: "CRM"
  },
  {
    id: "4",
    title: "Preparar relatório mensal de vendas",
    description: "Compilar dados de vendas do mês e preparar apresentação para diretoria",
    status: "validada",
    priority: "alta",
    dueDate: "2025-09-21",
    assignee: "Sergio Ricardo",
    category: "Relatórios"
  }
]

const Tarefas = () => {
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
          <TabsList className="grid w-full grid-cols-4 bg-card">
            <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
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
                    <Select defaultValue="todos">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="criada">Criada</SelectItem>
                        <SelectItem value="executando">Executando</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="validada">Validada</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="todas">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {tasks.length} de {tasks.length} tarefas encontradas
                </h3>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Selecionar todas
                </Button>
              </div>

              {tasks.map((task) => (
                <Card key={task.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 rounded border-border" />
                          <h4 className="font-medium text-card-foreground">{task.title}</h4>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
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
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(task.dueDate).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categorias">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Gerencie as categorias das suas tarefas.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Organize suas tarefas com tags personalizadas.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="arquivadas">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Tarefas Arquivadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Visualize suas tarefas arquivadas.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Tarefas;