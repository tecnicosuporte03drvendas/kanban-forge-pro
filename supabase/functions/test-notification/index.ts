import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    console.log('test-notification triggered for action:', action);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar webhook URL
    const { data: webhookConfig } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'n8n_webhook_mensagens')
      .single();

    if (!webhookConfig?.valor) {
      throw new Error('Webhook URL não configurado');
    }

    // Dados de teste
    const testData = {
      action: `${action}_test`,
      timestamp: new Date().toISOString(),
      task: {
        id: 'test-task-id',
        titulo: 'Tarefa de Teste',
        descricao: 'Esta é uma tarefa de teste para validar o sistema de notificações',
        prioridade: 'media',
        data_conclusao: new Date().toISOString().split('T')[0],
        horario_conclusao: '18:00:00',
        ...(action.includes('overdue') && { dias_atraso: action.includes('5days') ? 5 : 1 }),
      },
      responsibles: [
        {
          id: 'test-user-id',
          nome: 'Responsável Teste',
          email: 'teste@teste.com',
          celular: '5521999999999',
          tipo: 'usuario',
        },
      ],
      ...(action.includes('created') && {
        created_by: {
          id: 'test-creator-id',
          nome: 'Criador Teste',
          email: 'criador@teste.com',
          celular: '5521988888888',
        },
      }),
      ...(action.includes('overdue') && {
        managers: [
          {
            id: 'test-manager-id',
            nome: 'Gestor Teste',
            email: 'gestor@teste.com',
            celular: '5521977777777',
          },
        ],
      }),
      ...(action === 'task_overdue_5days' && {
        owner: {
          id: 'test-owner-id',
          nome: 'Proprietário Teste',
          email: 'proprietario@teste.com',
          celular: '5521966666666',
        },
      }),
      company: {
        id: 'test-company-id',
        nome_fantasia: 'Empresa Teste',
        razao_social: 'Empresa Teste LTDA',
      },
    };

    console.log('Enviando dados de teste para n8n:', testData);

    // Enviar para n8n
    const response = await fetch(webhookConfig.valor, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar webhook: ${response.statusText}`);
    }

    const result = await response.json();

    // Log da operação
    await supabase.from('instancias_whatsapp_logs').insert({
      acao: `teste_${action}`,
      sucesso: true,
      dados_entrada: { action },
      dados_retorno: result,
    });

    console.log('Notificação de teste enviada com sucesso');

    return new Response(
      JSON.stringify({ success: true, testData, response: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erro em test-notification:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
