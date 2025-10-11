import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Button } from "@/components/ui/button";
import { LogOut, Minimize2, Maximize2 } from "lucide-react";
import { useEffectiveUser } from "@/hooks/use-effective-user";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { ViewTaskModal } from "@/components/modals/ViewTaskModal";
import type { StatusTarefa } from "@/types/task";
const Index = () => {
  const {
    usuario,
    logout,
    isStealthMode
  } = useEffectiveUser();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<any>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [viewTaskId, setViewTaskId] = useState<string | null>(null);
  const [allCardsCompact, setAllCardsCompact] = useState(false);

  const toggleAllCardsCompact = () => {
    setAllCardsCompact(prev => !prev);
  };

  useEffect(() => {
    const fetchEmpresa = async () => {
      if (usuario?.empresa_id) {
        const {
          data,
          error
        } = await supabase.from('empresas').select('nome_fantasia').eq('id', usuario.empresa_id).single();
        if (!error && data) {
          setEmpresa(data);
        }
      }
    };
    fetchEmpresa();
  }, [usuario?.empresa_id]);

  // Realtime subscriptions for tasks
  useEffect(() => {
    if (!usuario?.empresa_id) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tarefas',
          filter: `empresa_id=eq.${usuario.empresa_id}`
        },
        (payload) => {
          console.log('🔄 Realtime task update:', payload);
          const taskId = (payload.new as any)?.id || (payload.old as any)?.id;
          
          if (taskId && (window as any).__kanbanUpdateTask) {
            (window as any).__kanbanUpdateTask(taskId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tarefas_responsaveis'
        },
        (payload) => {
          console.log('🔄 Realtime responsibles update:', payload);
          const taskId = (payload.new as any)?.tarefa_id || (payload.old as any)?.tarefa_id;
          
          if (taskId && (window as any).__kanbanUpdateTask) {
            (window as any).__kanbanUpdateTask(taskId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tarefas_atividades'
        },
        (payload) => {
          console.log('🔄 Realtime activities update:', payload);
          const taskId = (payload.new as any)?.tarefa_id || (payload.old as any)?.tarefa_id;
          
          if (taskId && (window as any).__kanbanUpdateTask) {
            (window as any).__kanbanUpdateTask(taskId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tarefas_comentarios'
        },
        (payload) => {
          console.log('🔄 Realtime comments update:', payload);
          const taskId = (payload.new as any)?.tarefa_id || (payload.old as any)?.tarefa_id;
          
          if (taskId && (window as any).__kanbanUpdateTask) {
            (window as any).__kanbanUpdateTask(taskId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuario?.empresa_id]);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const handleTaskCreated = () => {
    // Realtime will automatically detect the new task and add it
    // No need to manually refresh
  };
  const handleTaskClick = (taskId: string) => {
    setViewTaskId(taskId);
  };

  const handleTaskUpdated = () => {
    // Task updates are handled by realtime, no need to refresh
    // The realtime listener will automatically update the specific task
  };

  const handleTaskApprove = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tarefas')
        .update({ 
          status: 'aprovada' as StatusTarefa,
          tempo_fim: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Task will be automatically updated via realtime
      console.log('✅ Task approved successfully');
    } catch (error) {
      console.error('❌ Error approving task:', error);
    }
  };
  return <div className="flex flex-col min-h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between h-full px-6 pt-5">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Bem-vindo à empresa {empresa?.nome_fantasia || '...'}! 👋
              </h1>
              <p className="text-muted-foreground">Olá, {usuario?.nome}</p>
            </div>
          </div>
          
        </div>
      </header>

      <div className="p-6 bg-gradient-kanban">
        <KanbanBoard
          onTaskClick={handleTaskClick} 
          onCreateTask={() => setCreateTaskOpen(true)}
          allCardsCompact={allCardsCompact}
          onToggleAllCardsCompact={toggleAllCardsCompact}
          onRealtimeUpdate={(taskId) => {
            if ((window as any).__kanbanUpdateTask) {
              (window as any).__kanbanUpdateTask(taskId)
            }
          }}
          onTaskApprove={handleTaskApprove}
        />
      </div>

      <CreateTaskModal open={createTaskOpen} onOpenChange={setCreateTaskOpen} onTaskCreated={handleTaskCreated} />

      {viewTaskId && (
        <ViewTaskModal 
          taskId={viewTaskId} 
          open={!!viewTaskId} 
          onOpenChange={open => !open && setViewTaskId(null)} 
          onTaskUpdated={handleTaskUpdated} 
        />
      )}
    </div>;
};
export default Index;