import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyCreated: () => void;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({ 
  open, 
  onOpenChange, 
  onCompanyCreated 
}) => {
  const [formData, setFormData] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { usuario } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.razao_social.trim() || !formData.nome_fantasia.trim()) {
      setError('Razão Social e Nome Fantasia são obrigatórios');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('empresas')
        .insert({
          cnpj: formData.cnpj.trim() || null,
          razao_social: formData.razao_social.trim(),
          nome_fantasia: formData.nome_fantasia.trim(),
          criado_por: usuario?.id
        });

      if (error) {
        console.error('Erro ao criar empresa:', error);
        setError('Erro ao criar empresa. Tente novamente.');
        return;
      }

      toast({
        title: "Empresa criada com sucesso!",
        description: `${formData.nome_fantasia} foi adicionada ao sistema.`,
      });

      // Limpar formulário
      setFormData({
        cnpj: '',
        razao_social: '',
        nome_fantasia: ''
      });

      onCompanyCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        cnpj: '',
        razao_social: '',
        nome_fantasia: ''
      });
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Empresa</DialogTitle>
          <DialogDescription>
            Cadastre uma nova empresa no sistema. Os campos Razão Social e Nome Fantasia são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ (opcional)</Label>
            <Input
              id="cnpj"
              type="text"
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(e) => handleInputChange('cnpj', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="razao_social">Razão Social *</Label>
            <Input
              id="razao_social"
              type="text"
              placeholder="Razão Social da empresa"
              value={formData.razao_social}
              onChange={(e) => handleInputChange('razao_social', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
            <Input
              id="nome_fantasia"
              type="text"
              placeholder="Nome Fantasia da empresa"
              value={formData.nome_fantasia}
              onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Empresa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};