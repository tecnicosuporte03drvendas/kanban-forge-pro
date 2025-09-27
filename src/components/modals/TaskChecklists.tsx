import { useState } from 'react'
import { Plus, CheckSquare, Trash2, Check, X, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useEffectiveUser } from '@/hooks/use-effective-user'
import type { TarefaChecklist, TarefaChecklistItem } from '@/types/task'

interface TaskChecklistsProps {
  taskId: string
  checklists: TarefaChecklist[]
  onChecklistsChange: () => void
}

export function TaskChecklists({ taskId, checklists, onChecklistsChange }: TaskChecklistsProps) {
  const { usuario } = useEffectiveUser()
  const [creatingChecklist, setCreatingChecklist] = useState(false)
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [addingItems, setAddingItems] = useState<Record<string, boolean>>({})
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({})
  const [editingItems, setEditingItems] = useState<Record<string, boolean>>({})
  const [editingItemTexts, setEditingItemTexts] = useState<Record<string, string>>({})

  const createChecklist = async () => {
    if (!newChecklistTitle.trim() || !usuario) return

    try {
      const { data, error } = await supabase
        .from('tarefas_checklists')
        .insert({
          tarefa_id: taskId,
          titulo: newChecklistTitle.trim(),
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from('tarefas_atividades').insert({
        tarefa_id: taskId,
        usuario_id: usuario.id,
        acao: 'criou_checklist',
        descricao: `Criou o checklist "${newChecklistTitle.trim()}"`,
      })

      setNewChecklistTitle('')
      setCreatingChecklist(false)
      onChecklistsChange()
      toast({ title: 'Sucesso', description: 'Checklist criado' })
    } catch (error) {
      console.error('Error creating checklist:', error)
      toast({ title: 'Erro', description: 'Erro ao criar checklist', variant: 'destructive' })
    }
  }

  const deleteChecklist = async (checklistId: string, titulo: string) => {
    if (!usuario) return

    try {
      await supabase.from('tarefas_checklists').delete().eq('id', checklistId)

      await supabase.from('tarefas_atividades').insert({
        tarefa_id: taskId,
        usuario_id: usuario.id,
        acao: 'removeu_checklist',
        descricao: `Removeu o checklist "${titulo}"`,
      })

      onChecklistsChange()
      toast({ title: 'Sucesso', description: 'Checklist removido' })
    } catch (error) {
      console.error('Error deleting checklist:', error)
      toast({ title: 'Erro', description: 'Erro ao remover checklist', variant: 'destructive' })
    }
  }

  const addItem = async (checklistId: string) => {
    const itemText = newItemTexts[checklistId]?.trim()
    if (!itemText || !usuario) return

    try {
      await supabase.from('tarefas_checklist_itens').insert({
        checklist_id: checklistId,
        item: itemText,
      })

      await supabase.from('tarefas_atividades').insert({
        tarefa_id: taskId,
        usuario_id: usuario.id,
        acao: 'adicionou_item_checklist',
        descricao: `Adicionou o item "${itemText}" ao checklist`,
      })

      setNewItemTexts(prev => ({ ...prev, [checklistId]: '' }))
      setAddingItems(prev => ({ ...prev, [checklistId]: false }))
      onChecklistsChange()
      toast({ title: 'Sucesso', description: 'Item adicionado' })
    } catch (error) {
      console.error('Error adding item:', error)
      toast({ title: 'Erro', description: 'Erro ao adicionar item', variant: 'destructive' })
    }
  }

  const toggleItem = async (item: TarefaChecklistItem) => {
    if (!usuario) return

    try {
      await supabase
        .from('tarefas_checklist_itens')
        .update({ concluido: !item.concluido })
        .eq('id', item.id)

      await supabase.from('tarefas_atividades').insert({
        tarefa_id: taskId,
        usuario_id: usuario.id,
        acao: item.concluido ? 'desmarcou_item_checklist' : 'marcou_item_checklist',
        descricao: `${item.concluido ? 'Desmarcou' : 'Marcou'} o item "${item.item}"`,
      })

      onChecklistsChange()
    } catch (error) {
      console.error('Error toggling item:', error)
      toast({ title: 'Erro', description: 'Erro ao atualizar item', variant: 'destructive' })
    }
  }

  const updateItem = async (itemId: string, newText: string, oldText: string) => {
    if (!usuario || !newText.trim()) return

    try {
      await supabase
        .from('tarefas_checklist_itens')
        .update({ item: newText.trim() })
        .eq('id', itemId)

      await supabase.from('tarefas_atividades').insert({
        tarefa_id: taskId,
        usuario_id: usuario.id,
        acao: 'editou_item_checklist',
        descricao: `Alterou item de "${oldText}" para "${newText.trim()}"`,
      })

      setEditingItems(prev => ({ ...prev, [itemId]: false }))
      setEditingItemTexts(prev => ({ ...prev, [itemId]: '' }))
      onChecklistsChange()
      toast({ title: 'Sucesso', description: 'Item atualizado' })
    } catch (error) {
      console.error('Error updating item:', error)
      toast({ title: 'Erro', description: 'Erro ao atualizar item', variant: 'destructive' })
    }
  }

  const deleteItem = async (itemId: string, itemText: string) => {
    if (!usuario) return

    try {
      await supabase.from('tarefas_checklist_itens').delete().eq('id', itemId)

      await supabase.from('tarefas_atividades').insert({
        tarefa_id: taskId,
        usuario_id: usuario.id,
        acao: 'removeu_item_checklist',
        descricao: `Removeu o item "${itemText}"`,
      })

      onChecklistsChange()
      toast({ title: 'Sucesso', description: 'Item removido' })
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({ title: 'Erro', description: 'Erro ao remover item', variant: 'destructive' })
    }
  }

  const getChecklistProgress = (checklist: TarefaChecklist) => {
    const completed = checklist.itens.filter(item => item.concluido).length
    const total = checklist.itens.length
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Checklists</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCreatingChecklist(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Checklist
        </Button>
      </div>

      {creatingChecklist && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nome do checklist"
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  createChecklist()
                } else if (e.key === 'Escape') {
                  setCreatingChecklist(false)
                  setNewChecklistTitle('')
                }
              }}
              autoFocus
            />
            <Button size="sm" onClick={createChecklist} disabled={!newChecklistTitle.trim()}>
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreatingChecklist(false)
                setNewChecklistTitle('')
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {checklists.map((checklist) => {
        const progress = getChecklistProgress(checklist)
        
        return (
          <div key={checklist.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{checklist.titulo}</h4>
                {progress.total > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {progress.completed}/{progress.total}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteChecklist(checklist.id, checklist.titulo)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {progress.total > 0 && (
              <div className="mb-3">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              {checklist.itens.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={item.concluido}
                    onCheckedChange={() => toggleItem(item)}
                    className="mt-0.5"
                  />
                  
                  {editingItems[item.id] ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingItemTexts[item.id] || item.item}
                        onChange={(e) => setEditingItemTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateItem(item.id, editingItemTexts[item.id] || item.item, item.item)
                          } else if (e.key === 'Escape') {
                            setEditingItems(prev => ({ ...prev, [item.id]: false }))
                            setEditingItemTexts(prev => ({ ...prev, [item.id]: '' }))
                          }
                        }}
                        className="text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateItem(item.id, editingItemTexts[item.id] || item.item, item.item)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingItems(prev => ({ ...prev, [item.id]: false }))
                          setEditingItemTexts(prev => ({ ...prev, [item.id]: '' }))
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span 
                        className={`flex-1 text-sm cursor-pointer ${
                          item.concluido ? 'line-through text-muted-foreground' : ''
                        }`}
                        onClick={() => {
                          setEditingItems(prev => ({ ...prev, [item.id]: true }))
                          setEditingItemTexts(prev => ({ ...prev, [item.id]: item.item }))
                        }}
                      >
                        {item.item}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingItems(prev => ({ ...prev, [item.id]: true }))
                            setEditingItemTexts(prev => ({ ...prev, [item.id]: item.item }))
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteItem(item.id, item.item)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {addingItems[checklist.id] ? (
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox disabled className="mt-0.5" />
                  <Input
                    placeholder="Novo item"
                    value={newItemTexts[checklist.id] || ''}
                    onChange={(e) => setNewItemTexts(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addItem(checklist.id)
                      } else if (e.key === 'Escape') {
                        setAddingItems(prev => ({ ...prev, [checklist.id]: false }))
                        setNewItemTexts(prev => ({ ...prev, [checklist.id]: '' }))
                      }
                    }}
                    className="text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => addItem(checklist.id)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAddingItems(prev => ({ ...prev, [checklist.id]: false }))
                      setNewItemTexts(prev => ({ ...prev, [checklist.id]: '' }))
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddingItems(prev => ({ ...prev, [checklist.id]: true }))}
                  className="justify-start text-muted-foreground hover:text-foreground mt-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar item
                </Button>
              )}
            </div>
          </div>
        )
      })}

      {checklists.length === 0 && !creatingChecklist && (
        <div className="text-center py-6 text-muted-foreground">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum checklist criado</p>
          <p className="text-xs">Clique em "Novo Checklist" para começar</p>
        </div>
      )}
    </div>
  )
}