import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Plus, Search, Mail, Phone, MapPin, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const teamMembers = [
  {
    id: "1",
    name: "Sergio Ricardo",
    role: "Gerente de Vendas",
    email: "sergio@tezeusagenda.com",
    phone: "+55 21 97318-3599",
    location: "Rio de Janeiro, RJ",
    status: "Ativo",
    tasksCompleted: 1,
    tasksActive: 3,
    avatar: "SR"
  },
  {
    id: "2", 
    name: "Ana Silva",
    role: "Consultora de Vendas",
    email: "ana.silva@tezeusagenda.com",
    phone: "+55 11 98765-4321",
    location: "São Paulo, SP",
    status: "Ativo",
    tasksCompleted: 5,
    tasksActive: 2,
    avatar: "AS"
  },
  {
    id: "3",
    name: "Carlos Santos",
    role: "Representante Comercial",
    email: "carlos.santos@tezeusagenda.com", 
    phone: "+55 31 91234-5678",
    location: "Belo Horizonte, MG",
    status: "Ausente",
    tasksCompleted: 3,
    tasksActive: 1,
    avatar: "CS"
  },
  {
    id: "4",
    name: "Marina Costa",
    role: "Coordenadora de Vendas",
    email: "marina.costa@tezeusagenda.com",
    phone: "+55 85 95555-1234",
    location: "Fortaleza, CE",
    status: "Ativo",
    tasksCompleted: 7,
    tasksActive: 4,
    avatar: "MC"
  }
]

const Equipe = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-kanban-completed text-white"
      case "Ausente": return "bg-priority-medium text-white"
      case "Inativo": return "bg-muted text-muted-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
              <p className="text-muted-foreground">Gerencie os membros da sua equipe de vendas</p>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Membro
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Buscar Membros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome, função ou localização..." className="pl-10" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-card-foreground">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                        <DropdownMenuItem>Enviar Mensagem</DropdownMenuItem>
                        <DropdownMenuItem>Atribuir Tarefa</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{member.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{member.location}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-kanban-completed">{member.tasksCompleted}</div>
                        <div className="text-xs text-muted-foreground">Concluídas</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-kanban-executing">{member.tasksActive}</div>
                        <div className="text-xs text-muted-foreground">Em Andamento</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Equipe;