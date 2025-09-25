import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamCreated: () => void;
  usuarios: Array<{
    id: string;
    nome: string;
    email: string;
    funcao_empresa: string | null;
  }>;
}

const teamSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  descricao: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  membros: z.array(z.string()).min(1, "Selecione pelo menos um membro")
});

export function CreateTeamModal({ open, onOpenChange, onTeamCreated, usuarios }: CreateTeamModalProps) {
  const { usuario } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    membros: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleMemberToggle = (userId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      membros: checked 
        ? [...prev.membros, userId]
        : prev.membros.filter(id => id !== userId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validatedData = teamSchema.parse(formData);
      setIsLoading(true);

      if (!usuario?.empresa_id) {
        throw new Error("Usuário não está associado a uma empresa");
      }

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('equipes')
        .insert({
          nome: validatedData.nome.trim(),
          descricao: validatedData.descricao?.trim() || null,
          empresa_id: usuario.empresa_id,
          criado_por: usuario.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add team members
      const membersData = validatedData.membros.map(userId => ({
        usuario_id: userId,
        equipe_id: team.id
      }));

      const { error: membersError } = await supabase
        .from('usuarios_equipes')
        .insert(membersData);

      if (membersError) throw membersError;

      toast({
        title: "Equipe criada com sucesso!",
        description: `A equipe "${validatedData.nome}" foi criada com ${validatedData.membros.length} membro(s).`
      });

      setFormData({ nome: "", descricao: "", membros: [] });
      onTeamCreated();
      onOpenChange(false);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        console.error('Erro ao criar equipe:', error);
        toast({
          variant: "destructive",
          title: "Erro ao criar equipe",
          description: "Ocorreu um erro inesperado. Tente novamente."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Equipe</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Equipe *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Digite o nome da equipe"
              className={errors.nome ? "border-destructive" : ""}
            />
            {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome}</p>}
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva o propósito desta equipe"
              rows={3}
              className={errors.descricao ? "border-destructive" : ""}
            />
            {errors.descricao && <p className="text-sm text-destructive mt-1">{errors.descricao}</p>}
          </div>

          <div>
            <Label>Membros da Equipe *</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {usuarios.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={formData.membros.includes(user.id)}
                    onCheckedChange={(checked) => handleMemberToggle(user.id, !!checked)}
                  />
                  <Label 
                    htmlFor={`user-${user.id}`} 
                    className="flex-1 text-sm cursor-pointer"
                  >
                    <div>
                      <div className="font-medium">{user.nome}</div>
                      <div className="text-muted-foreground text-xs">
                        {user.email} {user.funcao_empresa && `• ${user.funcao_empresa}`}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
            {errors.membros && <p className="text-sm text-destructive mt-1">{errors.membros}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Equipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}