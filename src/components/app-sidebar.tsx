import { useState, useEffect } from "react"
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Users, 
  User, 
  Settings, 
  HelpCircle,
  Shield,
  Moon,
  Sun,
  Monitor,
  LogOut,
  UserCircle
} from "lucide-react"
import { NavLink, useLocation, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTheme } from "@/components/theme-provider"
import { useEffectiveUser } from "@/hooks/use-effective-user"
import { useStealth } from "@/hooks/use-stealth"
import { supabase } from "@/integrations/supabase/client"

const getMenuItems = (tipoUsuario: string, isStealthMode: boolean, empresaId?: string) => {
  const baseUrl = isStealthMode && empresaId ? `/empresa/${empresaId}` : '';
  const stealthParams = isStealthMode && empresaId ? 
    `?stealth=true&master_id=${new URLSearchParams(window.location.search).get('master_id')}` : '';
  
  const allItems = [
    { title: "Dashboard", url: `${baseUrl}/${stealthParams}`, icon: LayoutDashboard },
    { title: "Tarefas", url: `${baseUrl}/tarefas${stealthParams}`, icon: CheckSquare },
    { title: "Agenda", url: `${baseUrl}/calendario${stealthParams}`, icon: Calendar },
    { title: "Relatórios", url: `${baseUrl}/relatorios${stealthParams}`, icon: BarChart3 },
    { title: "Empresa", url: `${baseUrl}/empresa${stealthParams}`, icon: Users },
    { title: tipoUsuario === 'colaborador' ? "Meu Desempenho" : "Desempenho", url: `${baseUrl}/desempenho${stealthParams}`, icon: User },
    { title: "Integrações", url: `${baseUrl}/integracoes${stealthParams}`, icon: Settings },
    { title: "Central de Ajuda", url: `${baseUrl}/ajuda${stealthParams}`, icon: HelpCircle },
    { title: "Administração", url: "/admin", icon: Shield },
  ];

  // Filter out Tarefas and Relatórios for colaborador users
  if (tipoUsuario === 'colaborador') {
    return allItems.filter(item => 
      item.title !== "Tarefas" && item.title !== "Relatórios"
    );
  }

  return allItems;
}

export function AppSidebar() {
  const { state } = useSidebar()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const collapsed = state === "collapsed"
  const location = useLocation()
  const { empresaId } = useParams()
  const { theme, setTheme } = useTheme()
  const { usuario, logout, isStealthMode } = useEffectiveUser()
  const currentPath = location.pathname
  
  const [perfilUsuario, setPerfilUsuario] = useState<{
    nome: string;
    iniciais: string;
    funcao: string;
  } | null>(null);

  useEffect(() => {
    if (usuario) {
      // Calcular iniciais do nome
      const nomes = usuario.nome.split(' ');
      const iniciais = nomes.length >= 2 
        ? `${nomes[0][0]}${nomes[nomes.length - 1][0]}`.toUpperCase()
        : nomes[0].substring(0, 2).toUpperCase();
      
      // Usar a função da empresa se disponível, senão usar baseado no tipo de usuário
      let funcao = usuario.funcao_empresa || '';
      
      if (!funcao) {
        switch (usuario.tipo_usuario) {
          case 'proprietario':
            funcao = 'Proprietário';
            break;
          case 'gestor':
            funcao = 'Gestor';
            break;
          case 'colaborador':
            funcao = 'Colaborador';
            break;
          case 'master':
            funcao = 'Master';
            break;
          default:
            funcao = 'Usuário';
        }
      }
      
      setPerfilUsuario({
        nome: usuario.nome,
        iniciais,
        funcao
      });
    }
  }, [usuario]);

  const handleLogout = async () => {
    await logout();
    setShowLogoutDialog(false);
  }

  const isActive = (path: string) => currentPath === path
  
  const getNavClasses = (path: string) => {
    const baseClasses = `flex items-center w-full h-12 rounded-lg transition-all duration-200 ${collapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'}`
    if (isActive(path)) {
      return `${baseClasses} bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm`
    }
    return `${baseClasses} text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground`
  }

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 border-r border-sidebar-border bg-sidebar`}
      collapsible="icon"
    >
      <SidebarHeader className={`border-b border-sidebar-border ${collapsed ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm shadow-sm">
            T
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">TzAgenda</h2>
              <p className="text-xs text-sidebar-foreground/60">Gestão Empresarial</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={collapsed ? 'px-2 py-4' : 'px-3 py-4'}>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium mb-2 px-3">
              MENU PRINCIPAL
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {getMenuItems(usuario?.tipo_usuario || '', isStealthMode, empresaId).map((item) => {
                // Ocultar "Administração" para usuários que não sejam master ou em modo stealth
                if (item.title === "Administração" && (usuario?.tipo_usuario !== 'master' || isStealthMode)) {
                  return null;
                }
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavClasses(item.url)}
                    >
                      <item.icon className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-5 h-5'}`} />
                      {!collapsed && <span className="font-medium truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`border-t border-sidebar-border ${collapsed ? 'p-2' : 'p-3'}`}>
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-2'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-10 h-10 p-0 hover:bg-sidebar-accent rounded-lg"
              >
                {theme === "light" ? (
                  <Sun className="w-4 h-4 text-sidebar-foreground" />
                ) : theme === "dark" ? (
                  <Moon className="w-4 h-4 text-sidebar-foreground" />
                ) : (
                  <Monitor className="w-4 h-4 text-sidebar-foreground" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="w-4 h-4 mr-2" />
                Claro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="w-4 h-4 mr-2" />
                Escuro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="w-4 h-4 mr-2" />
                Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {!collapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex-1 text-left">
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                  <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-sidebar-accent-foreground">
                      {perfilUsuario?.iniciais || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {perfilUsuario?.nome || 'Usuário'}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      {perfilUsuario?.funcao || ''}
                    </p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <NavLink 
                    to={isStealthMode && empresaId ? 
                      `/empresa/${empresaId}/perfil?stealth=true&master_id=${new URLSearchParams(window.location.search).get('master_id')}` : 
                      "/perfil"
                    }
                    className="flex items-center cursor-pointer"
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Ver Perfil
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowLogoutDialog(true)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {collapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-10 h-10 p-0 rounded-full hover:bg-sidebar-accent"
                >
                  <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-sidebar-accent-foreground">
                      {perfilUsuario?.iniciais || 'U'}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <NavLink 
                    to={isStealthMode && empresaId ? 
                      `/empresa/${empresaId}/perfil?stealth=true&master_id=${new URLSearchParams(window.location.search).get('master_id')}` : 
                      "/perfil"
                    }
                    className="flex items-center cursor-pointer"
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Ver Perfil
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowLogoutDialog(true)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarFooter>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  )
}