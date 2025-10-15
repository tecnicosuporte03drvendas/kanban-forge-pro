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
    console.log('notify-task-overdue-5days triggered');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se notificação está ativa
    const { data: config } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'notif_atraso_5dias_ativa')
      .single();

    if (!config || config.valor !== 'true') {
      console.log('Notificação de atraso 5 dias está desativada');
      return new Response(
        JSON.stringify({ message: 'Notification disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
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

    // Calcular data de 5 dias atrás
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

    // Buscar tarefas com 5 dias de atraso
    const { data: tarefas } = await supabase
      .from('tarefas')
      .select('*')
      .eq('data_conclusao', fiveDaysAgoStr)
      .in('status', ['criada', 'aceita', 'executando'])
      .eq('arquivada', false);

    console.log(`Encontradas ${tarefas?.length || 0} tarefas com 5 dias de atraso`);

    if (!tarefas || tarefas.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tasks found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let notificationsSent = 0;

    for (const tarefa of tarefas) {
      // Buscar responsáveis
      const { data: responsaveisRaw } = await supabase
        .from('tarefas_responsaveis')
        .select('usuario_id, equipe_id')
        .eq('tarefa_id', tarefa.id);

      const responsibles = [];

      if (responsaveisRaw) {
        for (const resp of responsaveisRaw) {
          if (resp.usuario_id) {
            const { data: usuario } = await supabase
              .from('usuarios')
              .select('id, nome, email, celular')
              .eq('id', resp.usuario_id)
              .single();
            
            if (usuario) {
              responsibles.push({
                ...usuario,
                tipo: 'usuario'
              });
            }
          } else if (resp.equipe_id) {
            const { data: membros } = await supabase
              .from('usuarios_equipes')
              .select('usuario_id')
              .eq('equipe_id', resp.equipe_id);

            if (membros) {
              for (const membro of membros) {
                const { data: usuario } = await supabase
                  .from('usuarios')
                  .select('id, nome, email, celular')
                  .eq('id', membro.usuario_id)
                  .single();
                
                if (usuario) {
                  responsibles.push({
                    ...usuario,
                    tipo: 'equipe'
                  });
                }
              }
            }
          }
        }
      }

      // Buscar gestores da empresa
      const { data: gestores } = await supabase
        .from('usuarios')
        .select('id, nome, email, celular')
        .eq('empresa_id', tarefa.empresa_id)
        .in('tipo_usuario', ['gestor', 'proprietario']);

      // Buscar proprietário da empresa
      const { data: proprietario } = await supabase
        .from('usuarios')
        .select('id, nome, email, celular')
        .eq('empresa_id', tarefa.empresa_id)
        .eq('tipo_usuario', 'proprietario')
        .single();

      // Buscar dados da empresa
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id, nome_fantasia, razao_social')
        .eq('id', tarefa.empresa_id)
        .single();

      // Buscar instância Evolution
      const { data: evolutionInstance } = await supabase
        .from('instancias_whatsapp')
        .select('*')
        .limit(1)
        .single();

      // Montar payload
      const payload = {
        action: 'task_overdue_5days',
        timestamp: new Date().toISOString(),
        task: {
          id: tarefa.id,
          titulo: tarefa.titulo,
          descricao: tarefa.descricao,
          prioridade: tarefa.prioridade,
          data_conclusao: tarefa.data_conclusao,
          horario_conclusao: tarefa.horario_conclusao,
          dias_atraso: 5,
        },
        responsibles: responsibles,
        managers: gestores || [],
        owner: proprietario,
        company: empresa,
        evolution_instance: evolutionInstance ? {
          nome: evolutionInstance.nome,
          telefone: evolutionInstance.telefone,
          status: evolutionInstance.status,
          webhook_url: evolutionInstance.webhook_url,
        } : null,
      };

      console.log('Enviando notificação de atraso 5 dias para tarefa:', tarefa.id);

      // Enviar para n8n
      const response = await fetch(webhookConfig.valor, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        notificationsSent++;
        
        // Log da operação
        await supabase.from('instancias_whatsapp_logs').insert({
          acao: 'notificacao_atraso_5dias',
          sucesso: true,
          dados_entrada: { taskId: tarefa.id },
          dados_retorno: await response.json(),
        });
      }
    }

    console.log(`${notificationsSent} notificações enviadas`);

    return new Response(
      JSON.stringify({ success: true, count: notificationsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erro em notify-task-overdue-5days:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
