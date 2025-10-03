import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ReactivateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserReactivated: () => void;
  user: {
    id: string;
    nome: string;
    email: string;
    tipo_usuario: string;
  } | null;
  companyName: string;
}

export function ReactivateUserModal({
  open,
  onOpenChange,
  onUserReactivated,
  user,
  companyName,
}: ReactivateUserModalProps) {
  const [isReactivating, setIsReactivating] = useState(false);

  if (!user) return null;

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

  const handleReactivate = async () => {
    setIsReactivating(true);

    try {
      // Notificar webhook do n8n
      try {
        await supabase.functions.invoke('notify-user-reactivated', {
          body: {
            userId: user.id,
          },
        });
      } catch (webhookError) {
        console.error('Erro ao notificar webhook:', webhookError);
        // Continuar mesmo se o webhook falhar
      }

      // Reativar usuário no banco
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ ativo: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Usuário reativado com sucesso",
        description: `${user.nome} foi reativado e poderá fazer login novamente.`,
      });

      onUserReactivated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao reativar usuário:', error);
      toast({
        title: "Erro ao reativar usuário",
        description: "Ocorreu um erro ao tentar reativar o usuário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Reativar Usuário
          </DialogTitle>
          <DialogDescription>
            Esta ação irá reativar o acesso do usuário ao sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              O usuário poderá fazer login no sistema novamente após esta ação.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nome:</span>
              <span className="text-sm">{user.nome}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tipo:</span>
              <Badge variant={getTipoUsuarioColor(user.tipo_usuario)}>
                {user.tipo_usuario.charAt(0).toUpperCase() + user.tipo_usuario.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Empresa:</span>
              <span className="text-sm">{companyName}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isReactivating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReactivate}
            disabled={isReactivating}
          >
            {isReactivating ? 'Reativando...' : 'Reativar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
