import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringTask {
  id: string;
  tarefa_template_id: string;
  empresa_id: string;
  criado_por: string;
  frequencia: string;
  intervalo: number;
  dias_semana: number[] | null;
  dia_mes: number | null;
  data_inicio: string;
  data_fim: string | null;
  proxima_execucao: string | null;
}

interface TarefaTemplate {
  titulo: string;
  descricao: string | null;
  prioridade: string;
  horario_conclusao: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Iniciando geração de tarefas recorrentes...');

    // Buscar todas as tarefas recorrentes ativas que devem ser executadas hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const { data: recurringTasks, error: fetchError } = await supabase
      .from('tarefas_recorrentes')
      .select('*')
      .eq('ativo', true)
      .or(`proxima_execucao.is.null,proxima_execucao.lte.${hoje.toISOString()}`);

    if (fetchError) {
      console.error('❌ Erro ao buscar tarefas recorrentes:', fetchError);
      throw fetchError;
    }

    console.log(`📋 Encontradas ${recurringTasks?.length || 0} tarefas recorrentes para processar`);

    let tasksCreated = 0;
    let tasksUpdated = 0;

    for (const recurring of (recurringTasks || [])) {
      try {
        // Buscar tarefa template
        const { data: template, error: templateError } = await supabase
          .from('tarefas')
          .select('titulo, descricao, prioridade, horario_conclusao')
          .eq('id', recurring.tarefa_template_id)
          .single();

        if (templateError || !template) {
          console.error(`❌ Template não encontrado para recorrência ${recurring.id}`);
          continue;
        }

        // Verificar se deve criar tarefa hoje
        const deveGerar = await deveGerarTarefaHoje(recurring, hoje);

        if (deveGerar) {
          // Criar nova instância da tarefa
          const dataExecucao = new Date(hoje);
          
          const { data: newTask, error: insertError } = await supabase
            .from('tarefas')
            .insert({
              titulo: template.titulo,
              descricao: template.descricao,
              prioridade: template.prioridade,
              data_conclusao: dataExecucao.toISOString().split('T')[0],
              horario_conclusao: template.horario_conclusao,
              status: 'criada',
              empresa_id: recurring.empresa_id,
              criado_por: recurring.criado_por,
              tarefa_recorrente_id: recurring.id,
            })
            .select()
            .single();

          if (insertError) {
            console.error(`❌ Erro ao criar tarefa para recorrência ${recurring.id}:`, insertError);
            continue;
          }

          console.log(`✅ Tarefa criada: ${newTask.id} - ${template.titulo}`);

          // Copiar responsáveis
          const { data: responsaveis } = await supabase
            .from('tarefas_responsaveis')
            .select('*')
            .eq('tarefa_id', recurring.tarefa_template_id);

          if (responsaveis && responsaveis.length > 0) {
            const newResponsaveis = responsaveis.map(r => ({
              tarefa_id: newTask.id,
              usuario_id: r.usuario_id,
              equipe_id: r.equipe_id,
            }));

            await supabase.from('tarefas_responsaveis').insert(newResponsaveis);
          }

          // Copiar checklists
          const { data: checklists } = await supabase
            .from('tarefas_checklists')
            .select('*, tarefas_checklist_itens(*)')
            .eq('tarefa_id', recurring.tarefa_template_id);

          if (checklists && checklists.length > 0) {
            for (const checklist of checklists) {
              const { data: newChecklist } = await supabase
                .from('tarefas_checklists')
                .insert({
                  tarefa_id: newTask.id,
                  titulo: checklist.titulo,
                })
                .select()
                .single();

              if (newChecklist && checklist.tarefas_checklist_itens) {
                const newItems = checklist.tarefas_checklist_itens.map((item: any) => ({
                  checklist_id: newChecklist.id,
                  item: item.item,
                  concluido: false,
                }));

                await supabase.from('tarefas_checklist_itens').insert(newItems);
              }
            }
          }

          tasksCreated++;
        }

        // Calcular próxima execução
        const { data: proximaExecucao } = await supabase.rpc('calcular_proxima_execucao', {
          p_frequencia: recurring.frequencia,
          p_intervalo: recurring.intervalo,
          p_dias_semana: recurring.dias_semana,
          p_dia_mes: recurring.dia_mes,
          p_data_inicio: recurring.data_inicio,
          p_data_fim: recurring.data_fim,
          p_ultima_execucao: deveGerar ? hoje.toISOString() : recurring.proxima_execucao,
        });

        // Atualizar próxima execução
        await supabase
          .from('tarefas_recorrentes')
          .update({ 
            proxima_execucao: proximaExecucao,
            ativo: proximaExecucao !== null // Desativa se não há próxima execução
          })
          .eq('id', recurring.id);

        tasksUpdated++;

      } catch (error) {
        console.error(`❌ Erro ao processar recorrência ${recurring.id}:`, error);
      }
    }

    const result = {
      success: true,
      tasksCreated,
      tasksUpdated,
      processedAt: new Date().toISOString(),
    };

    console.log('✅ Processamento concluído:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function deveGerarTarefaHoje(recurring: RecurringTask, hoje: Date): Promise<boolean> {
  const diaAtual = hoje.getDay(); // 0 = domingo, 6 = sábado
  const diaDoMes = hoje.getDate();

  switch (recurring.frequencia) {
    case 'diaria':
      return true; // Sempre gera em dias ativos

    case 'semanal':
      return recurring.dias_semana ? recurring.dias_semana.includes(diaAtual) : false;

    case 'mensal':
      return recurring.dia_mes === diaDoMes;

    case 'anual':
      const dataInicio = new Date(recurring.data_inicio);
      return dataInicio.getDate() === diaDoMes && dataInicio.getMonth() === hoje.getMonth();

    default:
      return false;
  }
}
