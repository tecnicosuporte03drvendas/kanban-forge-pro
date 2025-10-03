import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DeactivateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserDeactivated: () => void;
  user: {
    id: string;
    nome: string;
    email: string;
    tipo_usuario: string;
  } | null;
  companyName: string;
}

export function DeactivateUserModal({
  open,
  onOpenChange,
  onUserDeactivated,
  user,
  companyName,
}: DeactivateUserModalProps) {
  const [isDeactivating, setIsDeactivating] = useState(false);

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

  const handleDeactivate = async () => {
    setIsDeactivating(true);

    try {
      // Buscar dados da empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', (await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', user.id)
          .single()
        ).data?.empresa_id)
        .single();

      if (empresaError) throw empresaError;

      // Notificar webhook do n8n
      try {
        await supabase.functions.invoke('notify-user-deactivated', {
          body: {
            userId: user.id,
          },
        });
      } catch (webhookError) {
        console.error('Erro ao notificar webhook:', webhookError);
        // Continuar mesmo se o webhook falhar
      }

      // Desativar usuário no banco
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ ativo: false })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Usuário desativado com sucesso",
        description: `${user.nome} foi desativado e não poderá mais fazer login.`,
      });

      onUserDeactivated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      toast({
        title: "Erro ao desativar usuário",
        description: "Ocorreu um erro ao tentar desativar o usuário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Desativar Usuário
          </DialogTitle>
          <DialogDescription>
            Esta ação irá desativar o acesso do usuário ao sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              O usuário não poderá mais fazer login no sistema após esta ação.
              Você poderá reativá-lo posteriormente se necessário.
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
            disabled={isDeactivating}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={isDeactivating}
          >
            {isDeactivating ? 'Desativando...' : 'Desativar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
