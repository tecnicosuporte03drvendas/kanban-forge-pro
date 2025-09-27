import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Loader2 } from "lucide-react";

interface CreateSupportTicketModalProps {
  trigger?: React.ReactNode;
}

const categorias = [
  "Geral",
  "Problema Técnico",
  "Integração",
  "Relatórios",
  "Tarefas",
  "Kanban", 
  "Timer",
  "Workspace",
  "Conta e Perfil",
  "Sugestão"
];

const prioridades = [
  { value: "Baixa", label: "Baixa" },
  { value: "Media", label: "Média" },
  { value: "Alta", label: "Alta" },
  { value: "Urgente", label: "Urgente" }
];

export const CreateSupportTicketModal = ({ trigger }: CreateSupportTicketModalProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    categoria: "Geral",
    prioridade: "Media"
  });

  const { toast } = useToast();
  const { usuario } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario?.empresa_id) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar sua empresa",
        variant: "destructive",
      });
      return;
    }

    if (!formData.titulo.trim() || !formData.descricao.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("tickets_suporte")
        .insert({
          usuario_id: usuario.id,
          empresa_id: usuario.empresa_id,
          titulo: formData.titulo.trim(),
          descricao: formData.descricao.trim(),
          categoria: formData.categoria,
          prioridade: formData.prioridade,
          status: "Aberto"
        });

      if (error) throw error;

      toast({
        title: "Ticket criado com sucesso!",
        description: "Nossa equipe entrará em contato em até 24 horas.",
      });

      // Reset form
      setFormData({
        titulo: "",
        descricao: "",
        categoria: "Geral",
        prioridade: "Media"
      });

      setOpen(false);
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
      toast({
        title: "Erro ao criar ticket",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const defaultTrigger = (
    <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
      <MessageSquare className="w-4 h-4 mr-2" />
      Criar Ticket de Suporte
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Criar Ticket de Suporte</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-card-foreground">
              Título *
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleInputChange("titulo", e.target.value)}
              placeholder="Descreva brevemente o problema ou dúvida"
              required
              className="bg-background border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-card-foreground">
                Categoria
              </Label>
              <Select value={formData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade" className="text-card-foreground">
                Prioridade
              </Label>
              <Select value={formData.prioridade} onValueChange={(value) => handleInputChange("prioridade", value)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {prioridades.map((prioridade) => (
                    <SelectItem key={prioridade.value} value={prioridade.value}>
                      {prioridade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-card-foreground">
              Descrição *
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange("descricao", e.target.value)}
              placeholder="Descreva detalhadamente o problema, incluindo passos para reproduzi-lo, mensagens de erro (se houver) e qualquer informação adicional que possa ajudar nossa equipe."
              required
              rows={5}
              className="bg-background border-border resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Ticket"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};