import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Users, CheckSquare, Users2, BarChart3, TrendingUp, Activity, Shield, MoreHorizontal, Edit, Archive } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const AdminMasterAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Dados mockados para o dashboard
  const empresas = [
    {
      id: 1,
      nome: 'TechCorp Solutions',
      funcionarios: 45,
      tarefas: 127,
      grupos: 8,
      status: 'Ativo',
      plano: 'Premium'
    },
    {
      id: 2,
      nome: 'Marketing Digital Pro',
      funcionarios: 23,
      tarefas: 89,
      grupos: 5,
      status: 'Ativo',
      plano: 'Business'
    },
    {
      id: 3,
      nome: 'Consultoria Empresarial',
      funcionarios: 67,
      tarefas: 234,
      grupos: 12,
      status: 'Ativo',
      plano: 'Enterprise'
    },
    {
      id: 4,
      nome: 'Startup Innovation',
      funcionarios: 15,
      tarefas: 45,
      grupos: 3,
      status: 'Trial',
      plano: 'Basic'
    }
  ];

  const estatisticas = {
    totalEmpresas: 47,
    totalUsuarios: 1834,
    tarefasConcluidas: 12456,
    crescimentoMensal: 23.5,
    usuariosAtivos: 1567,
    novasEmpresasMes: 8
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-background px-6 pt-12 pb-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Painel Administrativo Master
              </h1>
              <p className="text-muted-foreground mt-1">Gerenciamento completo da plataforma</p>
            </div>
            <Button onClick={() => setIsLoggedIn(false)} variant="outline">
              Sair
            </Button>
          </div>

          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.totalEmpresas}</div>
                <p className="text-xs text-muted-foreground">
                  +{estatisticas.novasEmpresasMes} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.totalUsuarios.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Plataforma completa
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Análise</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.2%</div>
                <p className="text-xs text-muted-foreground">
                  Uptime médio
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Empresas */}
          <Card>
            <CardHeader>
              <CardTitle>Empresas Registradas</CardTitle>
              <CardDescription>
                Visão geral de todas as empresas na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Funcionários</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresas.map((empresa) => (
                    <TableRow key={empresa.id}>
                      <TableCell className="font-medium">{empresa.nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {empresa.funcionarios}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={empresa.plano === 'Enterprise' ? 'default' : empresa.plano === 'Premium' ? 'secondary' : 'outline'}>
                          {empresa.plano}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={empresa.status === 'Ativo' ? 'default' : 'secondary'}>
                          {empresa.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Archive className="w-4 h-4 mr-2" />
                              Arquivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Estatísticas Detalhadas */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Planos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Enterprise</span>
                <Badge>12 empresas</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Premium</span>
                <Badge>18 empresas</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Business</span>
                <Badge>14 empresas</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Basic</span>
                <Badge>3 empresas</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Master</CardTitle>
            <CardDescription>
              Painel administrativo da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@exemplo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="cadastro" className="space-y-4 mt-6">
                <form onSubmit={handleCadastro} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-email">Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creation-key">Chave de Criação</Label>
                    <Input
                      id="creation-key"
                      type="password"
                      placeholder="Chave master de criação"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Criar Conta Master
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMasterAuth;