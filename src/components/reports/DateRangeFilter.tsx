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
  selectedType?: DateFilterType
  dateRange?: DateRange
}

export function DateRangeFilter({ onFilterChange, selectedType, dateRange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)

  const filterButtons: { type: DateFilterType; label: string }[] = [
    { type: 'dia', label: 'Hoje' },
    { type: 'semana', label: 'Semana' },
    { type: 'mes', label: 'Mês' }
  ]

  return (
    <div className="flex gap-2 items-center">
      {filterButtons.map((btn) => (
        <Button
          key={btn.type}
          variant={selectedType === btn.type ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(btn.type)}
        >
          {btn.label}
        </Button>
      ))}
    </div>
  )
}
