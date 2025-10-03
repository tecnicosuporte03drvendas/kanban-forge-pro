import { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DeleteCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyDeleted: () => void;
  company: {
    id: string;
    nome_fantasia: string;
  };
}

export function DeleteCompanyModal({ open, onOpenChange, onCompanyDeleted, company }: DeleteCompanyModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { usuario } = useAuth();

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Enviar notificação ANTES de deletar (para pegar dados do proprietário)
      console.log('🔔 Enviando notificação de exclusão de empresa:', company.id);
      try {
        const result = await supabase.functions.invoke('notify-company-deleted', {
          body: {
            empresaId: company.id,
            deletedBy: usuario?.tipo_usuario || 'unknown'
          }
        });
        console.log('✅ Resultado da notificação:', result);
      } catch (notificationError) {
        console.error('❌ Erro ao enviar notificação, mas continuando com exclusão:', notificationError);
      }
      // Buscar IDs das tarefas
      const { data: tarefas } = await supabase
        .from('tarefas')
        .select('id')
        .eq('empresa_id', company.id);
      
      const tarefaIds = tarefas?.map(t => t.id) || [];

      if (tarefaIds.length > 0) {
        // Buscar IDs dos checklists
        const { data: checklists } = await supabase
          .from('tarefas_checklists')
          .select('id')
          .in('tarefa_id', tarefaIds);
        
        const checklistIds = checklists?.map(c => c.id) || [];

        if (checklistIds.length > 0) {
          // 1. Deletar itens de checklist
          await supabase
            .from('tarefas_checklist_itens')
            .delete()
            .in('checklist_id', checklistIds);
        }

        // 2. Deletar checklists
        await supabase
          .from('tarefas_checklists')
          .delete()
          .in('tarefa_id', tarefaIds);

        // 3. Deletar comentários
        await supabase
          .from('tarefas_comentarios')
          .delete()
          .in('tarefa_id', tarefaIds);

        // 4. Deletar atividades
        await supabase
          .from('tarefas_atividades')
          .delete()
          .in('tarefa_id', tarefaIds);

        // 5. Deletar anexos
        await supabase
          .from('tarefas_anexos')
          .delete()
          .in('tarefa_id', tarefaIds);

        // 6. Deletar sessões de tempo
        await supabase
          .from('tarefas_tempo_sessoes')
          .delete()
          .in('tarefa_id', tarefaIds);

        // 7. Deletar responsáveis
        await supabase
          .from('tarefas_responsaveis')
          .delete()
          .in('tarefa_id', tarefaIds);
      }

      // 8. Deletar tarefas
      await supabase
        .from('tarefas')
        .delete()
        .eq('empresa_id', company.id);

      // Buscar IDs das reuniões
      const { data: reunioes } = await supabase
        .from('reunioes')
        .select('id')
        .eq('empresa_id', company.id);
      
      const reuniaoIds = reunioes?.map(r => r.id) || [];

      if (reuniaoIds.length > 0) {
        // 9. Deletar participantes de reuniões
        await supabase
          .from('reunioes_participantes')
          .delete()
          .in('reuniao_id', reuniaoIds);
      }

      // 10. Deletar reuniões
      await supabase
        .from('reunioes')
        .delete()
        .eq('empresa_id', company.id);

      // 11. Deletar tickets de suporte
      await supabase
        .from('tickets_suporte')
        .delete()
        .eq('empresa_id', company.id);

      // Buscar IDs das equipes
      const { data: equipes } = await supabase
        .from('equipes')
        .select('id')
        .eq('empresa_id', company.id);
      
      const equipeIds = equipes?.map(e => e.id) || [];

      if (equipeIds.length > 0) {
        // 12. Deletar usuários equipes
        await supabase
          .from('usuarios_equipes')
          .delete()
          .in('equipe_id', equipeIds);
      }

      // 13. Deletar equipes
      await supabase
        .from('equipes')
        .delete()
        .eq('empresa_id', company.id);

      // 14. Deletar usuários
      await supabase
        .from('usuarios')
        .delete()
        .eq('empresa_id', company.id);

      // 15. Deletar empresa
      const { error: deleteError } = await supabase
        .from('empresas')
        .delete()
        .eq('id', company.id);

      if (deleteError) {
        throw deleteError;
      }

      toast({
        title: "Empresa excluída",
        description: `A empresa ${company.nome_fantasia} e todos os seus dados foram excluídos com sucesso.`,
      });

      onOpenChange(false);
      onCompanyDeleted();
    } catch (error: any) {
      console.error('Erro ao excluir empresa:', error);
      toast({
        title: "Erro ao excluir empresa",
        description: error.message || "Não foi possível excluir a empresa. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Excluir Empresa Permanentemente</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p className="font-semibold">
              Tem certeza que deseja excluir permanentemente a empresa "{company.nome_fantasia}"?
            </p>
            <p className="text-destructive font-medium">
              Esta ação é IRREVERSÍVEL e irá excluir:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Todos os usuários da empresa</li>
              <li>Todas as tarefas e seus anexos</li>
              <li>Todas as reuniões</li>
              <li>Todas as equipes</li>
              <li>Todos os tickets de suporte</li>
              <li>Todos os dados relacionados</li>
            </ul>
            <p className="font-semibold mt-4">
              Esta operação não pode ser desfeita!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
