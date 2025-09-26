import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  CheckSquare,
  BarChart3,
  Lock,
  Trash2,
  Edit,
  Save,
  X
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export default function Perfil() {
  const { toast } = useToast()
  const { usuario, updateUsuario } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    location: ""
  })
  const [editData, setEditData] = useState(userData)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [stats, setStats] = useState([
    { label: "Tarefas Concluídas", value: "0", icon: CheckSquare, color: "text-green-600" },
    { label: "Tarefas Ativas", value: "0", icon: Calendar, color: "text-blue-600" },
    { label: "Taxa de Conclusão", value: "0%", icon: BarChart3, color: "text-purple-600" }
  ])
  const [showProfileConfirmation, setShowProfileConfirmation] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [profileChanges, setProfileChanges] = useState<string[]>([])

  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      if (!usuario) return

      try {
        setLoading(true)
        
        // Buscar dados completos do usuário
        const { data: fullUserData, error: userError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', usuario.id)
          .single()

        if (userError) throw userError

        // Atualizar dados do usuário
        const newUserData = {
          name: fullUserData.nome || "",
          email: fullUserData.email || "",
          phone: fullUserData.celular || "",
          department: fullUserData.funcao_empresa || "",
          position: fullUserData.funcao_empresa || "",
          location: ""
        }
        
        setUserData(newUserData)
        setEditData(newUserData)

        // Buscar estatísticas do usuário
        const { data: taskStats, error: statsError } = await supabase
          .from('tarefas')
          .select('status, arquivada')
          .eq('criado_por', usuario.id)

        if (!statsError && taskStats) {
          const completedTasks = taskStats.filter(t => t.status === 'concluida' || t.status === 'validada').length
          const activeTasks = taskStats.filter(t => t.status !== 'concluida' && t.status !== 'validada' && !t.arquivada).length
          const totalTasks = taskStats.filter(t => !t.arquivada).length
          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

          setStats([
            { label: "Tarefas Concluídas", value: completedTasks.toString(), icon: CheckSquare, color: "text-green-600" },
            { label: "Tarefas Ativas", value: activeTasks.toString(), icon: Calendar, color: "text-blue-600" },
            { label: "Taxa de Conclusão", value: `${completionRate}%`, icon: BarChart3, color: "text-purple-600" }
          ])
        }

      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do perfil.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [usuario, toast])

  const [upcomingTasks, setUpcomingTasks] = useState([])
  const [upcomingMeetings, setUpcomingMeetings] = useState([])

  // Carregando dados reais do banco - arrays vazios quando não há dados

  const handleSaveProfile = async () => {
    if (!usuario) return

    // Verificar mudanças e mostrar confirmação
    const changes: string[] = []
    if (userData.name !== editData.name) {
      changes.push(`Nome: "${userData.name}" → "${editData.name}"`)
    }
    if (userData.email !== editData.email) {
      changes.push(`Email: "${userData.email}" → "${editData.email}"`)
    }
    if (userData.phone !== editData.phone) {
      changes.push(`Telefone: "${userData.phone}" → "${editData.phone}"`)
    }
    if (userData.department !== editData.department) {
      changes.push(`Departamento: "${userData.department}" → "${editData.department}"`)
    }
    if (userData.location !== editData.location) {
      changes.push(`Localização: "${userData.location}" → "${editData.location}"`)
    }

    if (changes.length === 0) {
      toast({
        title: "Nenhuma alteração",
        description: "Não há alterações para salvar.",
      })
      return
    }

    setProfileChanges(changes)
    setShowProfileConfirmation(true)
  }

  const confirmSaveProfile = async () => {
    if (!usuario) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: editData.name,
          email: editData.email,
          celular: editData.phone,
          funcao_empresa: editData.department,
          updated_at: new Date().toISOString()
        })
        .eq('id', usuario.id)

      if (error) throw error

      // Atualizar dados locais e no contexto
      setUserData(editData)
      
      // Atualizar o contexto de autenticação
      updateUsuario({
        nome: editData.name,
        email: editData.email,
        celular: editData.phone,
        funcao_empresa: editData.department
      })
      
      setIsEditing(false)
      setShowProfileConfirmation(false)
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditData(userData)
    setIsEditing(false)
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      })
      return
    }

    setShowPasswordConfirmation(true)
  }

  const confirmChangePassword = async () => {
    try {
      setLoading(true)

      // Primeiro, verificar se o usuário está autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error("Usuário não autenticado. Faça login novamente.")
      }

      // Atualizar senha
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setShowPasswordConfirmation(false)
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao alterar a senha.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = () => {
    toast({
      title: "Solicitação enviada",
      description: "Sua solicitação de exclusão foi enviada ao gestor para aprovação.",
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta": return "destructive"
      case "Média": return "default"
      case "Baixa": return "secondary"
      default: return "default"
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6 bg-background">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
              <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Info Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{userData.name}</CardTitle>
              <CardDescription>{userData.position}</CardDescription>
              <Badge variant="outline" className="w-fit mx-auto mt-2">
                {userData.department}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{userData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{userData.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{userData.location}</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="space-y-3 mt-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="profile">Editar Perfil</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
              <TabsTrigger value="account">Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Upcoming Meetings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Próximas Reuniões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingMeetings.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingMeetings.map((meeting, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{meeting.title}</p>
                            <p className="text-sm text-muted-foreground">{meeting.date}</p>
                          </div>
                          <Badge variant="outline">{meeting.participants} participantes</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma reunião agendada</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5" />
                    Próximas Tarefas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingTasks.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingTasks.map((task, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">Prazo: {task.dueDate}</p>
                          </div>
                          <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma tarefa próxima</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Informações Pessoais</CardTitle>
                      <CardDescription>Atualize suas informações pessoais</CardDescription>
                    </div>
                    {!isEditing && (
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={isEditing ? editData.name : userData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={isEditing ? editData.email : userData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={isEditing ? editData.phone : userData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Cargo</Label>
                      <Input
                        id="position"
                        value={userData.position}
                        disabled={true}
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Departamento</Label>
                      <Input
                        id="department"
                        value={isEditing ? editData.department : userData.department}
                        onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Localização</Label>
                      <Input
                        id="location"
                        value={isEditing ? editData.location : userData.location}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveProfile}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleChangePassword} className="w-full">
                    <Lock className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                  <CardDescription>Ações irreversíveis para sua conta</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border border-destructive/20 rounded-lg p-4">
                    <h4 className="font-medium text-destructive mb-2">Excluir conta</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta ação solicitará a exclusão permanente da sua conta. 
                      A solicitação será enviada ao gestor para aprovação.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Solicitar Exclusão
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação enviará uma solicitação de exclusão da sua conta ao gestor. 
                            Você receberá uma resposta em até 48 horas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                            Enviar Solicitação
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                  <CardDescription>Ações irreversíveis para sua conta</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border border-destructive/20 rounded-lg p-4">
                    <h4 className="font-medium text-destructive mb-2">Excluir conta</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta ação solicitará a exclusão permanente da sua conta. 
                      A solicitação será enviada ao gestor para aprovação.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Solicitar Exclusão
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação enviará uma solicitação de exclusão da sua conta ao gestor. 
                            Você receberá uma resposta em até 48 horas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                            Enviar Solicitação
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de confirmação para alteração do perfil */}
      <AlertDialog open={showProfileConfirmation} onOpenChange={setShowProfileConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alterações</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>Você está prestes a fazer as seguintes alterações em seu perfil:</div>
              <div className="bg-muted p-3 rounded-md">
                {profileChanges.map((change, index) => (
                  <div key={index} className="text-sm font-medium">{change}</div>
                ))}
              </div>
              <div>Deseja continuar com essas alterações?</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowProfileConfirmation(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveProfile}>
              Confirmar Alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmação para alteração de senha */}
      <AlertDialog open={showPasswordConfirmation} onOpenChange={setShowPasswordConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alteração de Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a alterar sua senha de acesso. Esta ação não pode ser desfeita.
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowPasswordConfirmation(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmChangePassword}>
              Alterar Senha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
    )}
    </div>
  )
}