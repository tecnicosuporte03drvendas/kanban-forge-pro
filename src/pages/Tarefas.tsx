import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TarefasList } from "@/components/TarefasList";
import { TemporalAnalysis } from "@/components/temporal-analysis/TemporalAnalysis";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { ViewTaskModal } from "@/components/modals/ViewTaskModal";
import { useState } from "react";

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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
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
        <div className="p-6 bg-gradient-kanban min-h-full space-y-6">
          <TemporalAnalysis />
          <TarefasList key={refreshTasks} onTaskUpdated={handleTaskUpdated} />
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      <CreateTaskModal open={showCreateModal} onOpenChange={setShowCreateModal} onTaskCreated={handleTaskCreated} />

      {selectedTaskId && <ViewTaskModal taskId={selectedTaskId} open={showViewModal} onOpenChange={setShowViewModal} onTaskUpdated={handleTaskUpdated} />}
    </div>
  );
};

export default Tarefas;
