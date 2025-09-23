import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, X } from "lucide-react"
import { Task } from "./kanban-board"

interface KanbanFiltersProps {
  onFiltersChange: (filters: FilterState) => void
}

export interface FilterState {
  search: string
  assignee: string
  team: string
  dateFrom: string
  dateTo: string
  showOverdueOnly: boolean
}

export function KanbanFilters({ onFiltersChange }: KanbanFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    assignee: 'all',
    team: 'all',
    dateFrom: '',
    dateTo: '',
    showOverdueOnly: false
  })

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      assignee: 'all',
      team: 'all',
      dateFrom: '',
      dateTo: '',
      showOverdueOnly: false
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'assignee' || key === 'team') {
      return value !== 'all' && value !== ''
    }
    return typeof value === 'boolean' ? value : value !== ''
  })

  return (
    <Card className="mb-6 border-border bg-card">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar tarefas por nome..." 
                className="pl-10"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={filters.assignee} onValueChange={(value) => updateFilters({ assignee: value })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Sergio Ricardo">Sergio Ricardo</SelectItem>
                <SelectItem value="Ana Silva">Ana Silva</SelectItem>
                <SelectItem value="João Santos">João Santos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.team} onValueChange={(value) => updateFilters({ team: value })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Vendas">Vendas</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Suporte">Suporte</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Data de"
              className="w-36"
              value={filters.dateFrom}
              onChange={(e) => updateFilters({ dateFrom: e.target.value })}
            />

            <Input
              type="date"
              placeholder="Data até"
              className="w-36"
              value={filters.dateTo}
              onChange={(e) => updateFilters({ dateTo: e.target.value })}
            />

            <Button
              variant={filters.showOverdueOnly ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilters({ showOverdueOnly: !filters.showOverdueOnly })}
              className={filters.showOverdueOnly ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              Atrasadas
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}