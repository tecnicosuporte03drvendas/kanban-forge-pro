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
    const { celular, titulo } = await req.json();

    console.log('🔍 Buscando tarefa:', { celular, titulo });

    if (!celular || !titulo) {
      return new Response(
        JSON.stringify({ error: 'Celular e título da tarefa são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar usuário pelo celular (pega o primeiro ativo encontrado)
    const { data: usuarios, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, nome, email, celular')
      .eq('celular', celular)
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (usuarioError || !usuarios || usuarios.length === 0) {
      console.log('❌ Usuário não encontrado:', usuarioError);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const usuario = usuarios[0];

    console.log('✅ Usuário encontrado:', usuario.nome);

    // 2. Buscar equipes do usuário
    const { data: equipes } = await supabase
      .from('usuarios_equipes')
      .select('equipe_id')
      .eq('usuario_id', usuario.id);

    const equipesIds = equipes?.map(e => e.equipe_id) || [];
    console.log('👥 Equipes do usuário:', equipesIds.length);

    // 3. Buscar tarefa pelo título (case insensitive)
    const { data: tarefasCandidatas, error: tarefasError } = await supabase
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
          created_at,
          updated_at,
          itens:tarefas_checklist_itens(
            id,
            item,
            concluido,
            created_at,
            updated_at
          )
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
        ),
        tempo_sessoes:tarefas_tempo_sessoes(
          id,
          inicio,
          fim,
          minutos_trabalhados,
          usuario_id,
          created_at
        )
      `)
      .ilike('titulo', `%${titulo}%`)
      .eq('arquivada', false);

    if (tarefasError) {
      console.log('❌ Erro ao buscar tarefas:', tarefasError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar tarefa', details: tarefasError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tarefasCandidatas || tarefasCandidatas.length === 0) {
      console.log('❌ Nenhuma tarefa encontrada com esse título');
      return new Response(
        JSON.stringify({ error: 'Tarefa não encontrada com esse título' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Filtrar tarefas onde o usuário é responsável
    const tarefaEncontrada = tarefasCandidatas.find(tarefa => {
      const responsaveis = tarefa.responsaveis || [];
      
      // Verificar se usuário é responsável direto
      const isResponsavelDireto = responsaveis.some(
        (r: any) => r.usuario_id === usuario.id
      );
      
      // Verificar se alguma equipe do usuário é responsável
      const isResponsavelEquipe = responsaveis.some(
        (r: any) => r.equipe_id && equipesIds.includes(r.equipe_id)
      );
      
      return isResponsavelDireto || isResponsavelEquipe;
    });

    if (!tarefaEncontrada) {
      console.log('❌ Usuário não é responsável por nenhuma tarefa com esse título');
      return new Response(
        JSON.stringify({ error: 'Tarefa não encontrada ou você não é responsável por ela' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Tarefa encontrada:', tarefaEncontrada.titulo);

    // 5. Buscar informações dos usuários mencionados (comentários, atividades, etc)
    const usuariosIds = new Set<string>();
    
    tarefaEncontrada.comentarios?.forEach((c: any) => {
      if (c.usuario_id) usuariosIds.add(c.usuario_id);
    });
    
    tarefaEncontrada.atividades?.forEach((a: any) => {
      if (a.usuario_id) usuariosIds.add(a.usuario_id);
    });

    if (tarefaEncontrada.criado_por) {
      usuariosIds.add(tarefaEncontrada.criado_por);
    }

    // Buscar nomes dos usuários
    let usuariosMap: { [key: string]: string } = {};
    if (usuariosIds.size > 0) {
      const { data: usuariosData } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', Array.from(usuariosIds));

      usuariosData?.forEach(u => {
        usuariosMap[u.id] = u.nome;
      });
    }

    // Adicionar nomes aos comentários, atividades e anexos
    const tarefaCompleta = {
      ...tarefaEncontrada,
      criado_por_nome: usuariosMap[tarefaEncontrada.criado_por] || 'Desconhecido',
      comentarios: tarefaEncontrada.comentarios?.map((c: any) => ({
        ...c,
        usuario_nome: usuariosMap[c.usuario_id] || 'Desconhecido'
      })),
      atividades: tarefaEncontrada.atividades?.map((a: any) => ({
        ...a,
        usuario_nome: usuariosMap[a.usuario_id] || 'Desconhecido'
      }))
    };

    return new Response(
      JSON.stringify({
        usuario: {
          nome: usuario.nome,
          email: usuario.email,
          celular: usuario.celular
        },
        tarefa: tarefaCompleta
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro ao buscar tarefa:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'function_error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
