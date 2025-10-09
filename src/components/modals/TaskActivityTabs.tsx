import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Activity } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function TaskActivityTabs({
  comments = [],
  activities = [],
  newComment,
  isSubmitting,
  onCommentChange,
  onSubmitComment,
  getActivityIcon,
  getActivityColor,
}) {
  return (
    <Tabs defaultValue="comments" className="flex flex-col h-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="comments" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comentários
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Atividades
        </TabsTrigger>
      </TabsList>

      {/* 🗨️ COMENTÁRIOS */}
      <TabsContent
        value="comments"
        className="h-full flex flex-col mt-0 data-[state=active]:flex"
      >
        {/* Formulário de novo comentário */}
        <div className="flex-shrink-0 p-4 border-b border-border bg-background">
          <div className="space-y-2">
            <Textarea
              placeholder="Escrever um comentário..."
              value={newComment}
              onChange={(e) => onCommentChange(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button
              onClick={onSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
              className="w-full"
            >
              {isSubmitting ? "Enviando..." : "Comentar"}
            </Button>
          </div>
        </div>

        {/* Lista de comentários com scroll */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea key={`comments-${comments.length}`} className="h-full">
            <div className="p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum comentário ainda</p>
                  <p className="text-xs">Seja o primeiro a comentar!</p>
                </div>
              ) : (
                comments.map((comentario) => (
                  <div key={comentario.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {comentario.usuario?.nome?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">
                          {comentario.usuario?.nome || "Usuário"}
                        </span>
                        <span>
                          {format(
                            new Date(comentario.created_at),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                      <div className="text-sm bg-background border rounded-lg p-3 shadow-sm">
                        {comentario.comentario}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </TabsContent>

      {/* ⚙️ ATIVIDADES */}
      <TabsContent
        value="activity"
        className="h-full flex flex-col mt-0 data-[state=active]:flex"
      >
        <div className="flex-1 overflow-hidden">
          <ScrollArea key={`activities-${activities.length}`} className="h-full">
            <div className="p-4 space-y-4">
              {activities.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma atividade ainda</p>
                  <p className="text-xs">As atividades aparecerão aqui</p>
                </div>
              ) : (
                activities.map((atividade) => (
                  <div key={atividade.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0",
                        getActivityColor(atividade.acao)
                      )}
                    >
                      <span className="text-xs">
                        {getActivityIcon(atividade.acao)}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium">
                          {atividade.usuario?.nome || "Usuário"}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          {atividade.acao}
                        </span>
                        {atividade.descricao && (
                          <>
                            <span className="text-muted-foreground">: </span>
                            <span className="text-muted-foreground">
                              {atividade.descricao}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(
                          new Date(atividade.created_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: ptBR }
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </TabsContent>
    </Tabs>
  )
}
