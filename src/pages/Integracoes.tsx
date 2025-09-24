import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar, MessageCircle, Mail, Zap, Settings, ExternalLink } from "lucide-react"

const integrations = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sincronize suas tarefas e eventos com o Google Calendar",
    icon: Calendar,
    status: "available",
    connected: false,
    category: "Calendário"
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Receba notificações e atualizações via WhatsApp",
    icon: MessageCircle,
    status: "available", 
    connected: false,
    category: "Comunicação"
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Integre emails e crie tarefas automaticamente",
    icon: Mail,
    status: "coming-soon",
    connected: false,
    category: "Email"
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Conecte com mais de 3000 aplicativos via Zapier",
    icon: Zap,
    status: "coming-soon",
    connected: false,
    category: "Automação"
  },
  {
    id: "slack",
    name: "Slack",
    description: "Receba notificações de tarefas no Slack",
    icon: MessageCircle,
    status: "coming-soon",
    connected: false,
    category: "Comunicação"
  }
]

const Integracoes = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-kanban-completed text-white"
      case "available": return "bg-primary text-white"
      case "coming-soon": return "bg-muted text-muted-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected": return "Conectado"
      case "available": return "Disponível"
      case "coming-soon": return "Em Breve"
      default: return "Indisponível"
    }
  }

  const categories = ["Todos", "Calendário", "Comunicação", "Email", "Automação"]

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
              <p className="text-muted-foreground">Conecte o Tezeus com suas ferramentas favoritas</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 pt-12 pb-6 bg-gradient-kanban">
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Integrações Populares</CardTitle>
              <p className="text-sm text-muted-foreground">
                Conecte suas ferramentas mais usadas para aumentar sua produtividade
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button 
                    key={category}
                    variant={category === "Todos" ? "default" : "outline"}
                    size="sm"
                    className={category === "Todos" ? "bg-primary text-primary-foreground" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const IconComponent = integration.icon
              return (
                <Card key={integration.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">{integration.name}</h3>
                          <Badge className={getStatusColor(integration.status)}>
                            {getStatusText(integration.status)}
                          </Badge>
                        </div>
                      </div>
                      {integration.status === "available" && (
                        <Switch 
                          checked={integration.connected}
                          disabled={integration.status !== "available"}
                        />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{integration.category}</Badge>
                      {integration.status === "available" ? (
                        <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                          Conectar
                        </Button>
                      ) : integration.status === "coming-soon" ? (
                        <Button variant="outline" size="sm" disabled>
                          Em Breve
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Configurar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Precisa de uma integração específica?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-muted-foreground">
                    Não encontrou a integração que precisa? Entre em contato conosco e vamos analisar a possibilidade de desenvolvê-la.
                  </p>
                </div>
                <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                  Solicitar Integração
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Integracoes