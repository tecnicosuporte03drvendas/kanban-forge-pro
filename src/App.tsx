import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import Index from "./pages/Index";
import Tarefas from "./pages/Tarefas";
import Calendario from "./pages/Calendario";
import Relatorios from "./pages/Relatorios";
import Equipe from "./pages/Equipe";
import Desempenho from "./pages/Desempenho";
import Integracoes from "./pages/Integracoes";
import Ajuda from "./pages/Ajuda";
import NotFound from "./pages/NotFound";
import AdminMasterAuth from "./pages/AdminMasterAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="tezeus-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider defaultOpen={true}>
            <div className="min-h-screen flex w-full bg-background">
              <AppSidebar />
              <main className="flex-1 overflow-hidden">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/tarefas" element={<Tarefas />} />
                  <Route path="/calendario" element={<Calendario />} />
                  <Route path="/relatorios" element={<Relatorios />} />
                  <Route path="/equipe" element={<Equipe />} />
                  <Route path="/desempenho" element={<Desempenho />} />
                  <Route path="/integracoes" element={<Integracoes />} />
                  <Route path="/ajuda" element={<Ajuda />} />
                  <Route path="/adminmasterauth" element={<AdminMasterAuth />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
