import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TaskTimeBadgeProps {
  tempoGastoMinutos?: number;
  status: string;
  className?: string;
}

export function TaskTimeBadge({ tempoGastoMinutos, status, className }: TaskTimeBadgeProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  // Mostrar apenas para status específicos
  if (status === 'criada') return null;

  // Para tarefas concluídas/validadas, mostrar tempo total se houver
  if (status === 'concluida' || status === 'validada') {
    if (!tempoGastoMinutos || tempoGastoMinutos === 0) return null;
    return (
      <Badge 
        variant="secondary" 
        className={`flex items-center gap-1 ${className}`}
      >
        <Clock className="h-3 w-3" />
        {formatTime(tempoGastoMinutos)}
      </Badge>
    );
  }

  // Para tarefas assumidas/executando, mostrar badge piscando
  if (status === 'assumida' || status === 'executando') {
    return (
      <Badge 
        variant="default" 
        className={`flex items-center gap-1 animate-pulse ${className}`}
      >
        <Clock className="h-3 w-3" />
        {tempoGastoMinutos && tempoGastoMinutos > 0 ? formatTime(tempoGastoMinutos) : ''}
      </Badge>
    );
  }

  return null;
}