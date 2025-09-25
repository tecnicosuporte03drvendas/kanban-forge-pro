import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Users, Plus, Building2, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreateUserModal } from '@/components/modals/CreateUserModal';

interface Empresa {
  id: string;
  cnpj: string | null;
  razao_social: string;
  nome_fantasia: string;
  ativa: boolean;
  created_at: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo_usuario: string;
  ativo: boolean;
  created_at: string;
}

export default function CompanyView() {
  const { empresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  const fetchEmpresa = async () => {
    if (!empresaId) return;
    
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      if (error) {
        console.error('Erro ao buscar empresa:', error);
        toast({
          title: "Erro ao carregar empresa",
          description: "Não foi possível carregar os dados da empresa.",
          variant: "destructive",
        });
        return;
      }

      setEmpresa(data);
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
    }
  };

  const fetchUsuarios = async () => {
    if (!empresaId) return;
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return;
      }

      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEmpresa(), fetchUsuarios()]);
      setLoading(false);
    };

    loadData();
  }, [empresaId]);

  const handleUserCreated = () => {
    fetchUsuarios();
  };

  const handleInspectCompany = () => {
    // Encontrar um proprietário da empresa para simular login
    const proprietario = usuarios.find(user => user.tipo_usuario === 'proprietario' && user.ativo);
    
    if (proprietario) {
      // Simular login como proprietário para inspecionar dashboard
      localStorage.setItem('usuario_logado', JSON.stringify(proprietario));
      navigate('/');
    } else {
      toast({
        title: "Não é possível inspecionar",
        description: "A empresa precisa ter um proprietário ativo para ser inspecionada.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTipoUsuarioColor = (tipo: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Empresa não encontrada</h2>
          <Button onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Building2 className="w-6 h-6" />
            <div>
              <h1 className="text-2xl font-bold">{empresa.nome_fantasia}</h1>
              <p className="text-muted-foreground">{empresa.razao_social}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {empresa.cnpj && <span>CNPJ: {empresa.cnpj}</span>}
            <Badge variant={empresa.ativa ? "default" : "secondary"}>
              {empresa.ativa ? 'Ativa' : 'Inativa'}
            </Badge>
            <span>Criada em: {formatDate(empresa.created_at)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usuarios.length}</div>
              <p className="text-xs text-muted-foreground">
                Usuários cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Proprietários
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usuarios.filter(u => u.tipo_usuario === 'proprietario').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Donos da empresa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gestores
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usuarios.filter(u => u.tipo_usuario === 'gestor').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Administradores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Colaboradores
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usuarios.filter(u => u.tipo_usuario === 'colaborador').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Usuários básicos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Usuários */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Usuários da Empresa</h2>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateUserModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
              <Button 
                variant="outline" 
                onClick={handleInspectCompany}
                disabled={!usuarios.some(user => user.tipo_usuario === 'proprietario' && user.ativo)}
              >
                <Search className="w-4 h-4 mr-2" />
                Inspecionar
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>
                Gerencie todos os usuários desta empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usuarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum usuário cadastrado ainda.</p>
                  <p className="text-sm">Clique em "Novo Usuário" para começar.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Criação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">
                            {usuario.nome}
                          </TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>
                            <Badge variant={getTipoUsuarioColor(usuario.tipo_usuario)}>
                              {usuario.tipo_usuario.charAt(0).toUpperCase() + usuario.tipo_usuario.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={usuario.ativo ? "default" : "secondary"}>
                              {usuario.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(usuario.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Criar Usuário */}
      <CreateUserModal
        open={isCreateUserModalOpen}
        onOpenChange={setIsCreateUserModalOpen}
        onUserCreated={handleUserCreated}
        empresaId={empresaId!}
        empresaNome={empresa.nome_fantasia}
      />
    </div>
  );
}