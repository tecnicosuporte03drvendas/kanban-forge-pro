import { Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useStealth } from '@/hooks/use-stealth';

export const StealthIndicator = () => {
  const { isStealthMode } = useStealth();

  if (!isStealthMode) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge 
        variant="secondary" 
        className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 shadow-lg"
      >
        <EyeOff className="w-3 h-3 mr-1" />
        Modo Invisível
      </Badge>
    </div>
  );
};