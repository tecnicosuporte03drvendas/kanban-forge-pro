import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Repeat } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FrequenciaRecorrencia } from "@/types/task";

interface RecurringConfig {
  isRecurring: boolean;
  frequencia: FrequenciaRecorrencia;
  intervalo: number;
  diasSemana: number[];
  diaMes: number;
  dataInicio: Date;
  dataFim: Date | null;
  semDataFim: boolean;
}

interface RecurringTaskConfigProps {
  config: RecurringConfig;
  onChange: (config: RecurringConfig) => void;
}

const diasSemanaOptions = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

export const RecurringTaskConfig = ({ config, onChange }: RecurringTaskConfigProps) => {
  const handleToggle = (checked: boolean) => {
    onChange({ ...config, isRecurring: checked });
  };

  const handleFrequenciaChange = (value: FrequenciaRecorrencia) => {
    onChange({ ...config, frequencia: value });
  };

  const handleIntervaloChange = (value: string) => {
    const intervalo = parseInt(value) || 1;
    onChange({ ...config, intervalo: Math.max(1, intervalo) });
  };

  const handleDiaSemanaToggle = (dia: number) => {
    const newDias = config.diasSemana.includes(dia)
      ? config.diasSemana.filter(d => d !== dia)
      : [...config.diasSemana, dia].sort();
    onChange({ ...config, diasSemana: newDias });
  };

  const handleDiaMesChange = (value: string) => {
    const dia = parseInt(value) || 1;
    onChange({ ...config, diaMes: Math.min(31, Math.max(1, dia)) });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="recurring"
          checked={config.isRecurring}
          onCheckedChange={handleToggle}
        />
        <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
          <Repeat className="w-4 h-4" />
          Tarefa Recorrente
        </Label>
      </div>

      {config.isRecurring && (
        <div className="space-y-4 pl-6 border-l-2 border-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={config.frequencia} onValueChange={handleFrequenciaChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diaria">Diária</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>A cada</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={config.intervalo}
                  onChange={(e) => handleIntervaloChange(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {config.frequencia === 'diaria' && 'dia(s)'}
                  {config.frequencia === 'semanal' && 'semana(s)'}
                  {config.frequencia === 'mensal' && 'mês(es)'}
                  {config.frequencia === 'anual' && 'ano(s)'}
                </span>
              </div>
            </div>
          </div>

          {config.frequencia === 'semanal' && (
            <div className="space-y-2">
              <Label>Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {diasSemanaOptions.map(dia => (
                  <Button
                    key={dia.value}
                    type="button"
                    variant={config.diasSemana.includes(dia.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDiaSemanaToggle(dia.value)}
                  >
                    {dia.label.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {config.frequencia === 'mensal' && (
            <div className="space-y-2">
              <Label>Dia do Mês</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={config.diaMes}
                onChange={(e) => handleDiaMesChange(e.target.value)}
                className="w-24"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(config.dataInicio, "PPP", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dataInicio}
                    onSelect={(date) => date && onChange({ ...config, dataInicio: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal")}
                    disabled={config.semDataFim}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dataFim && !config.semDataFim
                      ? format(config.dataFim, "PPP", { locale: ptBR })
                      : "Sem término"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dataFim || undefined}
                    onSelect={(date) => onChange({ ...config, dataFim: date || null })}
                    initialFocus
                    disabled={(date) => date < config.dataInicio}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="no-end-date"
                  checked={config.semDataFim}
                  onCheckedChange={(checked) =>
                    onChange({ ...config, semDataFim: checked as boolean, dataFim: null })
                  }
                />
                <Label htmlFor="no-end-date" className="text-sm cursor-pointer">
                  Sem data de término
                </Label>
              </div>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Preview das próximas ocorrências:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              {getNextOccurrences(config, 5).map((date, i) => (
                <div key={i}>• {format(date, "PPP", { locale: ptBR })}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getNextOccurrences(config: RecurringConfig, count: number): Date[] {
  const occurrences: Date[] = [];
  let currentDate = new Date(config.dataInicio);
  
  while (occurrences.length < count) {
    if (config.dataFim && currentDate > config.dataFim) break;

    let shouldAdd = false;

    switch (config.frequencia) {
      case 'diaria':
        shouldAdd = true;
        currentDate = new Date(currentDate.getTime() + config.intervalo * 24 * 60 * 60 * 1000);
        break;

      case 'semanal':
        const dayOfWeek = currentDate.getDay();
        if (config.diasSemana.includes(dayOfWeek)) {
          shouldAdd = true;
        }
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        break;

      case 'mensal':
        if (currentDate.getDate() === config.diaMes) {
          shouldAdd = true;
        }
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + config.intervalo, config.diaMes);
        break;

      case 'anual':
        shouldAdd = true;
        currentDate = new Date(currentDate.getFullYear() + config.intervalo, currentDate.getMonth(), currentDate.getDate());
        break;
    }

    if (shouldAdd && occurrences.length < count) {
      occurrences.push(new Date(currentDate));
    }

    // Evitar loop infinito
    if (config.frequencia === 'mensal' && !shouldAdd) {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + config.intervalo, 1);
    }
  }

  return occurrences;
}
