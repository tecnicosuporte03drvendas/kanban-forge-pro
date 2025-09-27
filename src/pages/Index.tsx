import { DashboardStats } from "@/components/dashboard-stats"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { LogOut, Plus } from "lucide-react"
import { useEffectiveUser } from "@/hooks/use-effective-user"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { CreateTaskModal } from "@/components/modals/CreateTaskModal"
import { TaskModal } from "@/components/modals/TaskModal"

const Index = () => {
  const { usuario, logout, isStealthMode } = useEffectiveUser();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<any>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [viewTaskId, setViewTaskId] = useState<string | null>(null);
  const [refreshTasks, setRefreshTasks] = useState(0);
  
  useEffect(() => {
    const fetchEmpresa = async () => {
      if (usuario?.empresa_id) {
        const { data, error } = await supabase
          .from('empresas')
          .select('nome_fantasia')
          .eq('id', usuario.empresa_id)
          .single();
        
        if (!error && data) {
          setEmpresa(data);
        }
      }
    };
    
    fetchEmpresa();
  }, [usuario?.empresa_id]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTaskCreated = () => {
    setRefreshTasks(prev => prev + 1);
  };

  const handleTaskClick = (taskId: string) => {
    setViewTaskId(taskId);
  };

  const handleTaskUpdated = () => {
    setRefreshTasks(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6 pt-5">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Bem-vindo à empresa {empresa?.nome_fantasia || '...'}! 👋
              </h1>
              <p className="text-muted-foreground">Olá, {usuario?.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isStealthMode && (
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <DashboardStats />
        <KanbanBoard 
          key={refreshTasks} 
          onTaskClick={handleTaskClick}
          onCreateTask={() => setCreateTaskOpen(true)}
        />
      </div>

      <CreateTaskModal 
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onTaskCreated={handleTaskCreated}
      />

      <TaskModal 
        taskId={viewTaskId}
        open={!!viewTaskId}
        onOpenChange={(open) => !open && setViewTaskId(null)}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default Index;
