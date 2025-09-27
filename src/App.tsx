import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StealthIndicator } from "@/components/StealthIndicator";
import { StealthUserProvider } from "@/components/StealthUserProvider";
import Index from "./pages/Index";
import Tarefas from "./pages/Tarefas";
import Calendario from "./pages/Calendario";
import Relatorios from "./pages/Relatorios";
import Empresa from "./pages/Empresa";
import Desempenho from "./pages/Desempenho";
import Integracoes from "./pages/Integracoes";
import Ajuda from "./pages/Ajuda";
import Perfil from "./pages/Perfil";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";

const CompanyView = lazy(() => import("./pages/CompanyView"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="tezeus-ui-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <StealthIndicator />
          <BrowserRouter>
            <Routes>
              {/* Rota pública de login */}
              <Route path="/login" element={<Login />} />
              
              {/* Rota específica do Admin Master */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['master']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Rota para visualizar empresa */}
              <Route
                path="/admin/empresa/:empresaId"
                element={
                  <ProtectedRoute allowedRoles={['master']}>
                    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>}>
                      <CompanyView />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              
              {/* Rota stealth para master acessar ambiente da empresa */}
              <Route
                path="/empresa/:empresaId/*"
                element={
                  <StealthUserProvider>
                    <SidebarProvider defaultOpen={true}>
                      <div className="min-h-screen flex w-full bg-background">
                        <AppSidebar />
                        <main className="flex-1 overflow-hidden">
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/dashboard" element={<Index />} />
                            <Route path="/tarefas" element={<Tarefas />} />
                            <Route path="/calendario" element={<Calendario />} />
                            <Route path="/relatorios" element={<Relatorios />} />
                            <Route path="/empresa" element={<Empresa />} />
                            <Route path="/desempenho" element={<Desempenho />} />
                            <Route path="/integracoes" element={<Integracoes />} />
                            <Route path="/ajuda" element={<Ajuda />} />
                            <Route path="/perfil" element={<Perfil />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </SidebarProvider>
                  </StealthUserProvider>
                }
              />
              
              {/* Rotas protegidas com sidebar */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute allowedRoles={['proprietario', 'gestor', 'colaborador']}>
                    <SidebarProvider defaultOpen={true}>
                      <div className="min-h-screen flex w-full bg-background">
                        <AppSidebar />
                        <main className="flex-1 overflow-hidden">
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/dashboard" element={<Index />} />
                            <Route path="/tarefas" element={<Tarefas />} />
                            <Route path="/calendario" element={<Calendario />} />
                            <Route path="/relatorios" element={<Relatorios />} />
                            <Route path="/empresa" element={<Empresa />} />
                            <Route path="/desempenho" element={<Desempenho />} />
                            <Route path="/integracoes" element={<Integracoes />} />
                            <Route path="/ajuda" element={<Ajuda />} />
                            <Route path="/perfil" element={<Perfil />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
