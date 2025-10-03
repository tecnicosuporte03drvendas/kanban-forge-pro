import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { User, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DeleteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserDeleted: () => void;
  user: {
    id: string;
    nome: string;
    email: string;
    tipo_usuario: string;
    funcao_empresa?: string | null;
    created_at: string;
  } | null;
  companyName: string;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  open,
  onOpenChange,
  onUserDeleted,
  user,
  companyName
}) => {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleDelete = async () => {
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      // Notificar webhook N8N antes da exclusão
      try {
        await supabase.functions.invoke('notify-user-deleted', {
          body: {
            userId: user.id,
            deletedBy: usuario?.id || 'system'
          }
        });
      } catch (webhookError) {
        console.error('Erro ao notificar webhook:', webhookError);
        // Não bloquear a operação se webhook falhar
      }

      // Excluir usuário
      const { error: deleteError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error('Erro ao excluir usuário:', deleteError);
        setError('Erro ao excluir usuário. Tente novamente.');
        setLoading(false);
        return;
      }

      toast({
        title: "Usuário excluído",
        description: `${user.nome} foi excluído permanentemente do sistema.`,
      });

      onUserDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Excluir Usuário
          </DialogTitle>
          <DialogDescription>
            Esta ação irá excluir permanentemente o usuário do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção!</strong> Esta ação é irreversível e não pode ser desfeita.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{user.nome}</span>
              <Badge variant={getTipoUsuarioColor(user.tipo_usuario)}>
                {user.tipo_usuario.charAt(0).toUpperCase() + user.tipo_usuario.slice(1)}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Email: {user.email}</div>
              <div>Empresa: {companyName}</div>
              {user.funcao_empresa && (
                <div>Função: {user.funcao_empresa}</div>
              )}
              <div>Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium">Consequências da exclusão:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>O usuário perderá acesso permanente ao sistema</li>
              <li>Todos os dados associados serão removidos</li>
              <li>Tarefas atribuídas ao usuário ficarão sem responsável</li>
              <li>Esta ação não pode ser revertida</li>
              <li>Uma notificação será enviada automaticamente</li>
            </ul>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir Permanentemente'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};