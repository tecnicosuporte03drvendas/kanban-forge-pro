import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DeactivateCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyDeactivated: () => void;
  company: {
    id: string;
    nome_fantasia: string;
    razao_social: string;
  } | null;
}

export const DeactivateCompanyModal: React.FC<DeactivateCompanyModalProps> = ({
  open,
  onOpenChange,
  onCompanyDeactivated,
  company
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeactivate = async () => {
    if (!company) return;

    setError('');
    setLoading(true);

    try {
      // Desativar empresa
      const { error: updateError } = await supabase
        .from('empresas')
        .update({ ativa: false })
        .eq('id', company.id);

      if (updateError) {
        console.error('Erro ao desativar empresa:', updateError);
        setError('Erro ao desativar empresa. Tente novamente.');
        setLoading(false);
        return;
      }

      // Notificar webhook N8N
      try {
        await supabase.functions.invoke('notify-company-deactivated', {
          body: {
            empresaId: company.id,
            deactivatedBy: 'master'
          }
        });
      } catch (webhookError) {
        console.error('Erro ao notificar webhook:', webhookError);
        // Não bloquear a operação se webhook falhar
      }

      toast({
        title: "Empresa desativada",
        description: `${company.nome_fantasia} foi desativada com sucesso.`,
      });

      onCompanyDeactivated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao desativar empresa:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Desativar Empresa
          </DialogTitle>
          <DialogDescription>
            Esta ação irá desativar permanentemente a empresa <strong>{company.nome_fantasia}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção!</strong> Esta ação terá as seguintes consequências:
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">Empresa: {company.nome_fantasia}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Razão Social: {company.razao_social}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium">Consequências da desativação:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Todos os usuários da empresa perderão acesso ao sistema</li>
              <li>Os dados da empresa serão mantidos mas inacessíveis</li>
              <li>Apenas usuários master poderão reativar a empresa</li>
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
              onClick={handleDeactivate}
              disabled={loading}
            >
              {loading ? 'Desativando...' : 'Confirmar Desativação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};