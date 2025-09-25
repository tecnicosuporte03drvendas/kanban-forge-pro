import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Phone, MoreHorizontal, Users, Grid3X3, List, Edit, UserPlus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateUserModal } from "@/components/modals/CreateUserModal"
import { EditUserModal } from "@/components/modals/EditUserModal"
import { CreateTeamModal } from "@/components/modals/CreateTeamModal"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { formatCelularForDisplay } from "@/lib/utils"

interface UsuarioEmpresa {
  id: string;
  nome: string;
  email: string;
  celular: string;
  funcao_empresa: string | null;
  tipo_usuario: 'master' | 'proprietario' | 'gestor' | 'colaborador';
  ativo: boolean;
  created_at: string;
  equipes?: string[];
}

interface Equipe {
  id: string;
  nome: string;
  descricao: string | null;
  empresa_id: string;
  criado_por: string;
  created_at: string;
  updated_at: string;
  membros?: UsuarioEmpresa[];
}

const Empresa = () => {
  const { usuario } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioEmpresa | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<UsuarioEmpresa[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<any>(null);

  useEffect(() => {
    if (usuario?.empresa_id) {
      fetchEmpresa();
      fetchUsuarios();
      fetchEquipes();
    }
  }, [usuario]);

  useEffect(() => {
    // Filtrar usuários baseado no termo de busca e equipe selecionada
    let filtered = usuarios;
    
    // Filtro por termo de busca
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(user =>
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTipoUsuarioLabel(user.tipo_usuario).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.funcao_empresa && user.funcao_empresa.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filtro por equipe
    if (selectedTeam !== "all") {
      filtered = filtered.filter(user => 
        user.equipes && user.equipes.includes(selectedTeam)
      );
    }
    
    setFilteredUsuarios(filtered);
  }, [searchTerm, selectedTeam, usuarios]);

  const fetchEmpresa = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', usuario?.empresa_id)
        .single();

      if (error) throw error;
      setEmpresa(data);
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
    }
  };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          usuarios_equipes (
            equipe_id,
            equipes (
              nome
            )
          )
        `)
        .eq('empresa_id', usuario?.empresa_id)
        .neq('tipo_usuario', 'master') // Excluir masters
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include team names
      const usuariosWithTeams = data?.map(user => ({
        ...user,
        equipes: user.usuarios_equipes?.map((ue: any) => ue.equipes?.nome).filter(Boolean) || []
      })) || [];
      
      setUsuarios(usuariosWithTeams);
      setFilteredUsuarios(usuariosWithTeams);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários da empresa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipes = async () => {
    try {
      const { data, error } = await supabase
        .from('equipes')
        .select(`
          *,
          usuarios_equipes (
            usuario_id,
            usuarios (
              id,
              nome,
              email,
              funcao_empresa
            )
          )
        `)
        .eq('empresa_id', usuario?.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include members
      const equipesWithMembers = data?.map(equipe => ({
        ...equipe,
        membros: equipe.usuarios_equipes?.map((ue: any) => ue.usuarios) || []
      })) || [];
      
      setEquipes(equipesWithMembers);
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as equipes da empresa.",
        variant: "destructive",
      });
    }
  };

  const getTipoUsuarioLabel = (tipo: string) => {
    switch (tipo) {
      case 'proprietario':
        return 'Proprietário';
      case 'gestor':
        return 'Gestor';
      case 'colaborador':
        return 'Colaborador';
      default:
        return 'Usuário';
    }
  };

  const getTipoUsuarioBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'proprietario':
        return 'default';
      case 'gestor':
        return 'secondary';
      case 'colaborador':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getInitials = (nome: string) => {
    const nomes = nome.split(' ');
    return nomes.length >= 2 
      ? `${nomes[0][0]}${nomes[nomes.length - 1][0]}`.toUpperCase()
      : nome.substring(0, 2).toUpperCase();
  };

  const handleUserCreated = () => {
    fetchUsuarios(); // Recarregar lista de usuários
    toast({
      title: "Sucesso",
      description: "Usuário criado com sucesso!",
    });
  };

  const handleUserUpdated = () => {
    fetchUsuarios(); // Recarregar lista de usuários
    setSelectedUser(null);
  };

  const handleTeamCreated = () => {
    fetchEquipes(); // Recarregar lista de equipes
  };

  const handleEditUser = (user: UsuarioEmpresa) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  // Verificar se pode editar usuário
  const canEditUser = (targetUser: UsuarioEmpresa) => {
    if (!usuario) return false;
    
    // Proprietários podem editar todos (exceto outros proprietários)
    if (usuario.tipo_usuario === 'proprietario') {
      return targetUser.tipo_usuario !== 'proprietario' || targetUser.id === usuario.id;
    }
    
    // Gestores podem editar apenas colaboradores
    if (usuario.tipo_usuario === 'gestor') {
      return targetUser.tipo_usuario === 'colaborador';
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Empresa</h1>
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Empresa</h1>
              <p className="text-muted-foreground">
                {empresa?.nome_fantasia || 'Gerencie os membros da empresa'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <Tabs defaultValue="membros" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="membros">Membros</TabsTrigger>
            <TabsTrigger value="equipes">Equipes</TabsTrigger>
          </TabsList>

          <TabsContent value="membros" className="space-y-6">
            {/* Busca e Filtros */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Buscar e Filtrar Membros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por nome, cargo ou função..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground">Filtrar por Equipe</label>
                    <select 
                      className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                      <option value="all">Todas as equipes</option>
                      {equipes.map(equipe => (
                        <option key={equipe.id} value={equipe.nome}>{equipe.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações e Visualização */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{filteredUsuarios.length} de {usuarios.length} {usuarios.length === 1 ? 'membro' : 'membros'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
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
                
                <CreateUserModal
                  open={isCreateUserOpen}
                  onOpenChange={setIsCreateUserOpen}
                  onUserCreated={handleUserCreated}
                  empresaId={usuario?.empresa_id || ''}
                  empresaNome={empresa?.nome_fantasia || ''}
                />
                
                <EditUserModal
                  open={isEditUserOpen}
                  onOpenChange={setIsEditUserOpen}
                  onUserUpdated={handleUserUpdated}
                  user={selectedUser}
                />
                
                <Button 
                  className="bg-primary hover:bg-primary-hover text-primary-foreground"
                  onClick={() => setIsCreateUserOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Membro
                </Button>
              </div>
            </div>

            {/* Lista de Membros */}
            {filteredUsuarios.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" 
                : "space-y-3"
              }>
                {filteredUsuarios.map((member) => (
                  <Card key={member.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-2 pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-medium text-sm">
                              {getInitials(member.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-card-foreground text-sm truncate">{member.nome}</h3>
                            <Badge variant={getTipoUsuarioBadgeVariant(member.tipo_usuario)} className="mt-1 text-xs">
                              {getTipoUsuarioLabel(member.tipo_usuario)}
                            </Badge>
                            {member.funcao_empresa && (
                              <div className="text-xs text-muted-foreground mt-1 truncate">
                                {member.funcao_empresa}
                              </div>
                            )}
                            {member.equipes && member.equipes.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1 truncate">
                                {member.equipes.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-7 h-7 p-0">
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border-border">
                            {canEditUser(member) && (
                              <DropdownMenuItem onClick={() => handleEditUser(member)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                            <DropdownMenuItem>Enviar Mensagem</DropdownMenuItem>
                            {usuario?.tipo_usuario === 'proprietario' && member.id !== usuario.id && (
                              <DropdownMenuItem className="text-destructive">
                                Desativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 pb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span className="truncate">{formatCelularForDisplay(member.celular)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Nenhum membro encontrado
                  </h3>
                  <p className="text-muted-foreground text-center">
                    {searchTerm || selectedTeam !== "all" 
                      ? "Tente ajustar os filtros de busca"
                      : "Adicione membros à sua empresa para começar"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="equipes" className="space-y-6">
            {/* Cabeçalho da aba Equipes */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserPlus className="w-4 h-4" />
                <span>{equipes.length} {equipes.length === 1 ? 'equipe' : 'equipes'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CreateTeamModal
                  open={isCreateTeamOpen}
                  onOpenChange={setIsCreateTeamOpen}
                  onTeamCreated={handleTeamCreated}
                  usuarios={usuarios}
                />
                
                <Button 
                  className="bg-primary hover:bg-primary-hover text-primary-foreground"
                  onClick={() => setIsCreateTeamOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Equipe
                </Button>
              </div>
            </div>

            {/* Lista de Equipes */}
            {equipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {equipes.map((equipe) => (
                  <Card key={equipe.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-card-foreground">{equipe.nome}</CardTitle>
                          {equipe.descricao && (
                            <p className="text-sm text-muted-foreground mt-2">{equipe.descricao}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border-border">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar Equipe
                            </DropdownMenuItem>
                            <DropdownMenuItem>Ver Membros</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Excluir Equipe
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{equipe.membros?.length || 0} {(equipe.membros?.length || 0) === 1 ? 'membro' : 'membros'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Criada em {new Date(equipe.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserPlus className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nenhuma equipe criada
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Organize seus membros em equipes para melhor colaboração
                  </p>
                  <Button 
                    className="bg-primary hover:bg-primary-hover text-primary-foreground"
                    onClick={() => setIsCreateTeamOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Equipe
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Empresa;