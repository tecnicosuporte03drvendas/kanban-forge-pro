import { useState } from 'react'
import { Plus, X, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TarefaResponsavel } from '@/types/task'

interface ResponsibleOption {
  id: string;
  nome: string;
  type: 'user' | 'team';
}

interface TaskResponsiblesProps {
  responsibles: TarefaResponsavel[]
  options: ResponsibleOption[]
  teamMembers: Record<string, string[]>
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export function TaskResponsibles({ responsibles, options, teamMembers, selectedIds, onSelectionChange }: TaskResponsiblesProps) {
  const teams = options.filter(r => r.type === 'team')
  const users = options.filter(r => r.type === 'user')
  
  const selectedTeams = selectedIds.filter(id => teams.some(t => t.id === id))
  const selectedUsers = selectedIds.filter(id => users.some(u => u.id === id))

  const isUserDisabled = (userId: string) => {
    return selectedTeams.some(teamId => teamMembers[teamId]?.includes(userId))
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
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* Teams Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipes
          </label>
          <Select
            value=""
            onValueChange={(teamId) => {
              if (!selectedIds.includes(teamId)) {
                onSelectionChange([...selectedIds, teamId])
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Adicionar equipe" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem 
                  key={team.id} 
                  value={team.id}
                  disabled={selectedTeams.includes(team.id)}
                >
                  {team.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Selected Teams Badges */}
          <div className="flex flex-wrap gap-2">
            {responsibles
              .filter(r => r.equipe_id)
              .map((responsible) => {
                const display = getResponsibleDisplay(responsible)
                const responsibleId = responsible.equipe_id || ''
                
                return (
                  <Badge key={responsible.id} variant="secondary" className="flex items-center gap-1">
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
          </div>
        </div>

        {/* Users Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Colaboradores
          </label>
          <Select
            value=""
            onValueChange={(userId) => {
              if (!selectedIds.includes(userId)) {
                onSelectionChange([...selectedIds, userId])
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Adicionar colaborador" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => {
                const isDisabled = isUserDisabled(user.id)
                return (
                  <SelectItem 
                    key={user.id} 
                    value={user.id}
                    disabled={isDisabled || selectedUsers.includes(user.id)}
                  >
                    <div className="flex items-center gap-2">
                      {user.nome}
                      {isDisabled && <span className="text-xs text-muted-foreground">(na equipe)</span>}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          
          {/* Selected Users Badges */}
          <div className="flex flex-wrap gap-2">
            {responsibles
              .filter(r => r.usuario_id)
              .map((responsible) => {
                const display = getResponsibleDisplay(responsible)
                const responsibleId = responsible.usuario_id || ''
                
                return (
                  <Badge key={responsible.id} variant="secondary" className="flex items-center gap-1">
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
          </div>
        </div>
      </div>
    </div>
  )
}