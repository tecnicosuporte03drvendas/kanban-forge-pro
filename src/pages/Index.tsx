import { DashboardStats } from "@/components/dashboard-stats"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { SidebarTrigger } from "@/components/ui/sidebar"

const Index = () => {
  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Seja bem-vindo à UNIVERSIDADE DR VENDAS! 👋
              </h1>
              <p className="text-muted-foreground">Olá, Sergio Ricardo</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <DashboardStats />
        <KanbanBoard />
      </div>
    </div>
  );
};

export default Index;
