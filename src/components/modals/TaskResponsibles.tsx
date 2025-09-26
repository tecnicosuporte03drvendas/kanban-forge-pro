import { useState } from 'react'
import { Plus, X, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'
import type { TarefaResponsavel } from '@/types/task'

interface ResponsibleOption {
  id: string;
  nome: string;
  type: 'user' | 'team';
}

interface TaskResponsiblesProps {
  responsibles: TarefaResponsavel[]
  options: ResponsibleOption[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export function TaskResponsibles({ responsibles, options, selectedIds, onSelectionChange }: TaskResponsiblesProps) {
  const [open, setOpen] = useState(false)

  const handleToggle = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const removeResponsible = (id: string) => {
    onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
  }

  const getResponsibleDisplay = (responsible: TarefaResponsavel) => {
    if (responsible.usuario_id) {
      return {
        icon: <User className="h-3 w-3" />,
        name: (responsible as any).usuarios?.nome || 'Usuário'
      }
    } else {
      return {
        icon: <Users className="h-3 w-3" />,
        name: (responsible as any).equipes?.nome || 'Equipe'
      }
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Responsáveis</span>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {responsibles.map((responsible) => {
          const display = getResponsibleDisplay(responsible)
          const responsibleId = responsible.usuario_id || responsible.equipe_id || ''
          
          return (
            <Badge key={responsible.id} variant="outline" className="flex items-center gap-1">
              {display.icon}
              {display.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeResponsible(responsibleId)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )
        })}
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7">
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar usuários ou equipes..." />
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              
              <CommandGroup heading="Usuários">
                {options.filter(opt => opt.type === 'user').map((option) => (
                  <CommandItem key={option.id} value={option.nome} className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedIds.includes(option.id)}
                      onCheckedChange={(checked) => handleToggle(option.id, checked as boolean)}
                    />
                    <User className="h-4 w-4" />
                    <span>{option.nome}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandGroup heading="Equipes">
                {options.filter(opt => opt.type === 'team').map((option) => (
                  <CommandItem key={option.id} value={option.nome} className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedIds.includes(option.id)}
                      onCheckedChange={(checked) => handleToggle(option.id, checked as boolean)}
                    />
                    <Users className="h-4 w-4" />
                    <span>{option.nome}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}