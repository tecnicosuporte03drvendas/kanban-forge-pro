import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Archive, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TarefasList } from "@/components/TarefasList";
import { ArchivedTasksList } from "@/components/ArchivedTasksList";
import { TemporalAnalysis } from "@/components/temporal-analysis/TemporalAnalysis";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { ViewTaskModal } from "@/components/modals/ViewTaskModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const Tarefas = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [refreshTasks, setRefreshTasks] = useState(0);
  const handleTaskCreated = () => {
    setRefreshTasks(prev => prev + 1);
  };
  const handleTaskUpdated = () => {
    setRefreshTasks(prev => prev + 1);
  };
  const handleOpenSecondAssumedTask = async () => {
    try {
      const {
        data: tasks,
        error
      } = await supabase.from('tarefas').select('id').eq('status', 'assumida').eq('arquivada', false).order('posicao_coluna', {
        ascending: true
      }).limit(2);
      if (error) throw error;
      if (tasks && tasks.length >= 2) {
        setSelectedTaskId(tasks[1].id);
        setShowViewModal(true);
      } else {
        toast.error('Não há uma segunda tarefa assumida disponível');
      }
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error);
      toast.error('Erro ao buscar tarefa');
    }
  };
  return <div className="flex flex-col h-screen overflow-hidden">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gerenciar Tarefas</h1>
              <p className="text-muted-foreground">Gerencie, filtre e organize suas tarefas com ferramentas avançadas</p>
            </div>
          </div>
          <div className="flex gap-2">
            
            <Button className="bg-primary hover:bg-primary-hover text-primary-foreground" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 bg-gradient-kanban min-h-full">
          <Tabs defaultValue="analise" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-card">
              <TabsTrigger value="analise">Análise Temporal</TabsTrigger>
              <TabsTrigger value="arquivadas">Tarefas Arquivadas</TabsTrigger>
            </TabsList>

            <TabsContent value="analise" className="space-y-6">
              <TemporalAnalysis />
            </TabsContent>

            <TabsContent value="arquivadas" className="space-y-6">
              <ArchivedTasksList />
            </TabsContent>
          </Tabs>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      <CreateTaskModal open={showCreateModal} onOpenChange={setShowCreateModal} onTaskCreated={handleTaskCreated} />

      {selectedTaskId && <ViewTaskModal taskId={selectedTaskId} open={showViewModal} onOpenChange={setShowViewModal} onTaskUpdated={handleTaskUpdated} />}
    </div>;
};
export default Tarefas;