import { Clock, Play, Pause, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskTimeTrackerProps {
  tempoGastoMinutos?: number;
  tempoInicio?: string;
  tempoFim?: string;
  status: string;
  sessoes?: Array<{
    id: string;
    inicio: string;
    fim?: string;
    minutos_trabalhados?: number;
  }>;
}

export function TaskTimeTracker({ 
  tempoGastoMinutos, 
  tempoInicio, 
  tempoFim, 
  status,
  sessoes = [] 
}: TaskTimeTrackerProps) {
  const formatTime = (minutes?: number) => {
    if (!minutes) return "0min";
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
  };

  const isRunning = status === 'executando';
  const hasActiveSession = sessoes.some(s => !s.fim);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-4 w-4" />
          Tempo de Trabalho
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Atual */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={isRunning ? "default" : "secondary"} className="flex items-center gap-1">
            {isRunning ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {isRunning ? "Em execução" : "Parado"}
          </Badge>
        </div>

        {/* Tempo Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tempo total:</span>
          <span className="font-medium">{formatTime(tempoGastoMinutos)}</span>
        </div>

        {/* Datas */}
        {tempoInicio && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Iniciado:</span>
            <span className="text-sm">
              {formatDistanceToNow(new Date(tempoInicio), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        )}

        {tempoFim && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Concluído:</span>
            <span className="text-sm">
              {formatDistanceToNow(new Date(tempoFim), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        )}

        {/* Sessões */}
        {sessoes.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Sessões de trabalho:</span>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {sessoes.map((sessao) => (
                <div 
                  key={sessao.id} 
                  className="flex items-center justify-between p-2 rounded border text-xs"
                >
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(sessao.inicio).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(sessao.inicio).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <Badge variant={sessao.fim ? "secondary" : "default"} className="text-xs">
                    {sessao.fim 
                      ? formatTime(sessao.minutos_trabalhados) 
                      : "Ativa"
                    }
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}