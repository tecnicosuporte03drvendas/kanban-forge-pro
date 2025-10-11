import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectiveUser } from '@/hooks/use-effective-user';
import { supabase } from "@/integrations/supabase/client";
import { IndividualStats } from "@/components/performance/IndividualStats";
import { TeamStats } from "@/components/performance/TeamStats";
import { CompanyStats } from "@/components/performance/CompanyStats";
import { RecentActivities } from "@/components/performance/RecentActivities";
import { WeeklyChart } from "@/components/performance/WeeklyChart";
const Desempenho = () => {
  const {
    usuario
  } = useEffectiveUser();
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (usuario?.empresa_id) {
      loadCompanyInfo();
    }
  }, [usuario?.empresa_id]);
  const loadCompanyInfo = async () => {
    try {
      const {
        data: empresa
      } = await supabase.from('empresas').select('nome_fantasia').eq('id', usuario?.empresa_id).single();
      if (empresa) {
        setCompanyName(empresa.nome_fantasia);
      }
    } catch (error) {
      console.error('Erro ao carregar informações da empresa:', error);
    } finally {
      setLoading(false);
    }
  };
  const pageTitle = 'Meu Desempenho';
  const refreshData = () => {
    loadCompanyInfo();
    // Forçar refresh dos componentes filhos
    window.location.reload();
  };
  return <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
              <p className="text-muted-foreground">
                Acompanhe sua produtividade e performance pessoal
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <div className="space-y-6">
          

          {/* Estatísticas individuais */}
          <IndividualStats userId={usuario?.id} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <Tabs defaultValue="performance" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-card">
                  <TabsTrigger value="performance">
                    Minha Performance
                  </TabsTrigger>
                  <TabsTrigger value="metas">Metas</TabsTrigger>
                </TabsList>

                <TabsContent value="performance">
                  <WeeklyChart userId={usuario?.id} />
                </TabsContent>

                <TabsContent value="metas">
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Metas e Objetivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Defina e acompanhe suas metas pessoais.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <RecentActivities userId={usuario?.id} />
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Desempenho;