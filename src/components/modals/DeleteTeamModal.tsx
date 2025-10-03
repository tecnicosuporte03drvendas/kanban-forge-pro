import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DeleteTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamDeleted: () => void;
  team: {
    id: string;
    nome: string;
    descricao: string | null;
    membros?: any[];
  } | null;
}

export const DeleteTeamModal: React.FC<DeleteTeamModalProps> = ({
  open,
  onOpenChange,
  onTeamDeleted,
  team
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!team) return;

    setError('');
    setLoading(true);

    try {
      // Primeiro, remover todos os membros da equipe
      const { error: membrosError } = await supabase
        .from('usuarios_equipes')
        .delete()
        .eq('equipe_id', team.id);

      if (membrosError) {
        console.error('Erro ao remover membros:', membrosError);
        setError('Erro ao remover membros da equipe. Tente novamente.');
        setLoading(false);
        return;
      }

      // Remover referências de tarefas_responsaveis
      const { error: responsaveisError } = await supabase
        .from('tarefas_responsaveis')
        .delete()
        .eq('equipe_id', team.id);

      if (responsaveisError) {
        console.error('Erro ao remover referências de tarefas:', responsaveisError);
        setError('Erro ao remover referências de tarefas. Tente novamente.');
        setLoading(false);
        return;
      }

      // Remover referências de reunioes_participantes
      const { error: participantesError } = await supabase
        .from('reunioes_participantes')
        .delete()
        .eq('equipe_id', team.id);

      if (participantesError) {
        console.error('Erro ao remover referências de reuniões:', participantesError);
        setError('Erro ao remover referências de reuniões. Tente novamente.');
        setLoading(false);
        return;
      }

      // Agora excluir a equipe
      const { error: deleteError } = await supabase
        .from('equipes')
        .delete()
        .eq('id', team.id);

      if (deleteError) {
        console.error('Erro ao excluir equipe:', deleteError);
        setError('Erro ao excluir equipe. Tente novamente.');
        setLoading(false);
        return;
      }

      toast({
        title: "Equipe excluída",
        description: `${team.nome} foi excluída com sucesso.`,
      });

      onTeamDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao excluir equipe:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Excluir Equipe
          </DialogTitle>
          <DialogDescription>
            Esta ação irá excluir permanentemente a equipe do sistema.
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
              <Users className="w-4 h-4" />
              <span className="font-medium">{team.nome}</span>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              {team.descricao && (
                <div>Descrição: {team.descricao}</div>
              )}
              <div>Membros: {team.membros?.length || 0}</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium">Consequências da exclusão:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Todos os membros serão removidos da equipe</li>
              <li>Referências em tarefas serão removidas</li>
              <li>Referências em reuniões serão removidas</li>
              <li>Esta ação não pode ser revertida</li>
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
