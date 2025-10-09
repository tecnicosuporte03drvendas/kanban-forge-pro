import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface TaskDatePickerProps {
  date: Date
  time: string
  onDateChange: (date: Date) => void
  onTimeChange: (time: string) => void
  disabled?: boolean
}

export function TaskDatePicker({ date, time, onDateChange, onTimeChange, disabled = false }: TaskDatePickerProps) {
  const [open, setOpen] = useState(false)

  const timeOptions = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeOptions.push(timeString)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <Clock className="mr-2 h-4 w-4" />
          {date ? (
            <>
              {format(date, 'dd/MM/yyyy', { locale: ptBR })} às {time}
            </>
          ) : (
            <span>Selecionar data e horário</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <div className="space-y-2">
            <Label>Data de conclusão</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  onDateChange(selectedDate)
                }
              }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className="rounded-md border pointer-events-auto"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Horário de conclusão</Label>
            <Select value={time} onValueChange={onTimeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar horário">
                  {time || "Selecionar horário"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="h-60">
                {timeOptions.map((timeOption) => (
                  <SelectItem key={timeOption} value={timeOption}>
                    {timeOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={() => setOpen(false)} 
            className="w-full"
            size="sm"
          >
            Confirmar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}