import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, BarChart3, Tag, Archive, TrendingUp, Clock, Users, User, RefreshCw, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TarefasList } from "@/components/TarefasList"


const Tarefas = () => {

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
            <TabsTrigger value="analise">Análise Temporal</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="arquivadas">Tarefas Arquivadas</TabsTrigger>
          </TabsList>

          <TabsContent value="tarefas" className="space-y-6">
            <TarefasList />
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