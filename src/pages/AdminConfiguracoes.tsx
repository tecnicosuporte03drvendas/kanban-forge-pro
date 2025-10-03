import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveUser } from '@/hooks/use-effective-user';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Wifi, WifiOff, QrCode, X, Trash2, RotateCcw, User } from 'lucide-react';
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
  const { usuario } = useEffectiveUser();
  const { toast } = useToast();
  
  // Estados para WhatsApp
  const [urlMensagens, setUrlMensagens] = useState('');
  const [urlInstancias, setUrlInstancias] = useState('');
  const [instancias, setInstancias] = useState<InstanciaWhatsApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [formInstance, setFormInstance] = useState<CreateInstanceForm>({ nome: '', telefone: '' });
  const [qrCodeVisible, setQrCodeVisible] = useState<{ [key: string]: boolean }>({});
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [currentQrCode, setCurrentQrCode] = useState<string | null>(null);
  const [currentInstanceName, setCurrentInstanceName] = useState<string>('');

  // Estados para dados do usuário
  const [nome, setNome] = useState(usuario?.nome || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Verificar se usuário é master
  if (!usuario || usuario.tipo_usuario !== 'master') {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    carregarConfiguracoes();
    carregarInstancias();
    if (usuario) {
      setNome(usuario.nome || '');
    }
  }, [usuario]);

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

      // O N8N deve retornar os dados reais da Evolution via nó de busca
      // Aceitar tanto dados diretos quanto estrutura aninhada
      const instanceData = data.instanceData || data;
      
      if (!instanceData) {
        throw new Error('N8N não retornou dados da instância. Verifique se o nó de busca está retornando dados.');
      }

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

      console.log('✅ N8N disparado com sucesso:', data);

      toast({
        title: "Conexão iniciada",
        description: "Aguardando dados da Evolution API...",
      });

      // Aguardar a Edge Function processar os dados e atualizar a instância
      let tentativas = 0;
      const maxTentativas = 15; // 30 segundos (15 * 2s)
      
      const aguardarQrCode = async () => {
        try {
          const { data: instanciaAtualizada, error: fetchError } = await supabase
            .from('instancias_whatsapp')
            .select('*')
            .eq('id', instancia.id)
            .single();

          if (fetchError) {
            console.error('Erro ao buscar instância:', fetchError);
            return;
          }

          console.log('🔍 Verificando instância atualizada:', instanciaAtualizada);

          // Atualizar estado local
          setInstancias(prev => prev.map(inst => 
            inst.id === instancia.id ? instanciaAtualizada : inst
          ));

          // Se recebeu QR code, mostrar modal
          if (instanciaAtualizada.qr_code) {
            console.log('📱 QR Code detectado, abrindo modal');
            setCurrentQrCode(instanciaAtualizada.qr_code);
            setCurrentInstanceName(instanciaAtualizada.nome);
            setQrModalOpen(true);
            
            toast({
              title: "QR Code gerado",
              description: "Escaneie o código para conectar sua instância",
            });
            return;
          }

          // Se ainda não tem QR code e não atingiu o limite, tentar novamente
          tentativas++;
          if (tentativas < maxTentativas) {
            console.log(`🔄 Tentativa ${tentativas}/${maxTentativas} - aguardando QR code...`);
            setTimeout(aguardarQrCode, 2000);
          } else {
            console.log('⏰ Timeout aguardando QR code');
            toast({
              title: "Timeout",
              description: "QR Code não foi gerado no tempo esperado",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Erro ao verificar QR code:', error);
        }
      };

      // Iniciar verificação após 1 segundo
      setTimeout(aguardarQrCode, 1000);

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

  const desconectarInstancia = async (instancia: InstanciaWhatsApp) => {
    if (!urlInstancias.trim()) {
      toast({
        title: "Erro",
        description: "Configure o webhook de instâncias antes de desconectar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔌 Desconectando instância via N8N...');
      console.log('📍 Instância a desconectar:', { id: instancia.id, nome: instancia.nome });
      
      // Disparar webhook N8N para desconectar instância
      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: urlInstancias,
          data: {
            action: 'disconnect_instance',
            instanceId: instancia.id,
            nome: instancia.nome,
            telefone: instancia.telefone,
          }
        }
      });

      if (error) {
        console.log('❌ Erro do proxy ao desconectar:', error);
        throw new Error(`Erro do proxy: ${error.message}`);
      }

      console.log('✅ Desconexão processada pelo N8N:', data);

      // Atualizar status local para desconectada
      setInstancias(prev => prev.map(inst => 
        inst.id === instancia.id ? { ...inst, status: 'desconectada', qr_code: null } : inst
      ));

      // Atualizar no Supabase
      await supabase
        .from('instancias_whatsapp')
        .update({ status: 'desconectada', qr_code: null })
        .eq('id', instancia.id);

      toast({
        title: "Instância desconectada",
        description: `${instancia.nome} foi desconectada com sucesso`,
      });

    } catch (error: any) {
      console.error('❌ Erro ao desconectar instância:', error);
      toast({
        title: "Erro ao desconectar instância",
        description: error.message || "Erro de comunicação com N8N/Evolution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletarInstancia = async (instancia: InstanciaWhatsApp) => {
    if (!urlInstancias.trim()) {
      toast({
        title: "Erro",
        description: "Configure o webhook de instâncias antes de deletar",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar a instância "${instancia.nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setLoading(true);
    try {
      console.log('🗑️ Deletando instância via N8N...');
      console.log('📍 Instância a deletar:', { id: instancia.id, nome: instancia.nome });
      
      // Disparar webhook N8N para deletar instância
      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: urlInstancias,
          data: {
            action: 'delete_instance',
            instanceId: instancia.id,
            nome: instancia.nome,
            telefone: instancia.telefone,
          }
        }
      });

      if (error) {
        console.log('❌ Erro do proxy ao deletar:', error);
        throw new Error(`Erro do proxy: ${error.message}`);
      }

      console.log('✅ Deleção processada pelo N8N:', data);

      // Remover da lista local
      setInstancias(prev => prev.filter(inst => inst.id !== instancia.id));

      // Remover do Supabase
      await supabase
        .from('instancias_whatsapp')
        .delete()
        .eq('id', instancia.id);

      toast({
        title: "Instância deletada",
        description: `${instancia.nome} foi deletada com sucesso`,
      });

    } catch (error: any) {
      console.error('❌ Erro ao deletar instância:', error);
      toast({
        title: "Erro ao deletar instância",
        description: error.message || "Erro de comunicação com N8N/Evolution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarQrCode = async (instanciaId: string, nomeInstancia: string) => {
    if (!urlInstancias.trim()) {
      toast({
        title: "Erro",
        description: "Configure o webhook de instâncias antes de atualizar QR Code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Atualizando QR Code via N8N...');
      console.log('📍 Instância:', { id: instanciaId, nome: nomeInstancia });
      
      // Disparar webhook N8N para gerar novo QR Code
      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: urlInstancias,
          data: {
            action: 'refresh_qr_code',
            instanceId: instanciaId,
          }
        }
      });

      if (error) {
        console.log('❌ Erro do proxy ao atualizar QR:', error);
        throw new Error(`Erro do proxy: ${error.message}`);
      }

      console.log('✅ Atualização de QR processada pelo N8N:', data);

      toast({
        title: "QR Code atualizado",
        description: "Aguardando novo QR Code...",
      });

      // Aguardar novo QR Code (similar ao fluxo de conexão)
      let tentativas = 0;
      const maxTentativas = 15;
      
      const aguardarNovoQrCode = async () => {
        try {
          const { data: instanciaAtualizada, error: fetchError } = await supabase
            .from('instancias_whatsapp')
            .select('*')
            .eq('id', instanciaId)
            .single();

          if (fetchError) {
            console.error('Erro ao buscar instância:', fetchError);
            return;
          }

          console.log('🔍 Verificando novo QR Code:', instanciaAtualizada);

          // Atualizar estado local
          setInstancias(prev => prev.map(inst => 
            inst.id === instanciaId ? instanciaAtualizada : inst
          ));

          // Se recebeu novo QR code, atualizar modal
          if (instanciaAtualizada.qr_code && instanciaAtualizada.qr_code !== currentQrCode) {
            console.log('📱 Novo QR Code detectado');
            setCurrentQrCode(instanciaAtualizada.qr_code);
            
            toast({
              title: "Novo QR Code gerado",
              description: "QR Code atualizado com sucesso",
            });
            return;
          }

          // Se ainda não tem novo QR code e não atingiu o limite, tentar novamente
          tentativas++;
          if (tentativas < maxTentativas) {
            console.log(`🔄 Tentativa ${tentativas}/${maxTentativas} - aguardando novo QR code...`);
            setTimeout(aguardarNovoQrCode, 2000);
          } else {
            console.log('⏰ Timeout aguardando novo QR code');
            toast({
              title: "Timeout",
              description: "Novo QR Code não foi gerado no tempo esperado",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Erro ao verificar novo QR code:', error);
        }
      };

      // Iniciar verificação após 1 segundo
      setTimeout(aguardarNovoQrCode, 1000);

    } catch (error: any) {
      console.error('❌ Erro ao atualizar QR Code:', error);
      toast({
        title: "Erro ao atualizar QR Code",
        description: error.message || "Erro de comunicação com N8N/Evolution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarConexao = async (instanciaId: string, nomeInstancia: string) => {
    if (!urlInstancias.trim()) {
      toast({
        title: "Erro",
        description: "Configure o webhook de instâncias antes de confirmar conexão",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('✅ Confirmando conexão via N8N...');
      console.log('📍 Instância:', { id: instanciaId, nome: nomeInstancia });
      
      // Disparar webhook N8N para verificar status da conexão
      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: urlInstancias,
          data: {
            action: 'check_connection_status',
            instanceId: instanciaId,
          }
        }
      });

      if (error) {
        console.log('❌ Erro do proxy ao confirmar conexão:', error);
        throw new Error(`Erro do proxy: ${error.message}`);
      }

      console.log('✅ Status verificado pelo N8N:', data);

      // Buscar dados atualizados da instância
      const { data: instanciaAtualizada, error: fetchError } = await supabase
        .from('instancias_whatsapp')
        .select('*')
        .eq('id', instanciaId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar instância atualizada:', fetchError);
        throw new Error('Erro ao verificar status da instância');
      }

      // Atualizar estado local
      setInstancias(prev => prev.map(inst => 
        inst.id === instanciaId ? instanciaAtualizada : inst
      ));

      // Fechar modal
      setQrModalOpen(false);
      setCurrentQrCode(null);

      toast({
        title: "Status verificado",
        description: `Instância ${nomeInstancia}: ${instanciaAtualizada.status}`,
      });

    } catch (error: any) {
      console.error('❌ Erro ao confirmar conexão:', error);
      toast({
        title: "Erro ao confirmar conexão",
        description: error.message || "Erro de comunicação com N8N/Evolution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarDadosUsuario = async () => {
    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome não pode estar vazio",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          nome: nome.trim()
        })
        .eq('id', usuario?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados atualizados com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const alterarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos de senha",
        variant: "destructive",
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast({
        title: "Erro",
        description: "A nova senha e a confirmação não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (novaSenha.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: usuario?.email || '',
        password: senhaAtual,
      });

      if (signInError) {
        throw new Error('Senha atual incorreta');
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (updateError) throw updateError;

      // Limpar campos
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao alterar senha",
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

        <Tabs defaultValue="usuario" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="usuario">
              <User className="h-4 w-4 mr-2" />
              Dados do Usuário
            </TabsTrigger>
            <TabsTrigger value="whatsapp">
              <Settings className="h-4 w-4 mr-2" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* Aba Dados do Usuário */}
          <TabsContent value="usuario" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={usuario?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O email não pode ser alterado
                  </p>
                </div>
                <Button onClick={atualizarDadosUsuario} disabled={loading}>
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="senha-atual">Senha Atual</Label>
                  <Input
                    id="senha-atual"
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div>
                  <Label htmlFor="nova-senha">Nova Senha</Label>
                  <Input
                    id="nova-senha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Digite a nova senha"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmar-senha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Confirme a nova senha"
                  />
                </div>
                <Button onClick={alterarSenha} disabled={loading}>
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba WhatsApp */}
          <TabsContent value="whatsapp" className="space-y-6">

            <Card>
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

            <Card>
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

            {/* Modal QR Code */}
            <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Conectar Instância WhatsApp</DialogTitle>
                </DialogHeader>
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code com seu WhatsApp para conectar a instância <strong>{currentInstanceName}</strong>
                  </p>
                  {currentQrCode && (
                    <div className="flex justify-center">
                      <img 
                        src={currentQrCode} 
                        alt="QR Code WhatsApp" 
                        className="max-w-64 w-full border rounded-lg"
                      />
                    </div>
                  )}
                   <div className="flex gap-2">
                     <Button 
                       variant="outline" 
                       onClick={() => atualizarQrCode(
                         instancias.find(i => i.nome === currentInstanceName)?.id || '', 
                         currentInstanceName
                       )}
                       disabled={loading}
                       className="flex-1"
                     >
                       <RotateCcw className="h-4 w-4 mr-2" />
                       Atualizar QR Code
                     </Button>
                     <Button 
                       onClick={() => confirmarConexao(
                         instancias.find(i => i.nome === currentInstanceName)?.id || '', 
                         currentInstanceName
                       )}
                       disabled={loading}
                       className="flex-1"
                     >
                       Confirmar Conexão
                     </Button>
                     <Button 
                       variant="outline" 
                       onClick={() => setQrModalOpen(false)}
                       className="flex-1"
                     >
                       Fechar
                     </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                      
                       <div className="space-y-2">
                         {instancia.status !== 'conectada' && (
                           <Button 
                             onClick={() => conectarInstancia(instancia)}
                             disabled={loading}
                             className="w-full"
                           >
                             Conectar
                           </Button>
                         )}
                         
                         <div className="flex gap-2">
                           {instancia.status === 'conectada' && (
                             <Button 
                               variant="outline"
                               onClick={() => desconectarInstancia(instancia)}
                               disabled={loading}
                               className="flex-1"
                             >
                               <X className="h-4 w-4 mr-2" />
                               Desconectar
                             </Button>
                           )}
                           
                           <Button 
                             variant="destructive"
                             onClick={() => deletarInstancia(instancia)}
                             disabled={loading}
                             className={instancia.status === 'conectada' ? 'flex-1' : 'w-full'}
                           >
                             <Trash2 className="h-4 w-4 mr-2" />
                             Apagar instância
                           </Button>
                         </div>
                       </div>

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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};