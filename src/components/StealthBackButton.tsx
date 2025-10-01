import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStealth } from '@/hooks/use-stealth';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export const StealthBackButton = () => {
  const { isStealthMode } = useStealth();
  const navigate = useNavigate();
  const { empresaId } = useParams();
  const location = useLocation();

  // Só mostra o botão se estiver em modo stealth
  if (!isStealthMode) return null;

  // Verifica se está na rota de empresa stealth
  const isInCompanyRoute = location.pathname.startsWith('/empresa/');
  if (!isInCompanyRoute || !empresaId) return null;

  const handleBack = () => {
    // Navega de volta para a página de visualização da empresa (sem stealth)
    navigate(`/admin/empresa/${empresaId}`);
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button 
        onClick={handleBack}
        variant="secondary"
        size="sm"
        className="shadow-lg"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar à Empresa
      </Button>
    </div>
  );
};
