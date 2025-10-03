import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EditTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamUpdated: () => void;
  team: {
    id: string;
    nome: string;
    descricao: string | null;
  } | null;
}

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
  open,
  onOpenChange,
  onTeamUpdated,
  team
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    if (team) {
      setNome(team.nome);
      setDescricao(team.descricao || '');
    }
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!team) return;
    
    if (!nome.trim()) {
      setError('Nome da equipe é obrigatório');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('equipes')
        .update({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id);

      if (updateError) {
        console.error('Erro ao atualizar equipe:', updateError);
        setError('Erro ao atualizar equipe. Tente novamente.');
        setLoading(false);
        return;
      }

      toast({
        title: "Equipe atualizada",
        description: `${nome} foi atualizada com sucesso.`,
      });

      onTeamUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
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
            <Edit className="w-5 h-5" />
            Editar Equipe
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da equipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Equipe *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Desenvolvimento, Marketing, Vendas"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o propósito ou responsabilidades da equipe"
              disabled={loading}
              rows={3}
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
