import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatCelularForDisplay, formatCelularForDB, validateCelular } from '@/lib/utils';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
  empresaId: string;
  empresaNome: string;
  createdBy?: 'empresa' | 'admin';
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ 
  open, 
  onOpenChange, 
  onUserCreated,
  empresaId,
  empresaNome,
  createdBy = 'empresa'
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    celular: '',
    funcao_empresa: '',
    tipo_usuario: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { usuario } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    if (field === 'celular') {
      value = formatCelularForDisplay(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validações
    if (!formData.nome.trim() || !formData.email.trim() || !formData.senha.trim() || !formData.celular.trim() || !formData.tipo_usuario) {
      setError('Nome, email, senha, celular e tipo de usuário são obrigatórios');
      setLoading(false);
      return;
    }

    // Validar celular
    if (!validateCelular(formData.celular)) {
      setError('Celular deve ter 11 dígitos no formato (XX) XXXXX-XXXX');
      setLoading(false);
      return;
    }

    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
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

    try {
      // Verificar se email já existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', formData.email.trim())
        .single();

      if (existingUser) {
        setError('Este email já está cadastrado no sistema');
        setLoading(false);
        return;
      }

      // TODO: Implementar hash da senha com bcrypt
      // Por enquanto, usando senha simples para teste
      const { error } = await supabase
        .from('usuarios')
        .insert({
          nome: formData.nome.trim(),
          email: formData.email.trim().toLowerCase(),
          senha_hash: formData.senha, // TODO: Hash com bcrypt
          celular: formatCelularForDB(formData.celular),
          funcao_empresa: formData.funcao_empresa.trim() || null,
          tipo_usuario: formData.tipo_usuario as 'proprietario' | 'gestor' | 'colaborador',
          empresa_id: empresaId,
          ativo: true
        });

      if (error) {
        console.error('Erro ao criar usuário:', error);
        setError('Erro ao criar usuário. Tente novamente.');
        return;
      }

      toast({
        title: "Usuário criado com sucesso!",
        description: `${formData.nome} foi adicionado à ${empresaNome}.`,
      });

      // Notificar webhook n8n
      console.log('🔔 Iniciando notificação de criação de usuário');
      try {
        const notificationPayload = {
          user: {
            nome: formData.nome.trim(),
            email: formData.email.trim().toLowerCase(),
            senha: formData.senha,
            celular: formatCelularForDB(formData.celular),
            funcao_empresa: formData.funcao_empresa.trim() || '',
            tipo_usuario: formData.tipo_usuario
          },
          empresa: {
            nome: empresaNome,
            id: empresaId
          },
          created_by: usuario?.id || 'unknown'
        };
        console.log('📦 Payload da notificação:', notificationPayload);
        
        const result = await supabase.functions.invoke('notify-user-created', {
          body: notificationPayload
        });
        
        console.log('✅ Resultado da notificação:', result);
        
        if (result.error) {
          console.error('❌ Erro retornado pela função:', result.error);
        }
      } catch (webhookError) {
        console.error('❌ Erro ao notificar webhook n8n:', webhookError);
        // Não exibir erro para o usuário, apenas logar
      }

      // Limpar formulário
      setFormData({
        nome: '',
        email: '',
        senha: '',
        celular: '',
        funcao_empresa: '',
        tipo_usuario: ''
      });

      onUserCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        nome: '',
        email: '',
        senha: '',
        celular: '',
        funcao_empresa: '',
        tipo_usuario: ''
      });
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Cadastre um novo usuário para a empresa <strong>{empresaNome}</strong>. 
            Todos os campos são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
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
            <Label htmlFor="senha">Senha *</Label>
            <Input
              id="senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.senha}
              onChange={(e) => handleInputChange('senha', e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="celular">Celular *</Label>
            <Input
              id="celular"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.celular}
              onChange={(e) => handleInputChange('celular', e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Formato: (XX) XXXXX-XXXX
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

          <div className="space-y-2">
            <Label htmlFor="tipo_usuario">Tipo de Usuário *</Label>
            <Select 
              value={formData.tipo_usuario} 
              onValueChange={(value) => handleInputChange('tipo_usuario', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de usuário" />
              </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proprietario">Proprietário</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                          <SelectItem value="colaborador">Colaborador</SelectItem>
                        </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              <strong>Proprietário:</strong> Acesso total à empresa<br/>
              <strong>Gestor:</strong> Gerencia usuários e tarefas<br/>
              <strong>Colaborador:</strong> Acesso básico aos módulos
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};