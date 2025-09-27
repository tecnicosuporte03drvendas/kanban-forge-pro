import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Calendar, Clock, User, Archive } from "lucide-react"
import type { Tarefa } from "@/types/task"

interface DeleteTaskConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onArchive?: () => void
  task: Tarefa | null
  isBulkOperation?: boolean
  selectedCount?: number
}

export function DeleteTaskConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  onArchive,
  task,
  isBulkOperation = false,
  selectedCount = 0
}: DeleteTaskConfirmationModalProps) {
  if (!task) return null

  const formatTime = (minutes?: number) => {
    if (!minutes || minutes === 0) return '0h 0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-priority-high text-white"
      case "media": return "bg-priority-medium text-white"
      case "baixa": return "bg-priority-low text-white"
      case "urgente": return "bg-priority-urgent text-white"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl text-foreground">
                {isBulkOperation 
                  ? `Excluir ${selectedCount} Tarefas Permanentemente`
                  : "Excluir Tarefa Permanentemente"
                }
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Esta ação não pode ser desfeita
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {isBulkOperation ? (
            // Bulk operation UI
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-foreground mb-3">
                <strong>Atenção:</strong> Você está prestes a excluir permanentemente {selectedCount} tarefa{selectedCount > 1 ? 's' : ''}. 
                Todos os dados relacionados serão perdidos, incluindo:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Comentários e atividades</li>
                <li>• Checklists e anexos</li>
                <li>• Histórico de tempo trabalhado</li>
                <li>• Responsáveis atribuídos</li>
              </ul>
            </div>
          ) : (
            // Single task operation UI
            <>
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-foreground mb-3">
                  <strong>Atenção:</strong> Você está prestes a excluir permanentemente a tarefa abaixo. 
                  Todos os dados relacionados serão perdidos, incluindo:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Comentários e atividades</li>
                  <li>• Checklists e anexos</li>
                  <li>• Histórico de tempo trabalhado</li>
                  <li>• Responsáveis atribuídos</li>
                </ul>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-foreground">{task.titulo}</h4>
                  <Badge className={getPriorityColor(task.prioridade)}>
                    {task.prioridade.charAt(0).toUpperCase() + task.prioridade.slice(1)}
                  </Badge>
                </div>
                
                {task.descricao && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {task.descricao}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Criada em {new Date(task.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Tempo gasto: {formatTime(task.tempo_gasto_minutos)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {onArchive && (
            <Button variant="outline" onClick={onArchive}>
              <Archive className="w-4 h-4 mr-2" />
              Arquivar ao Invés
            </Button>
          )}
          <Button variant="destructive" onClick={onConfirm}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Excluir Permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}