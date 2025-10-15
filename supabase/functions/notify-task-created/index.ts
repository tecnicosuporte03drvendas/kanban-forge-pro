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
    const { taskId, createdBy } = await req.json();
    
    console.log('notify-task-created triggered', { taskId, createdBy });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se notificação está ativa
    const { data: config } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'notif_tarefa_criada_ativa')
      .single();

    if (!config || config.valor !== 'true') {
      console.log('Notificação de tarefa criada está desativada');
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

    // Buscar dados da tarefa
    const { data: tarefa } = await supabase
      .from('tarefas')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!tarefa) {
      throw new Error('Tarefa não encontrada');
    }

    // Buscar dados do criador
    const { data: criador } = await supabase
      .from('usuarios')
      .select('id, nome, email, celular')
      .eq('id', createdBy)
      .single();

    // Buscar responsáveis
    const { data: responsaveisRaw } = await supabase
      .from('tarefas_responsaveis')
      .select('usuario_id, equipe_id')
      .eq('tarefa_id', taskId);

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
          const { data: equipe } = await supabase
            .from('equipes')
            .select('id, nome')
            .eq('id', resp.equipe_id)
            .single();
          
          if (equipe) {
            // Buscar membros da equipe
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
                    tipo: 'equipe',
                    equipe_nome: equipe.nome
                  });
                }
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

    // Buscar dados da empresa
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id, nome_fantasia, razao_social')
      .eq('id', tarefa.empresa_id)
      .single();

    // Montar payload
    const payload = {
      action: 'task_created',
      timestamp: new Date().toISOString(),
      task: {
        id: tarefa.id,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        prioridade: tarefa.prioridade,
        data_conclusao: tarefa.data_conclusao,
        horario_conclusao: tarefa.horario_conclusao,
      },
      created_by: criador,
      responsibles: responsibles,
      managers: gestores || [],
      company: empresa,
    };

    console.log('Enviando payload para n8n:', payload);

    // Enviar para n8n
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

    // Log da operação
    await supabase.from('instancias_whatsapp_logs').insert({
      acao: 'notificacao_tarefa_criada',
      sucesso: true,
      dados_entrada: { taskId, createdBy },
      dados_retorno: result,
    });

    console.log('Notificação enviada com sucesso');

    return new Response(
      JSON.stringify({ success: true, payload }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erro em notify-task-created:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
