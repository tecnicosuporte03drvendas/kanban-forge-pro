import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskCompletedData {
  taskId: string;
  completedBy: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook URL not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { taskId, completedBy } = await req.json();

    if (!taskId || !completedBy) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: taskId, completedBy' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch complete task data with related information
    const { data: taskData, error: taskError } = await supabase
      .from('tarefas')
      .select(`
        id,
        titulo,
        descricao,
        prioridade,
        data_conclusao,
        horario_conclusao,
        status,
        tempo_inicio,
        tempo_fim,
        tempo_gasto_minutos,
        created_at,
        updated_at,
        criado_por,
        empresa_id,
        empresas!inner(nome_fantasia, razao_social)
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !taskData) {
      console.error('Error fetching task:', taskError);
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch user who completed the task
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id, nome, email, funcao_empresa')
      .eq('id', completedBy)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch task responsibles
    const { data: responsibles } = await supabase
      .from('tarefas_responsaveis')
      .select(`
        usuario_id,
        equipe_id,
        usuarios(nome, email, funcao_empresa),
        equipes(nome, descricao)
      `)
      .eq('tarefa_id', taskId);

    // Fetch recent activities for context
    const { data: activities } = await supabase
      .from('tarefas_atividades')
      .select(`
        acao,
        descricao,
        created_at,
        usuarios(nome)
      `)
      .eq('tarefa_id', taskId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Prepare notification data
    const notificationData = {
      action: 'task_completed',
      timestamp: new Date().toISOString(),
      task: {
        id: taskData.id,
        titulo: taskData.titulo,
        descricao: taskData.descricao,
        prioridade: taskData.prioridade,
        data_conclusao: taskData.data_conclusao,
        horario_conclusao: taskData.horario_conclusao,
        tempo_inicio: taskData.tempo_inicio,
        tempo_fim: taskData.tempo_fim,
        tempo_gasto_minutos: taskData.tempo_gasto_minutos,
        created_at: taskData.created_at,
        updated_at: taskData.updated_at
      },
      completed_by: {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        funcao_empresa: userData.funcao_empresa
      },
      empresa: {
        id: taskData.empresa_id,
        nome_fantasia: taskData.empresas?.[0]?.nome_fantasia,
        razao_social: taskData.empresas?.[0]?.razao_social
      },
      responsibles: responsibles?.map(r => ({
        usuario: r.usuarios?.[0] ? {
          nome: r.usuarios[0].nome,
          email: r.usuarios[0].email,
          funcao_empresa: r.usuarios[0].funcao_empresa
        } : null,
        equipe: r.equipes?.[0] ? {
          nome: r.equipes[0].nome,
          descricao: r.equipes[0].descricao
        } : null
      })) || [],
      recent_activities: activities?.map(a => ({
        acao: a.acao,
        descricao: a.descricao,
        created_at: a.created_at,
        usuario_nome: a.usuarios?.[0]?.nome
      })) || []
    };

    console.log('Sending task completion notification to n8n:', JSON.stringify(notificationData, null, 2));

    // Send to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Webhook notification failed', 
          details: errorText,
          status: response.status 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await response.text();
    console.log('n8n webhook success:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Task completion notification sent successfully',
        webhookResponse: result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in notify-task-completed function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});