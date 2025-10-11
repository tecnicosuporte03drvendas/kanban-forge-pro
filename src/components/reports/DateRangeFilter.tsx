import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"

export type DateFilterType = 'dia' | 'semana' | 'mes' | 'customizado'

interface DateRangeFilterProps {
  onFilterChange: (type: DateFilterType, dateRange?: DateRange) => void
  selectedType: DateFilterType
  dateRange?: DateRange
}

export function DateRangeFilter({ onFilterChange, selectedType, dateRange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)

  const filterButtons: { type: DateFilterType; label: string }[] = [
    { type: 'dia', label: 'Hoje' },
    { type: 'semana', label: 'Semana' },
    { type: 'mes', label: 'Mês' },
    { type: 'customizado', label: 'Período' }
  ]

  return (
    <div className="flex gap-2 items-center">
      {filterButtons.map((btn) => (
        <Button
          key={btn.type}
          variant={selectedType === btn.type ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (btn.type === 'customizado') {
              setOpen(true)
            } else {
              onFilterChange(btn.type)
            }
          }}
        >
          {btn.label}
        </Button>
      ))}
      
      {selectedType === 'customizado' && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yy", { locale: ptBR })
                )
              ) : (
                <span>Selecionar período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onFilterChange('customizado', range)
                  setOpen(false)
                }
              }}
              numberOfMonths={2}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
