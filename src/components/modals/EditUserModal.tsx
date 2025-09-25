import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
  user: {
    id: string;
    nome: string;
    email: string;
    celular: string;
    funcao_empresa: string | null;
    tipo_usuario: 'master' | 'proprietario' | 'gestor' | 'colaborador';
  } | null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ 
  open, 
  onOpenChange, 
  onUserUpdated,
  user
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    celular: '',
    funcao_empresa: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { usuario } = useAuth();

  // Preencher formulário quando usuário for selecionado
  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome,
        email: user.email,
        celular: user.celular,
        funcao_empresa: user.funcao_empresa || ''
      });
    }
  }, [user]);

  // Verificar permissões de edição
  const canEdit = () => {
    if (!usuario || !user) return false;
    
    // Masters não podem ser editados
    if (user.tipo_usuario === 'master') return false;
    
    // Proprietários podem editar todos (exceto masters)
    if (usuario.tipo_usuario === 'proprietario') return true;
    
    // Gestores podem editar apenas colaboradores
    if (usuario.tipo_usuario === 'gestor' && user.tipo_usuario === 'colaborador') return true;
    
    return false;
  };

  const formatCelular = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formata conforme o tamanho
    if (numbers.length <= 11) {
      return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '+55 $1 $2-$3');
    }
    
    return value;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'celular') {
      value = formatCelular(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateCelular = (celular: string) => {
    const numbers = celular.replace(/\D/g, '');
    return numbers.length === 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEdit()) {
      setError('Você não tem permissão para editar este usuário');
      return;
    }

    setError('');
    setLoading(true);

    // Validações
    if (!formData.nome.trim() || !formData.email.trim() || !formData.celular.trim()) {
      setError('Nome, email e celular são obrigatórios');
      setLoading(false);
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, insira um email válido');
      setLoading(false);
      return;
    }

    // Validar celular
    if (!validateCelular(formData.celular)) {
      setError('Celular deve ter 11 dígitos no formato +55 XX XXXXX-XXXX');
      setLoading(false);
      return;
    }

    try {
      // Verificar se email já existe (exceto para o próprio usuário)
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', formData.email.trim())
        .neq('id', user!.id)
        .single();

      if (existingUser) {
        setError('Este email já está cadastrado no sistema');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: formData.nome.trim(),
          email: formData.email.trim().toLowerCase(),
          celular: formData.celular.trim(),
          funcao_empresa: formData.funcao_empresa.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user!.id);

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        setError('Erro ao atualizar usuário. Tente novamente.');
        return;
      }

      toast({
        title: "Usuário atualizado com sucesso!",
        description: `${formData.nome} foi atualizado.`,
      });

      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onOpenChange(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Edite as informações de <strong>{user.nome}</strong>.
          </DialogDescription>
        </DialogHeader>

        {!canEdit() ? (
          <Alert variant="destructive">
            <AlertDescription>
              Você não tem permissão para editar este usuário.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Nome completo do usuário"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="celular">Celular *</Label>
              <Input
                id="celular"
                type="tel"
                placeholder="+55 11 99999-9999"
                value={formData.celular}
                onChange={(e) => handleInputChange('celular', e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Formato: +55 XX XXXXX-XXXX
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcao_empresa">Função na Empresa</Label>
              <Input
                id="funcao_empresa"
                type="text"
                placeholder="Ex: Designer, Auxiliar Técnico, Desenvolvedor..."
                value={formData.funcao_empresa}
                onChange={(e) => handleInputChange('funcao_empresa', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Cargo específico dentro da empresa (opcional)
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};