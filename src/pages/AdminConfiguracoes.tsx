import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Wifi, WifiOff, QrCode } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Configuracao {
  id: string;
  chave: string;
  valor: string;
  descricao?: string;
}

interface InstanciaWhatsApp {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  qr_code?: string;
  webhook_url?: string;
}

interface CreateInstanceForm {
  nome: string;
  telefone: string;
}

export const AdminConfiguracoes: React.FC = () => {
  const { usuario } = useAuth();
  const { toast } = useToast();
  
  const [urlMensagens, setUrlMensagens] = useState('');
  const [urlInstancias, setUrlInstancias] = useState('');
  const [instancias, setInstancias] = useState<InstanciaWhatsApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [formInstance, setFormInstance] = useState<CreateInstanceForm>({ nome: '', telefone: '' });
  const [qrCodeVisible, setQrCodeVisible] = useState<{ [key: string]: boolean }>({});

  // Verificar se usuário é master
  if (!usuario || usuario.tipo_usuario !== 'master') {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    carregarConfiguracoes();
    carregarInstancias();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      console.log('🔍 Buscando configurações do banco...');
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .in('chave', ['n8n_webhook_mensagens', 'n8n_webhook_instancias']);

      if (error) throw error;

      console.log('📊 Configurações encontradas:', data);

      data?.forEach((config: Configuracao) => {
        console.log('⚙️ Processando config:', config.chave, '=', config.valor);
        if (config.chave === 'n8n_webhook_mensagens') {
          setUrlMensagens(config.valor);
          console.log('✅ URL Mensagens definida:', config.valor);
        } else if (config.chave === 'n8n_webhook_instancias') {
          setUrlInstancias(config.valor);
          console.log('✅ URL Instâncias definida:', config.valor);
        }
      });
    } catch (error: any) {
      console.error('❌ Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações",
        variant: "destructive",
      });
    }
  };

  const carregarInstancias = async () => {
    try {
      const { data, error } = await supabase
        .from('instancias_whatsapp')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstancias(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar instâncias:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar instâncias",
        variant: "destructive",
      });
    }
  };

  const salvarConfiguracao = async (chave: string, valor: string, descricao?: string) => {
    if (!valor.trim()) {
      toast({
        title: "Erro",
        description: "A URL não pode estar vazia",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('configuracoes_sistema')
        .upsert({
          chave,
          valor: valor.trim(),
          descricao
        }, {
          onConflict: 'chave'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configuração",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const criarInstancia = async () => {
    if (!formInstance.nome.trim() || !formInstance.telefone.trim()) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!urlInstancias.trim()) {
      toast({
        title: "Erro", 
        description: "Configure o webhook de instâncias antes de criar uma instância",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Criando instância via N8N...');
      console.log('📍 URL do webhook:', urlInstancias);
      console.log('📤 Dados enviados:', { nome: formInstance.nome, telefone: formInstance.telefone });

      // Disparar webhook N8N que executa criação + busca da instância
      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: urlInstancias,
          data: {
            action: 'create_instance',
            nome: formInstance.nome,
            telefone: formInstance.telefone,
          }
        }
      });

      if (error) {
        console.log('❌ Erro do proxy:', error);
        throw new Error(`Erro do proxy: ${error.message}`);
      }

      console.log('✅ Resposta completa do N8N:', data);

      // Aguardar resposta do nó de BUSCA da instância (não do nó de criação)
      // O N8N deve retornar os dados reais da Evolution via nó de busca
      if (!data || !data.instanceData) {
        throw new Error('N8N não retornou dados da instância. Verifique se o nó de busca está configurado corretamente.');
      }

      const instanceData = data.instanceData;
      console.log('📊 Dados da instância retornados pelo N8N:', instanceData);

      // Usar APENAS os dados retornados pelo N8N (nó de busca)
      const novaInstancia = {
        id: instanceData.id || instanceData.instanceId || crypto.randomUUID(),
        nome: instanceData.nome || instanceData.name || formInstance.nome,
        telefone: instanceData.telefone || instanceData.phone || formInstance.telefone,
        status: instanceData.status || 'desconectada',
        qr_code: instanceData.qrCode || instanceData.qr_code || null,
        webhook_url: urlInstancias,
        created_at: instanceData.created_at || new Date().toISOString(),
        updated_at: instanceData.updated_at || new Date().toISOString()
      };

      // Salvar no Supabase apenas para persistência local
      const { error: dbError } = await supabase
        .from('instancias_whatsapp')
        .insert(novaInstancia);

      if (dbError) {
        console.error('❌ Erro ao salvar instância no Supabase:', dbError);
        // Continuar mesmo com erro no Supabase, pois a instância existe no N8N/Evolution
      }

      // Atualizar lista local com dados REAIS do N8N
      setInstancias(prev => [novaInstancia, ...prev]);

      toast({
        title: "Instância criada com sucesso",
        description: `Instância ${novaInstancia.nome} criada e validada pelo N8N/Evolution`,
      });

      // Limpar formulário e fechar modal
      setFormInstance({ nome: '', telefone: '' });
      setModalAberto(false);

    } catch (error: any) {
      console.error('❌ Erro ao criar instância:', error);
      toast({
        title: "Erro ao criar instância",
        description: error.message || "Erro de comunicação com N8N/Evolution", 
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const conectarInstancia = async (instancia: InstanciaWhatsApp) => {
    if (!urlInstancias.trim()) {
      toast({
        title: "Erro",
        description: "Configure o webhook de instâncias antes de conectar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔌 Conectando instância via N8N...');
      console.log('📍 Instância a conectar:', { id: instancia.id, nome: instancia.nome });
      
      // Disparar webhook N8N para conectar instância
      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: urlInstancias,
          data: {
            action: 'connect_instance',
            instanceId: instancia.id,
            nome: instancia.nome,
            telefone: instancia.telefone,
          }
        }
      });

      if (error) {
        console.log('❌ Erro do proxy ao conectar:', error);
        throw new Error(`Erro do proxy: ${error.message}`);
      }

      console.log('✅ Resposta N8N ao conectar:', data);

      // Usar apenas dados retornados pelo N8N/Evolution
      if (!data) {
        throw new Error('N8N não retornou dados de conexão da instância');
      }

      const updateData: any = {
        status: data.status || data.instanceStatus || 'conectando',
        updated_at: new Date().toISOString()
      };

      // QR Code vem do N8N/Evolution
      if (data.qrCode || data.qr_code) {
        updateData.qr_code = data.qrCode || data.qr_code;
      }

      // Atualizar no Supabase apenas para persistência
      const { error: updateError } = await supabase
        .from('instancias_whatsapp')
        .update(updateData)
        .eq('id', instancia.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar instância no Supabase:', updateError);
      }

      // Atualizar localmente com dados REAIS do N8N
      setInstancias(prev => prev.map(inst => 
        inst.id === instancia.id 
          ? { 
              ...inst, 
              status: data.status || data.instanceStatus || 'conectando', 
              qr_code: data.qrCode || data.qr_code || inst.qr_code 
            }
          : inst
      ));

      // Exibir QR Code se retornado pelo N8N
      if (data.qrCode || data.qr_code) {
        setQrCodeVisible(prev => ({ ...prev, [instancia.id]: true }));
      }

      toast({
        title: "Status atualizado",
        description: `Status: ${data.status || data.instanceStatus || 'conectando'}`,
      });

    } catch (error: any) {
      console.error('❌ Erro ao conectar instância:', error);
      toast({
        title: "Erro ao conectar instância",
        description: error.message || "Erro de comunicação com N8N/Evolution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
        </div>

        {/* Configuração de Mensagens */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuração do N8N - Mensagens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="url-mensagens">URL do Webhook de Mensagens</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="url-mensagens"
                  value={urlMensagens}
                  onChange={(e) => setUrlMensagens(e.target.value)}
                  placeholder="https://n8n.exemplo.com/webhook/mensagens"
                  className="flex-1"
                />
                <Button 
                  onClick={() => salvarConfiguracao('n8n_webhook_mensagens', urlMensagens, 'URL do webhook N8N para envio de mensagens')}
                  disabled={loading}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuração de Instâncias */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuração do N8N - Instâncias WhatsApp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="url-instancias">URL do Webhook de Instâncias</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="url-instancias"
                  value={urlInstancias}
                  onChange={(e) => setUrlInstancias(e.target.value)}
                  placeholder="https://n8n.exemplo.com/webhook/instancias"
                  className="flex-1"
                />
                <Button 
                  onClick={() => salvarConfiguracao('n8n_webhook_instancias', urlInstancias, 'URL do webhook N8N para gerenciamento de instâncias WhatsApp')}
                  disabled={loading}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gerenciamento de Instâncias */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Instâncias WhatsApp</CardTitle>
              <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Instância
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Instância</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nome-instancia">Nome da Instância</Label>
                      <Input
                        id="nome-instancia"
                        value={formInstance.nome}
                        onChange={(e) => setFormInstance(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Ex: WhatsApp Principal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefone-instancia">Número do Telefone</Label>
                      <Input
                        id="telefone-instancia"
                        value={formInstance.telefone}
                        onChange={(e) => setFormInstance(prev => ({ ...prev, telefone: e.target.value }))}
                        placeholder="Ex: +5521999999999"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={criarInstancia} disabled={loading} className="flex-1">
                        Criar
                      </Button>
                      <Button variant="outline" onClick={() => setModalAberto(false)} className="flex-1">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {instancias.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma instância criada ainda
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {instancias.map((instancia) => (
                  <Card key={instancia.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{instancia.nome}</h3>
                          <p className="text-sm text-muted-foreground">{instancia.telefone}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {instancia.status === 'conectada' ? (
                            <Wifi className="h-4 w-4 text-green-500" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            instancia.status === 'conectada' 
                              ? 'bg-green-100 text-green-800' 
                              : instancia.status === 'conectando'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {instancia.status === 'conectada' ? 'Conectada' : 
                             instancia.status === 'conectando' ? 'Conectando' : 'Desconectada'}
                          </span>
                        </div>
                      </div>
                      
                      {instancia.status !== 'conectada' && (
                        <Button 
                          onClick={() => conectarInstancia(instancia)}
                          disabled={loading}
                          className="w-full mb-3"
                        >
                          Conectar
                        </Button>
                      )}

                      {qrCodeVisible[instancia.id] && instancia.qr_code && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <QrCode className="h-4 w-4" />
                            <span className="text-sm font-medium">Escaneie o QR Code</span>
                          </div>
                          <img 
                            src={instancia.qr_code} 
                            alt="QR Code WhatsApp" 
                            className="w-full max-w-64 mx-auto"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};