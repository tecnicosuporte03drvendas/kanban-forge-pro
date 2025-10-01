import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStealth } from '@/hooks/use-stealth';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';

export const StealthBackButton = () => {
  const { isStealthMode } = useStealth();
  const navigate = useNavigate();
  const { empresaId } = useParams();
  const location = useLocation();

  // Verificação direta dos query params como fallback
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isStealthFromUrl = urlParams.get('stealth') === 'true';
  const masterIdFromUrl = urlParams.get('master_id');

  // Verifica se está na rota de empresa
  const isInCompanyRoute = location.pathname.startsWith('/empresa/');

  // Debug logs (remover após correção)
  useEffect(() => {
    console.log('StealthBackButton Debug:', {
      isStealthMode,
      isStealthFromUrl,
      masterIdFromUrl,
      empresaId,
      isInCompanyRoute,
      pathname: location.pathname,
      search: location.search
    });
  }, [isStealthMode, isStealthFromUrl, masterIdFromUrl, empresaId, isInCompanyRoute, location]);

  // Mostra o botão se:
  // 1. Está em modo stealth (pelo contexto OU pelos parâmetros da URL)
  // 2. Está na rota de empresa
  // 3. Tem o empresaId
  const shouldShowButton = (isStealthMode || isStealthFromUrl) && isInCompanyRoute && empresaId;

  if (!shouldShowButton) {
    console.log('StealthBackButton não será exibido:', { isStealthMode, isStealthFromUrl, isInCompanyRoute, empresaId });
    return null;
  }

  const handleBack = () => {
    console.log('Navegando de volta para:', `/admin/empresa/${empresaId}`);
    navigate(`/admin/empresa/${empresaId}`);
  };

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <Button 
        onClick={handleBack}
        variant="default"
        size="sm"
        className="shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar à Empresa
      </Button>
    </div>
  );
};
