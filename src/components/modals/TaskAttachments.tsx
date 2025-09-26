import { useState, useRef } from 'react'
import { Paperclip, Upload, Link2, X, Image, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface TaskAttachment {
  id: string
  tarefa_id: string
  tipo: 'imagem' | 'link'
  url: string
  nome: string
  tamanho?: number
  usuario_id: string
  created_at: string
}

interface TaskAttachmentsProps {
  taskId: string
  attachments: TaskAttachment[]
  onAttachmentsChange: () => void
}

export function TaskAttachments({ taskId, attachments, onAttachmentsChange }: TaskAttachmentsProps) {
  const { usuario } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkName, setLinkName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    try {
      if (!usuario) throw new Error('Usuário não autenticado')

      for (const file of Array.from(files)) {
        // Validate file type (images only)
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Erro',
            description: 'Apenas imagens são permitidas',
            variant: 'destructive'
          })
          continue
        }

        // Upload to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${taskId}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(fileName)

        // Save to database
        await supabase.from('tarefas_anexos').insert({
          tarefa_id: taskId,
          tipo: 'imagem',
          url: urlData.publicUrl,
          nome: file.name,
          tamanho: file.size,
          usuario_id: usuario.id
        })
      }

      onAttachmentsChange()
      setDialogOpen(false)
      toast({
        title: 'Sucesso',
        description: 'Imagens enviadas com sucesso'
      })
    } catch (error) {
      console.error('Error uploading files:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao enviar imagens',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return

    try {
      if (!usuario) throw new Error('Usuário não autenticado')

      // Validate URL
      try {
        new URL(linkUrl)
      } catch {
        toast({
          title: 'Erro',
          description: 'URL inválida',
          variant: 'destructive'
        })
        return
      }

      await supabase.from('tarefas_anexos').insert({
        tarefa_id: taskId,
        tipo: 'link',
        url: linkUrl,
        nome: linkName || linkUrl,
        usuario_id: usuario.id
      })

      onAttachmentsChange()
      setLinkUrl('')
      setLinkName('')
      setDialogOpen(false)
      toast({
        title: 'Sucesso',
        description: 'Link adicionado com sucesso'
      })
    } catch (error) {
      console.error('Error adding link:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar link',
        variant: 'destructive'
      })
    }
  }

  const handleRemoveAttachment = async (attachment: TaskAttachment) => {
    try {
      // Remove from database
      await supabase.from('tarefas_anexos').delete().eq('id', attachment.id)

      // If it's an image, also remove from storage
      if (attachment.tipo === 'imagem') {
        const urlParts = attachment.url.split('/')
        const fileName = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1]
        await supabase.storage.from('task-attachments').remove([fileName])
      }

      onAttachmentsChange()
      toast({
        title: 'Sucesso',
        description: 'Anexo removido com sucesso'
      })
    } catch (error) {
      console.error('Error removing attachment:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao remover anexo',
        variant: 'destructive'
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Anexos</span>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Paperclip className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Anexo</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="image" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image">
                  <Image className="h-4 w-4 mr-1" />
                  Imagem
                </TabsTrigger>
                <TabsTrigger value="link">
                  <Link2 className="h-4 w-4 mr-1" />
                  Link
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="image" className="space-y-4">
                <div className="text-center">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique ou arraste imagens aqui
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, JPEG até 10MB
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    disabled={isUploading}
                  />
                  
                  {isUploading && (
                    <p className="text-sm text-muted-foreground mt-2">Enviando...</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="link" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://exemplo.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome (opcional)</Label>
                  <Input
                    id="name"
                    placeholder="Nome do link"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleAddLink} 
                  className="w-full"
                  disabled={!linkUrl.trim()}
                >
                  Adicionar Link
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded-lg">
              {attachment.tipo === 'imagem' ? (
                <>
                  <Image className="h-4 w-4 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.nome}</p>
                    {attachment.tamanho && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.tamanho)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{attachment.url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveAttachment(attachment)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}