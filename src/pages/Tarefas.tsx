import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Tag, Archive, RefreshCw, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TarefasList } from "@/components/TarefasList"
import { TemporalAnalysis } from "@/components/temporal-analysis/TemporalAnalysis"


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
            <TemporalAnalysis />
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