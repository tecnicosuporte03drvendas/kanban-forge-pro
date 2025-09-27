import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, HelpCircle, MessageSquare, Clock, ExternalLink } from "lucide-react"

const quickGuides = [
  {
    id: "1",
    title: "Configuração Inicial",
    description: "Configure sua conta e comece a usar o sistema",
    duration: "3 min",
    category: "Iniciante"
  },
  {
    id: "2", 
    title: "Criando sua Primeira Tarefa",
    description: "Aprenda a criar e configurar tarefas",
    duration: "4 min",
    category: "Básico"
  },
  {
    id: "3",
    title: "Usando o Kanban Board",
    description: "Organize tarefas com drag & drop",
    duration: "7 min",
    category: "Kanban"
  },
  {
    id: "4",
    title: "Cronometrando Tempo",
    description: "Use o timer integrado para cada tarefa",
    duration: "1 min",
    category: "Timer"
  },
  {
    id: "5",
    title: "Gerenciando Equipe",
    description: "Convide e organize membros",
    duration: "6 min",
    category: "Workspace"
  },
  {
    id: "6",
    title: "Visualizando Relatórios",
    description: "Analise métricas e produtividade",
    duration: "5 min",
    category: "Relatórios"
  },
  {
    id: "7",
    title: "Configurando Integrações",
    description: "Conecte Google e WhatsApp",
    duration: "10 min",
    category: "Integrações"
  }
]

const faqs = [
  {
    id: "1",
    question: "Como criar uma nova tarefa?",
    answer: "Acesse o menu 'Nova Tarefa' no sidebar ou clique no botão '+' no dashboard, Kanban: Preencha título, descrição, prioridade e data de vencimento.",
    category: "Tarefas"
  },
  {
    id: "2",
    question: "Como mover tarefas entre colunas do Kanban?",
    answer: "Arraste e solte as tarefas entre as colunas: A Fazer, Em Progresso, Concluída ou solte na coluna. A tarefa se moverá automaticamente para a coluna correspondente.",
    category: "Kanban"
  },
  {
    id: "3",
    question: "Como usar o Timer nas tarefas?",
    answer: "Clique no ícone de Timer na tarefa, depois use os botões Play para iniciar, Pause para pausar e Stop para finalizar o cronometragem.",
    category: "Timer"
  },
  {
    id: "4",
    question: "Como convidar membros para o workspace?",
    answer: "Acesse 'Gestão de Pessoas' → 'Adicionar Membro', digite o nome da pessoa e selecione o nível de acesso (Admin, Gestor ou Colaborador).",
    category: "Workspace"
  },
  {
    id: "5",
    question: "Como visualizar relatórios de produtividade?",
    answer: "Acesse a seção 'Relatórios' no menu para ver gráficos de tarefas cumpridas, tempo trabalhado e métricas da equipe por período.",
    category: "Relatórios"
  },
  {
    id: "6",
    question: "Como arquivar tarefas concluídas?",
    answer: "Tarefas concluídas são automaticamente arquivadas após 30 dias. Você pode arquivar manualmente ou acessar 'Tarefas Arquivadas' para visualizá-las.",
    category: "Tarefas"
  }
]


const Ajuda = () => {
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Iniciante": "bg-kanban-completed text-white",
      "Básico": "bg-primary text-white",
      "Kanban": "bg-kanban-executing text-white",
      "Timer": "bg-priority-medium text-white",
      "Workspace": "bg-kanban-assigned text-white",
      "Relatórios": "bg-kanban-validated text-white",
      "Integrações": "bg-priority-high text-white",
      "Tarefas": "bg-muted text-muted-foreground"
    }
    return colors[category] || "bg-muted text-muted-foreground"
  }


  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Central de Ajuda</h1>
              <p className="text-muted-foreground">Encontre respostas, guias e entre em contato conosco</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Como podemos ajudar?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Busque por guias, tutoriais ou dúvidas..." className="pl-10" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="guias" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-card">
              <TabsTrigger value="guias" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Guias
              </TabsTrigger>
              <TabsTrigger value="documentacao">Documentação</TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="tickets" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Tickets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guias" className="space-y-6">
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold text-foreground">Guias Rápidos</h3>
                <p className="text-muted-foreground">Tutoriais passo a passo para começar</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {quickGuides.map((guide) => (
                    <Card key={guide.id} className="border-border bg-card hover:shadow-md transition-all duration-200 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-card-foreground text-sm">{guide.title}</h4>
                            <Badge className={getCategoryColor(guide.category)}>
                              {guide.category}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {guide.description}
                          </p>
                          
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{guide.duration}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Ver Guia
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentacao">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Documentação Completa</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Acesse nossa documentação técnica completa para desenvolvedores e usuários avançados.
                  </p>
                  <Button className="mt-4 bg-primary hover:bg-primary-hover text-primary-foreground">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Acessar Documentação
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Perguntas Frequentes</h3>
                <p className="text-muted-foreground">Respostas para as dúvidas mais comuns</p>
                
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <Card key={faq.id} className="border-border bg-card">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-card-foreground">{faq.question}</h4>
                            <Badge variant="secondary">{faq.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Criar Ticket de Suporte</CardTitle>
                  <p className="text-muted-foreground">Precisa de ajuda? Abra um ticket e nossa equipe entrará em contato</p>
                </CardHeader>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium text-card-foreground mb-2">Abrir Novo Ticket</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Descreva seu problema ou dúvida e nossa equipe de suporte entrará em contato em até 24 horas.
                  </p>
                  <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                    Criar Ticket de Suporte
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Ajuda