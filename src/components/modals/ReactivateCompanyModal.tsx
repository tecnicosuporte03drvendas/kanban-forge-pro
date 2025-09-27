import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ReactivateCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyReactivated: () => void;
  company: {
    id: string;
    nome_fantasia: string;
    razao_social: string;
  } | null;
}

export const ReactivateCompanyModal: React.FC<ReactivateCompanyModalProps> = ({
  open,
  onOpenChange,
  onCompanyReactivated,
  company
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReactivate = async () => {
    if (!company) return;

    setError('');
    setLoading(true);

    try {
      // Reativar empresa
      const { error: updateError } = await supabase
        .from('empresas')
        .update({ ativa: true })
        .eq('id', company.id);

      if (updateError) {
        console.error('Erro ao reativar empresa:', updateError);
        setError('Erro ao reativar empresa. Tente novamente.');
        setLoading(false);
        return;
      }

      // Notificar webhook N8N - usando a mesma função mas com flag de reativação
      try {
        await supabase.functions.invoke('notify-company-deactivated', {
          body: {
            empresaId: company.id,
            deactivatedBy: 'master',
            action: 'reactivated'
          }
        });
      } catch (webhookError) {
        console.error('Erro ao notificar webhook:', webhookError);
        // Não bloquear a operação se webhook falhar
      }

      toast({
        title: "Empresa reativada",
        description: `${company.nome_fantasia} foi reativada com sucesso.`,
      });

      onCompanyReactivated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao reativar empresa:', error);
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
            <CheckCircle className="w-5 h-5 text-green-600" />
            Reativar Empresa
          </DialogTitle>
          <DialogDescription>
            Esta ação irá reativar a empresa <strong>{company.nome_fantasia}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Confirmação!</strong> Esta ação terá as seguintes consequências:
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
            <p className="font-medium">Consequências da reativação:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Todos os usuários ativos da empresa voltarão a ter acesso ao sistema</li>
              <li>Os dados da empresa ficarão novamente acessíveis</li>
              <li>A empresa aparecerá como ativa no painel administrativo</li>
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
              variant="default"
              onClick={handleReactivate}
              disabled={loading}
            >
              {loading ? 'Reativando...' : 'Confirmar Reativação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};