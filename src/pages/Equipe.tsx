import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Mail, Phone, MapPin, MoreHorizontal, Users, UserPlus, Grid3X3, List } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const teamMembers = [
  {
    id: "1",
    name: "Sergio Ricardo",
    role: "Gerente de Vendas",
    email: "sergio@tezeusagenda.com",
    phone: "+55 21 97318-3599",
    location: "Rio de Janeiro, RJ",
    team: "Vendas RJ",
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
    team: "Vendas SP",
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
    team: "Vendas MG",
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
    team: "Vendas NE",
    tasksCompleted: 7,
    tasksActive: 4,
    avatar: "MC"
  }
]

const teams = [
  {
    id: "1",
    name: "Vendas RJ",
    description: "Equipe de vendas do Rio de Janeiro",
    collaborators: 3,
    tasksActive: 12,
    tasksCompleted: 28
  },
  {
    id: "2",
    name: "Vendas SP",
    description: "Equipe de vendas de São Paulo",
    collaborators: 5,
    tasksActive: 18,
    tasksCompleted: 45
  },
  {
    id: "3",
    name: "Vendas MG",
    description: "Equipe de vendas de Minas Gerais",
    collaborators: 2,
    tasksActive: 8,
    tasksCompleted: 22
  },
  {
    id: "4",
    name: "Vendas NE",
    description: "Equipe de vendas do Nordeste",
    collaborators: 4,
    tasksActive: 15,
    tasksCompleted: 35
  }
]

const collaboratorSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter menos de 100 caracteres"),
  role: z.string().trim().min(1, "Função é obrigatória").max(100, "Função deve ter menos de 100 caracteres"),
  whatsapp: z.string().trim().min(1, "WhatsApp é obrigatório").regex(/^\+?[1-9]\d{1,14}$/, "Formato de WhatsApp inválido"),
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter menos de 255 caracteres"),
  location: z.string().trim().max(100, "Localização deve ter menos de 100 caracteres").optional(),
  team: z.string().min(1, "Equipe é obrigatória"),
  level: z.enum(["gestor", "colaborador"], {
    required_error: "Nível é obrigatório",
  }),
})

type CollaboratorFormData = z.infer<typeof collaboratorSchema>

const Equipe = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddCollaboratorOpen, setIsAddCollaboratorOpen] = useState(false);

  const form = useForm<CollaboratorFormData>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: {
      name: "",
      role: "",
      whatsapp: "",
      email: "",
      location: "",
      team: "",
      level: "colaborador",
    },
  });

  const onSubmit = (data: CollaboratorFormData) => {
    console.log("Novo colaborador:", data);
    // Aqui você processaria os dados do formulário
    setIsAddCollaboratorOpen(false);
    form.reset();
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
              <p className="text-muted-foreground">Gerencie as equipes e colaboradores</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <Tabs defaultValue="colaboradores" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
            <TabsTrigger value="equipes">Equipes</TabsTrigger>
          </TabsList>

          <TabsContent value="colaboradores" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Buscar Colaboradores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nome, função ou localização..." className="pl-10" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <Dialog open={isAddCollaboratorOpen} onOpenChange={setIsAddCollaboratorOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Colaborador
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Colaborador</DialogTitle>
                    <DialogDescription>
                      Preencha as informações do novo colaborador
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome *</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Função na Empresa *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Gerente de Vendas" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp *</FormLabel>
                            <FormControl>
                              <Input placeholder="+55 11 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input placeholder="email@exemplo.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Localização (Opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: São Paulo, SP" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="team"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Equipe *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma equipe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {teams.map((team) => (
                                  <SelectItem key={team.id} value={team.name}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nível *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o nível" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="colaborador">Colaborador</SelectItem>
                                <SelectItem value="gestor">Gestor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsAddCollaboratorOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
                        >
                          Adicionar Colaborador
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {viewMode === 'grid' ? (
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
                        <span className="text-sm text-muted-foreground">Equipe</span>
                        <Badge className="bg-primary text-primary-foreground">
                          {member.team}
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
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="p-0">
                  <div className="space-y-0 divide-y divide-border">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                                {member.avatar}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                              <div>
                                <h3 className="font-semibold text-card-foreground">{member.name}</h3>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                              </div>
                              
                              <div>
                                <Badge className="bg-primary text-primary-foreground mb-2">
                                  {member.team}
                                </Badge>
                                <div className="text-sm text-muted-foreground">{member.location}</div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{member.email}</span>
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{member.phone}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-kanban-completed">{member.tasksCompleted}</div>
                                  <div className="text-xs text-muted-foreground">Concluídas</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-kanban-executing">{member.tasksActive}</div>
                                  <div className="text-xs text-muted-foreground">Em Andamento</div>
                                </div>
                              </div>
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="equipes" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Buscar Equipes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nome ou descrição..." className="pl-10" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Equipe
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team) => (
                <Card key={team.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">{team.name}</h3>
                          <p className="text-sm text-muted-foreground">{team.description}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Editar Equipe
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Editar Equipe</DialogTitle>
                                <DialogDescription>
                                  Altere o nome da equipe e adicione colaboradores
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label htmlFor="team-name" className="text-sm font-medium">
                                    Nome da Equipe
                                  </label>
                                  <Input 
                                    id="team-name"
                                    defaultValue={team.name}
                                    placeholder="Digite o nome da equipe"
                                  />
                                </div>
                                
                                <div className="space-y-3">
                                  <h4 className="font-medium">Adicionar Colaborador à Equipe</h4>
                                  <div className="flex gap-2">
                                    <Select>
                                      <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Selecionar colaborador" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {teamMembers.map((member) => (
                                          <SelectItem key={member.id} value={member.id}>
                                            {member.name} - {member.role}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button>
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      Adicionar
                                    </Button>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="font-medium">Colaboradores da Equipe</h4>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {teamMembers
                                      .filter(member => member.team === team.name)
                                      .map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                          <div className="flex items-center gap-2">
                                            <Avatar className="w-6 h-6">
                                              <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">{member.name}</span>
                                          </div>
                                          <Button variant="ghost" size="sm" className="text-destructive">
                                            Remover
                                          </Button>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                                
                                <div className="flex justify-end gap-2 pt-4">
                                  <Button variant="outline">Cancelar</Button>
                                  <Button>Salvar Alterações</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenuItem className="text-destructive">Remover Equipe</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Colaboradores</span>
                        <span className="font-medium">{team.collaborators}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-kanban-completed">{team.tasksCompleted}</div>
                          <div className="text-xs text-muted-foreground">Concluídas</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-kanban-executing">{team.tasksActive}</div>
                          <div className="text-xs text-muted-foreground">Em Andamento</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Equipe;