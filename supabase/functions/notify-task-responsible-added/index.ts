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
    const { taskId, addedResponsibles } = await req.json();
    
    console.log('notify-task-responsible-added triggered', { taskId, addedResponsibles });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar tarefa
    const { data: task, error: taskError } = await supabase
      .from('tarefas')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Tarefa não encontrada');
    }

    // Buscar webhook URL
    const { data: webhookConfig } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'n8n_webhook_mensagens')
      .single();

    if (!webhookConfig?.valor) {
      throw new Error('Webhook URL não configurado');
    }

    // Buscar empresa
    const { data: company } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', task.empresa_id)
      .single();

    // Buscar instância Evolution
    const { data: evolutionInstance } = await supabase
      .from('instancias_whatsapp')
      .select('*')
      .limit(1)
      .single();

    // Processar responsáveis adicionados
    const responsiblesData = [];

    for (const respId of addedResponsibles) {
      // Verificar se é usuário
      const { data: user } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', respId)
        .single();

      if (user) {
        responsiblesData.push({
          id: user.id,
          nome: user.nome,
          email: user.email,
          celular: user.celular,
          tipo: 'usuario',
          em_equipe: false,
          nome_equipe: null,
        });
        continue;
      }

      // Verificar se é equipe
      const { data: team } = await supabase
        .from('equipes')
        .select('*')
        .eq('id', respId)
        .single();

      if (team) {
        // Buscar membros da equipe
        const { data: teamMembers } = await supabase
          .from('usuarios_equipes')
          .select('usuario_id')
          .eq('equipe_id', team.id);

        if (teamMembers) {
          for (const member of teamMembers) {
            const { data: memberData } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', member.usuario_id)
              .single();

            if (memberData) {
              responsiblesData.push({
                id: memberData.id,
                nome: memberData.nome,
                email: memberData.email,
                celular: memberData.celular,
                tipo: 'usuario',
                em_equipe: true,
                nome_equipe: team.nome,
              });
            }
          }
        }
      }
    }

    const payload = {
      action: 'task_responsible_added',
      timestamp: new Date().toISOString(),
      task: {
        id: task.id,
        titulo: task.titulo,
        descricao: task.descricao,
        prioridade: task.prioridade,
        data_conclusao: task.data_conclusao,
        horario_conclusao: task.horario_conclusao,
      },
      responsibles: responsiblesData,
      company: company ? {
        id: company.id,
        nome_fantasia: company.nome_fantasia,
        razao_social: company.razao_social,
      } : null,
      evolution_instance: evolutionInstance ? {
        nome: evolutionInstance.nome,
        telefone: evolutionInstance.telefone,
        status: evolutionInstance.status,
        webhook_url: evolutionInstance.webhook_url,
      } : null,
    };

    console.log('Enviando payload para n8n:', payload);

    const response = await fetch(webhookConfig.valor, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar webhook: ${response.statusText}`);
    }

    const result = await response.json();

    await supabase.from('instancias_whatsapp_logs').insert({
      acao: 'notificacao_responsavel_adicionado',
      sucesso: true,
      dados_entrada: { taskId, addedResponsibles },
      dados_retorno: result,
    });

    console.log('Notificação enviada com sucesso');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erro em notify-task-responsible-added:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
