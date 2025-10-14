import { Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RecurringTaskBadgeProps {
  frequencia?: string;
  intervalo?: number;
  showLabel?: boolean;
}

export const RecurringTaskBadge = ({ frequencia, intervalo, showLabel = true }: RecurringTaskBadgeProps) => {
  if (!frequencia) return null;

  const getFrequencyText = () => {
    const intervalText = intervalo && intervalo > 1 ? `A cada ${intervalo}` : '';
    
    switch (frequencia) {
      case 'diaria':
        return intervalText ? `${intervalText} dias` : 'Diária';
      case 'semanal':
        return intervalText ? `${intervalText} semanas` : 'Semanal';
      case 'mensal':
        return intervalText ? `${intervalText} meses` : 'Mensal';
      case 'anual':
        return intervalText ? `${intervalText} anos` : 'Anual';
      default:
        return 'Recorrente';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Repeat className="w-3 h-3" />
            {showLabel && getFrequencyText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tarefa Recorrente - {getFrequencyText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
