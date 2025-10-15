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
    const { action, testType = 'normal' } = await req.json();
    
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

    // Buscar instância Evolution
    const { data: evolutionInstance } = await supabase
      .from('instancias_whatsapp')
      .select('*')
      .limit(1)
      .single();

    // Dados de teste baseados no tipo
    let responsibles = [];
    
    if (testType === 'normal') {
      // 2 usuários individuais
      responsibles = [
        {
          id: 'test-user-1',
          nome: 'João Silva',
          email: 'joao@teste.com',
          celular: '5521999999991',
          tipo: 'usuario',
          em_equipe: false,
          nome_equipe: null,
        },
        {
          id: 'test-user-2',
          nome: 'Maria Santos',
          email: 'maria@teste.com',
          celular: '5521999999992',
          tipo: 'usuario',
          em_equipe: false,
          nome_equipe: null,
        },
      ];
    } else if (testType === 'equipe') {
      // Membros de uma equipe
      responsibles = [
        {
          id: 'test-user-3',
          nome: 'Pedro Costa',
          email: 'pedro@teste.com',
          celular: '5521999999993',
          tipo: 'usuario',
          em_equipe: true,
          nome_equipe: 'Equipe Desenvolvimento',
        },
        {
          id: 'test-user-4',
          nome: 'Ana Paula',
          email: 'ana@teste.com',
          celular: '5521999999994',
          tipo: 'usuario',
          em_equipe: true,
          nome_equipe: 'Equipe Desenvolvimento',
        },
      ];
    } else if (testType === 'mesclado') {
      // Mix de usuários individuais e de equipe
      responsibles = [
        {
          id: 'test-user-5',
          nome: 'Carlos Mendes',
          email: 'carlos@teste.com',
          celular: '5521999999995',
          tipo: 'usuario',
          em_equipe: false,
          nome_equipe: null,
        },
        {
          id: 'test-user-6',
          nome: 'Juliana Alves',
          email: 'juliana@teste.com',
          celular: '5521999999996',
          tipo: 'usuario',
          em_equipe: true,
          nome_equipe: 'Equipe Marketing',
        },
        {
          id: 'test-user-7',
          nome: 'Roberto Lima',
          email: 'roberto@teste.com',
          celular: '5521999999997',
          tipo: 'usuario',
          em_equipe: true,
          nome_equipe: 'Equipe Marketing',
        },
      ];
    } else if (testType === 'remocao') {
      // Teste de remoção
      responsibles = [
        {
          id: 'test-user-8',
          nome: 'Fernanda Souza',
          email: 'fernanda@teste.com',
          celular: '5521999999998',
          tipo: 'usuario',
          em_equipe: false,
          nome_equipe: null,
          removido: true, // Marcação especial para remoção
        },
      ];
    }

    const testData = {
      action: testType === 'remocao' ? `${action}_removed_test` : `${action}_test`,
      testType,
      timestamp: new Date().toISOString(),
      task: {
        id: 'test-task-id',
        titulo: `Tarefa de Teste - ${testType.charAt(0).toUpperCase() + testType.slice(1)}`,
        descricao: `Esta é uma tarefa de teste para validar notificações do tipo ${testType}`,
        prioridade: 'media',
        data_conclusao: new Date().toISOString().split('T')[0],
        horario_conclusao: '18:00:00',
        ...(action.includes('overdue') && { dias_atraso: action.includes('5days') ? 5 : 1 }),
      },
      responsibles,
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
      evolution_instance: evolutionInstance ? {
        nome: evolutionInstance.nome,
        telefone: evolutionInstance.telefone,
        status: evolutionInstance.status,
        webhook_url: evolutionInstance.webhook_url,
      } : null,
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
      acao: `teste_${action}_${testType}`,
      sucesso: true,
      dados_entrada: { action, testType },
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
