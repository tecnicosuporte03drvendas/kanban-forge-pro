import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Archive, RefreshCw, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TarefasList } from "@/components/TarefasList"
import { ArchivedTasksList } from "@/components/ArchivedTasksList"
import { TemporalAnalysis } from "@/components/temporal-analysis/TemporalAnalysis"
import { CreateTaskModal } from "@/components/modals/CreateTaskModal"
import { useState } from "react"


const Tarefas = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshTasks, setRefreshTasks] = useState(0)

  const handleTaskCreated = () => {
    setRefreshTasks(prev => prev + 1)
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
          <Button 
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <Tabs defaultValue="tarefas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card">
            <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
            <TabsTrigger value="analise">Análise Temporal</TabsTrigger>
            <TabsTrigger value="arquivadas">Tarefas Arquivadas</TabsTrigger>
          </TabsList>

          <TabsContent value="tarefas" className="space-y-6">
            <TarefasList key={refreshTasks} />
          </TabsContent>

          <TabsContent value="analise" className="space-y-6">
            <TemporalAnalysis />
          </TabsContent>

          <TabsContent value="arquivadas" className="space-y-6">
            <ArchivedTasksList />
          </TabsContent>
        </Tabs>
      </div>

      <CreateTaskModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};

export default Tarefas;