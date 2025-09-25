import { useState } from "react"
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
  Monitor
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
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
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/AuthContext"

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
  { title: "Calendário", url: "/calendario", icon: Calendar },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Equipe", url: "/equipe", icon: Users },
  { title: "Meu Desempenho", url: "/desempenho", icon: User },
  { title: "Integrações", url: "/integracoes", icon: Settings },
  { title: "Central de Ajuda", url: "/ajuda", icon: HelpCircle },
  { title: "Administração", url: "/adminmasterauth", icon: Shield },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { usuario } = useAuth()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  
  const getNavClasses = (path: string) => {
    const baseClasses = "w-full justify-start gap-3 h-12 rounded-lg transition-all duration-200"
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
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
            T
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">Tezeus Agenda</h2>
              <p className="text-xs text-sidebar-foreground/60">Ambiente Corporativo</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium mb-2">
            {!collapsed && "MENU PRINCIPAL"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                // Ocultar "Administração" para usuários que não sejam master
                if (item.title === "Administração" && usuario?.tipo_usuario !== 'master') {
                  return null;
                }
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={getNavClasses(item.url)}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-10 h-10 p-0 hover:bg-sidebar-accent"
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
            <NavLink to="/perfil" className="flex-1">
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-sidebar-accent-foreground">SR</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">Sergio Ricardo</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">Gerente de Vendas</p>
                </div>
              </div>
            </NavLink>
          )}
          
          {collapsed && (
            <NavLink to="/perfil" className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-sidebar-accent/50 transition-colors">
              <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-sidebar-accent-foreground">SR</span>
              </div>
            </NavLink>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}