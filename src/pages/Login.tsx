import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {
    login,
    isAuthenticated,
    usuario
  } = useAuth();
  const navigate = useNavigate();

  // Se já está logado, redirecionar para o painel apropriado
  if (isAuthenticated && usuario) {
    switch (usuario.tipo_usuario) {
      case 'master':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }
    const result = await login(email, senha);
    if (result.success) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando..."
      });

      // Redirecionar baseado no tipo de usuário após login bem-sucedido
      const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado') || '{}');
      switch (usuarioLogado.tipo_usuario) {
        case 'master':
          navigate('/admin');
          break;
        default:
          navigate('/dashboard');
          break;
      }
    } else {
      setError(result.error || 'Erro ao fazer login');
      toast({
        title: "Erro no login",
        description: result.error || 'Verifique suas credenciais',
        variant: "destructive"
      });
    }
    setLoading(false);
  };
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Tezeus Agenda
          </CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" placeholder="Digite sua senha" value={senha} onChange={e => setSenha(e.target.value)} required />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          
        </CardContent>
      </Card>
    </div>;
}