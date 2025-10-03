import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserReactivatedData {
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json() as UserReactivatedData;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar URL do webhook do n8n
    const { data: configData, error: configError } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'n8n_webhook_url')
      .single();

    if (configError) {
      console.error('Erro ao buscar configuração do webhook:', configError);
    }

    const webhookUrl = configData?.valor || 'https://felipedev.app.n8n.cloud/webhook/38c65d9f-05fa-48a3-aa15-4b77fc18bb1a';

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar dados da empresa
    const { data: empresaData, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', userData.empresa_id)
      .single();

    if (empresaError) {
      console.error('Erro ao buscar empresa:', empresaError);
    }

    // Contar tarefas atribuídas ao usuário
    const { count: tarefasCount } = await supabase
      .from('tarefas_responsaveis')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId);

    // Preparar payload para o webhook
    const payload = {
      event: 'user_reactivated',
      timestamp: new Date().toISOString(),
      user: {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        tipo_usuario: userData.tipo_usuario,
        funcao_empresa: userData.funcao_empresa,
        celular: userData.celular,
        created_at: userData.created_at,
      },
      company: empresaData ? {
        id: empresaData.id,
        nome_fantasia: empresaData.nome_fantasia,
        razao_social: empresaData.razao_social,
        cnpj: empresaData.cnpj,
        ativa: empresaData.ativa,
      } : null,
      metadata: {
        tarefas_atribuidas: tarefasCount || 0,
      },
    };

    console.log('Enviando notificação para webhook:', webhookUrl);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Enviar para o webhook do n8n
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      console.error('Erro ao enviar para webhook:', await webhookResponse.text());
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao enviar notificação',
          details: await webhookResponse.text()
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Notificação enviada com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notificação de reativação enviada com sucesso',
        payload 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
