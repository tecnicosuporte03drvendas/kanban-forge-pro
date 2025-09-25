import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Plus, Search, Mail, Phone, MoreHorizontal, Users, Grid3X3, List, Edit } from "lucide-react"
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
import { CreateUserModal } from "@/components/modals/CreateUserModal"
import { EditUserModal } from "@/components/modals/EditUserModal"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface UsuarioEmpresa {
  id: string;
  nome: string;
  email: string;
  celular: string;
  funcao_empresa: string | null;
  tipo_usuario: 'master' | 'proprietario' | 'gestor' | 'colaborador';
  ativo: boolean;
  created_at: string;
}

const Empresa = () => {
  const { usuario } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioEmpresa | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<UsuarioEmpresa[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<any>(null);

  useEffect(() => {
    if (usuario?.empresa_id) {
      fetchEmpresa();
      fetchUsuarios();
    }
  }, [usuario]);

  useEffect(() => {
    // Filtrar usuários baseado no termo de busca
    if (searchTerm.trim() === "") {
      setFilteredUsuarios(usuarios);
    } else {
      const filtered = usuarios.filter(user =>
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTipoUsuarioLabel(user.tipo_usuario).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsuarios(filtered);
    }
  }, [searchTerm, usuarios]);

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
        .select('*')
        .eq('empresa_id', usuario?.empresa_id)
        .neq('tipo_usuario', 'master') // Excluir masters
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUsuarios(data || []);
      setFilteredUsuarios(data || []);
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

  const proprietarios = usuarios.filter(u => u.tipo_usuario === 'proprietario');
  const outrosMembros = usuarios.filter(u => u.tipo_usuario !== 'proprietario');

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
        <div className="space-y-6">
          {/* Busca e Filtros */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Buscar Membros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome, email ou função..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ações e Visualização */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{usuarios.length} {usuarios.length === 1 ? 'membro' : 'membros'}</span>
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

          {/* Seção Proprietários */}
          {proprietarios.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Proprietários</h2>
                <Badge variant="outline">{proprietarios.length}</Badge>
              </div>
              
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {proprietarios.map((member) => (
                  <Card key={member.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                              {getInitials(member.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-card-foreground">{member.nome}</h3>
                            <Badge variant={getTipoUsuarioBadgeVariant(member.tipo_usuario)} className="mt-1">
                              {getTipoUsuarioLabel(member.tipo_usuario)}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                    
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span className="truncate">{member.celular}</span>
                      </div>
                      {member.funcao_empresa && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Função:</strong> {member.funcao_empresa}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Membro desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Seção Outros Membros */}
          {outrosMembros.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Outros Membros</h2>
                <Badge variant="outline">{outrosMembros.length}</Badge>
              </div>
              
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {outrosMembros.filter(member => 
                  searchTerm === '' || 
                  member.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  getTipoUsuarioLabel(member.tipo_usuario).toLowerCase().includes(searchTerm.toLowerCase())
                ).map((member) => (
                  <Card key={member.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                              {getInitials(member.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-card-foreground">{member.nome}</h3>
                            <Badge variant={getTipoUsuarioBadgeVariant(member.tipo_usuario)} className="mt-1">
                              {getTipoUsuarioLabel(member.tipo_usuario)}
                            </Badge>
                          </div>
                        </div>
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEditUser(member) && (
                              <DropdownMenuItem onClick={() => handleEditUser(member)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                            <DropdownMenuItem>Enviar Mensagem</DropdownMenuItem>
                            {(usuario?.tipo_usuario === 'proprietario' || usuario?.tipo_usuario === 'gestor') && (
                              <DropdownMenuItem className="text-destructive">
                                Desativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                     <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span className="truncate">{member.celular}</span>
                      </div>
                      {member.funcao_empresa && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Função:</strong> {member.funcao_empresa}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Membro desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {usuarios.length === 0 && (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum membro encontrado
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece adicionando membros à sua empresa
                </p>
                <Button 
                  className="bg-primary hover:bg-primary-hover text-primary-foreground"
                  onClick={() => setIsCreateUserOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Membro
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Estado de busca vazia */}
          {usuarios.length > 0 && filteredUsuarios.length === 0 && searchTerm && (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-muted-foreground text-center">
                  Tente usar outros termos de busca
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Empresa;