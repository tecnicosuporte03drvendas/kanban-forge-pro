import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    console.log('📧 Buscando tarefas para email:', email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar usuário pelo email
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('email', email)
      .eq('ativo', true)
      .single();

    if (usuarioError || !usuario) {
      console.log('❌ Usuário não encontrado:', usuarioError);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado', tarefas: [] }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Usuário encontrado:', usuario.nome);

    // 2. Buscar equipes do usuário
    const { data: equipes, error: equipesError } = await supabase
      .from('usuarios_equipes')
      .select('equipe_id')
      .eq('usuario_id', usuario.id);

    const equipesIds = equipes?.map(e => e.equipe_id) || [];
    console.log('👥 Equipes do usuário:', equipesIds.length);

    // 3. Buscar todas as tarefas onde o usuário é responsável (direto ou via equipe)
    const { data: responsaveis, error: responsaveisError } = await supabase
      .from('tarefas_responsaveis')
      .select('tarefa_id')
      .or(`usuario_id.eq.${usuario.id},equipe_id.in.(${equipesIds.join(',')})`);

    if (responsaveisError) {
      console.log('❌ Erro ao buscar responsáveis:', responsaveisError);
    }

    const tarefasIds = [...new Set(responsaveis?.map(r => r.tarefa_id) || [])];
    console.log('📋 Total de tarefas encontradas:', tarefasIds.length);

    if (tarefasIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          usuario: { nome: usuario.nome, email: usuario.email },
          tarefas: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Buscar detalhes completos das tarefas
    const { data: tarefas, error: tarefasError } = await supabase
      .from('tarefas')
      .select(`
        *,
        responsaveis:tarefas_responsaveis(
          usuario_id,
          equipe_id
        ),
        checklists:tarefas_checklists(
          id,
          titulo,
          itens:tarefas_checklist_itens(*)
        ),
        comentarios:tarefas_comentarios(
          id,
          comentario,
          usuario_id,
          created_at
        ),
        atividades:tarefas_atividades(
          id,
          acao,
          descricao,
          usuario_id,
          created_at
        )
      `)
      .in('id', tarefasIds)
      .eq('arquivada', false)
      .order('created_at', { ascending: false });

    if (tarefasError) {
      console.log('❌ Erro ao buscar tarefas:', tarefasError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar tarefas', details: tarefasError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Tarefas carregadas com sucesso');

    return new Response(
      JSON.stringify({
        usuario: {
          nome: usuario.nome,
          email: usuario.email
        },
        total: tarefas?.length || 0,
        tarefas: tarefas || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro ao buscar tarefas:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'function_error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
