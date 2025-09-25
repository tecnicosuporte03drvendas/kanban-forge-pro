import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
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
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
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
              <div className="text-2xl font-bold">0</div>
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
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                Usuários ativos no sistema
              </p>
            </CardContent>
          </Card>

          {/* Card - Nova Empresa */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium flex items-center justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full">
                Criar Empresa
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Empresas */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Empresas Cadastradas</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Lista de Empresas</CardTitle>
              <CardDescription>
                Gerencie todas as empresas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma empresa cadastrada ainda.</p>
                <p className="text-sm">Clique em "Nova Empresa" para começar.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}