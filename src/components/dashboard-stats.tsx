import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, Clock, Target, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Total de Tarefas",
    value: "4",
    description: "tarefas no workspace",
    icon: CheckSquare,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    title: "Concluídas",
    value: "1",
    description: "tarefas finalizadas",
    icon: Target,
    color: "text-kanban-completed",
    bgColor: "bg-green-500/10"
  },
  {
    title: "Em Execução",
    value: "3",
    description: "tarefas ativas",
    icon: Clock,
    color: "text-kanban-executing",
    bgColor: "bg-yellow-500/10"
  },
  {
    title: "Atrasadas",
    value: "0",
    description: "passaram do prazo",
    icon: TrendingUp,
    color: "text-destructive",
    bgColor: "bg-red-500/10"
  }
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card key={index} className="border-border bg-card hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}