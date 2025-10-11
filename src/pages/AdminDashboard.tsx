import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Building2, Users, Plus, LogOut, ArrowRight, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveUser } from '@/hooks/use-effective-user';
import { useNavigate } from 'react-router-dom';
import { CreateCompanyModal } from '@/components/modals/CreateCompanyModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
interface Empresa {
  id: string;
  cnpj: string | null;
  razao_social: string;
  nome_fantasia: string;
  ativa: boolean;
  created_at: string;
}
export function AdminDashboard() {
  const {
    usuario,
    logout
  } = useEffectiveUser();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [loading, setLoading] = useState(true);
  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutDialog(false);
  };
  const fetchEmpresas = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('empresas').select('*').order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Erro ao buscar empresas:', error);
        toast({
          title: "Erro ao carregar empresas",
          description: "Não foi possível carregar a lista de empresas.",
          variant: "destructive"
        });
        return;
      }
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };
  const fetchUsuarios = async () => {
    try {
      const {
        count,
        error
      } = await supabase.from('usuarios').select('*', {
        count: 'exact',
        head: true
      }).eq('ativo', true);
      if (error) {
        console.error('Erro ao contar usuários:', error);
        return;
      }
      setTotalUsuarios(count || 0);
    } catch (error) {
      console.error('Erro ao contar usuários:', error);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEmpresas(), fetchUsuarios()]);
      setLoading(false);
    };
    loadData();
  }, []);
  const handleCompanyCreated = () => {
    fetchEmpresas();
    fetchUsuarios();
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Bem-vindo, {usuario?.nome}
              <Badge variant="secondary" className="ml-2">
                {usuario?.tipo_usuario.toUpperCase()}
              </Badge>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={() => navigate('/admin/configuracoes')} title="Configurações">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => setShowLogoutDialog(true)}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card - Empresas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Empresas
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : empresas.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Empresas ativas no sistema
              </p>
            </CardContent>
          </Card>

          {/* Card - Usuários */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : totalUsuarios}
              </div>
              <p className="text-xs text-muted-foreground">
                Usuários ativos no sistema
              </p>
            </CardContent>
          </Card>

          {/* Card - Nova Empresa */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium flex items-center justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full" onClick={() => setIsModalOpen(true)}>
                Criar Empresa
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Empresas */}
        <div className="mt-8">
          
          
          <Card>
            <CardHeader>
              <CardTitle>Lista de Empresas</CardTitle>
              <CardDescription>
                Gerencie todas as empresas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Carregando empresas...</p>
                </div> : empresas.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma empresa cadastrada ainda.</p>
                  <p className="text-sm">Clique em "Nova Empresa" para começar.</p>
                </div> : <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome Fantasia</TableHead>
                        <TableHead>Razão Social</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px] text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empresas.map(empresa => <TableRow key={empresa.id}>
                          <TableCell className="font-medium">
                            {empresa.nome_fantasia}
                          </TableCell>
                          <TableCell>{empresa.razao_social}</TableCell>
                          <TableCell>{empresa.cnpj || '-'}</TableCell>
                          <TableCell>{formatDate(empresa.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant={empresa.ativa ? "default" : "secondary"}>
                              {empresa.ativa ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/empresa/${empresa.id}`)} className="text-slate-50 bg-slate-900 hover:bg-slate-800">
                              <ArrowRight className="w-4 h-4" />
                              Acessar Empresa
                            </Button>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Criar Empresa */}
      <CreateCompanyModal open={isModalOpen} onOpenChange={setIsModalOpen} onCompanyCreated={handleCompanyCreated} />

      {/* Modal de Confirmação de Saída */}
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
    </div>;
}