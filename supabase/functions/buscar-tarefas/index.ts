import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestBody = await req.json();
    const { 
      usuario_id, 
      tipo_usuario, 
      titulo, 
      status, 
      tipo_tarefa, 
      prioridade, 
      data_conclusao,
      incluir_empresa = false,
      incluir_equipes = false,
      incluir_usuarios = false
    } = requestBody;

    console.log('📋 Buscar Tarefas - Parâmetros:', { 
      usuario_id, 
      tipo_usuario, 
      titulo, 
      status, 
      tipo_tarefa, 
      prioridade, 
      data_conclusao,
      incluir_empresa,
      incluir_equipes,
      incluir_usuarios
    });

    // Validar parâmetros obrigatórios
    if (!usuario_id || !tipo_usuario) {
      return new Response(
        JSON.stringify({ 
          error: 'usuario_id e tipo_usuario são obrigatórios',
          code: 'MISSING_PARAMS'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar tipo_usuario
    const tiposValidos = ['colaborador', 'gestor', 'proprietario', 'master'];
    if (!tiposValidos.includes(tipo_usuario)) {
      return new Response(
        JSON.stringify({ 
          error: 'tipo_usuario deve ser: colaborador, gestor, proprietario ou master',
          code: 'INVALID_TIPO_USUARIO'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do usuário
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, nome, email, celular, tipo_usuario, empresa_id, ativo')
      .eq('id', usuario_id)
      .eq('ativo', true)
      .single();

    if (usuarioError || !usuario) {
      console.error('❌ Usuário não encontrado:', usuarioError);
      return new Response(
        JSON.stringify({ 
          error: 'Usuário não encontrado ou inativo',
          code: 'USER_NOT_FOUND'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Usuário encontrado:', usuario.nome);

    // Buscar equipes do usuário
    const { data: equipesUsuario } = await supabase
      .from('usuarios_equipes')
      .select('equipe_id')
      .eq('usuario_id', usuario_id);

    const equipesIds = equipesUsuario?.map(e => e.equipe_id) || [];
    console.log('👥 Equipes do usuário:', equipesIds.length);

    // Montar query de tarefas baseado no tipo de usuário
    let tarefasQuery;

    if (tipo_usuario === 'colaborador') {
      // COLABORADOR: Só vê tarefas profissionais onde é responsável + suas pessoais
      
      // Primeiro buscar IDs das tarefas onde é responsável
      const { data: responsavelData } = await supabase
        .from('tarefas_responsaveis')
        .select('tarefa_id')
        .or(`usuario_id.eq.${usuario_id},equipe_id.in.(${equipesIds.join(',')})`);

      const tarefasResponsavelIds = responsavelData?.map(r => r.tarefa_id) || [];

      if (tarefasResponsavelIds.length === 0) {
        // Só tem tarefas pessoais
        tarefasQuery = supabase
          .from('tarefas')
          .select(`
            *,
            responsaveis:tarefas_responsaveis(id, usuario_id, equipe_id),
            checklists:tarefas_checklists(
              id, titulo, created_at, updated_at,
              itens:tarefas_checklist_itens(id, item, concluido, created_at, updated_at)
            ),
            comentarios:tarefas_comentarios(id, comentario, usuario_id, created_at),
            tempo_sessoes:tarefas_tempo_sessoes(id, inicio, fim, minutos_trabalhados, usuario_id, created_at)
          `)
          .eq('arquivada', false)
          .eq('tipo_tarefa', 'pessoal')
          .eq('criado_por', usuario_id);
      } else {
        tarefasQuery = supabase
          .from('tarefas')
          .select(`
            *,
            responsaveis:tarefas_responsaveis(id, usuario_id, equipe_id),
            checklists:tarefas_checklists(
              id, titulo, created_at, updated_at,
              itens:tarefas_checklist_itens(id, item, concluido, created_at, updated_at)
            ),
            comentarios:tarefas_comentarios(id, comentario, usuario_id, created_at),
            tempo_sessoes:tarefas_tempo_sessoes(id, inicio, fim, minutos_trabalhados, usuario_id, created_at)
          `)
          .eq('arquivada', false)
          .or(`and(tipo_tarefa.eq.profissional,id.in.(${tarefasResponsavelIds.join(',')})),and(tipo_tarefa.eq.pessoal,criado_por.eq.${usuario_id})`);
      }
    } else {
      // GESTOR/PROPRIETÁRIO/MASTER: Vê todas profissionais da empresa + suas pessoais
      tarefasQuery = supabase
        .from('tarefas')
        .select(`
          *,
          responsaveis:tarefas_responsaveis(id, usuario_id, equipe_id),
          checklists:tarefas_checklists(
            id, titulo, created_at, updated_at,
            itens:tarefas_checklist_itens(id, item, concluido, created_at, updated_at)
          ),
          comentarios:tarefas_comentarios(id, comentario, usuario_id, created_at),
          tempo_sessoes:tarefas_tempo_sessoes(id, inicio, fim, minutos_trabalhados, usuario_id, created_at)
        `)
        .eq('arquivada', false)
        .eq('empresa_id', usuario.empresa_id)
        .or(`tipo_tarefa.eq.profissional,and(tipo_tarefa.eq.pessoal,criado_por.eq.${usuario_id})`);
    }

    // Aplicar filtros opcionais
    if (titulo) {
      tarefasQuery = tarefasQuery.ilike('titulo', `%${titulo}%`);
    }
    if (status) {
      tarefasQuery = tarefasQuery.eq('status', status);
    }
    if (tipo_tarefa) {
      tarefasQuery = tarefasQuery.eq('tipo_tarefa', tipo_tarefa);
    }
    if (prioridade) {
      tarefasQuery = tarefasQuery.eq('prioridade', prioridade);
    }
    if (data_conclusao) {
      tarefasQuery = tarefasQuery.eq('data_conclusao', data_conclusao);
    }

    const { data: tarefas, error: tarefasError } = await tarefasQuery;

    if (tarefasError) {
      console.error('❌ Erro ao buscar tarefas:', tarefasError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar tarefas',
          details: tarefasError,
          code: 'INTERNAL_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Tarefas encontradas:', tarefas?.length || 0);

    // Enriquecer dados com nomes de usuários
    const usuariosIds = new Set<string>();
    tarefas?.forEach(t => {
      if (t.criado_por) usuariosIds.add(t.criado_por);
      t.comentarios?.forEach((c: any) => usuariosIds.add(c.usuario_id));
      t.tempo_sessoes?.forEach((s: any) => usuariosIds.add(s.usuario_id));
    });

    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .in('id', Array.from(usuariosIds));

    const usuariosMap = Object.fromEntries(usuarios?.map(u => [u.id, u]) || []);

    // Adicionar nomes aos dados
    const tarefasEnriquecidas = tarefas?.map(t => ({
      ...t,
      criado_por_nome: usuariosMap[t.criado_por]?.nome || 'Desconhecido',
      comentarios: t.comentarios?.map((c: any) => ({
        ...c,
        usuario_nome: usuariosMap[c.usuario_id]?.nome || 'Desconhecido',
        usuario_email: usuariosMap[c.usuario_id]?.email || ''
      })),
      tempo_sessoes: t.tempo_sessoes?.map((s: any) => ({
        ...s,
        usuario_nome: usuariosMap[s.usuario_id]?.nome || 'Desconhecido'
      }))
    }));

    // Montar resposta base
    const response: any = {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        celular: usuario.celular,
        tipo_usuario: usuario.tipo_usuario,
        empresa_id: usuario.empresa_id
      },
      permissoes: {
        pode_ver_todas_profissionais: tipo_usuario !== 'colaborador',
        pode_acessar_dados_empresa: tipo_usuario !== 'colaborador'
      },
      total_tarefas: tarefasEnriquecidas?.length || 0,
      tarefas: tarefasEnriquecidas || []
    };

    // Para GESTOR/PROPRIETÁRIO/MASTER: adicionar dados da empresa (sob demanda)
    if (tipo_usuario !== 'colaborador') {
      const dadosExtras: string[] = [];

      // Buscar dados da empresa (apenas se solicitado)
      if (incluir_empresa) {
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id, razao_social, nome_fantasia, cnpj, ativa')
          .eq('id', usuario.empresa_id)
          .single();
        response.empresa = empresa;
        dadosExtras.push('empresa');
      }

      // Buscar equipes da empresa (apenas se solicitado)
      if (incluir_equipes) {
        const { data: equipes } = await supabase
          .from('equipes')
          .select('id, nome, descricao, criado_por, created_at')
          .eq('empresa_id', usuario.empresa_id);
        response.equipes = equipes || [];
        dadosExtras.push(`${equipes?.length || 0} equipes`);
      }

      // Buscar todos os usuários da empresa (apenas se solicitado)
      if (incluir_usuarios) {
        const { data: todosUsuarios } = await supabase
          .from('usuarios')
          .select('id, nome, email, celular, funcao_empresa, tipo_usuario, ativo')
          .eq('empresa_id', usuario.empresa_id)
          .eq('ativo', true);
        response.usuarios_empresa = todosUsuarios || [];
        dadosExtras.push(`${todosUsuarios?.length || 0} usuários`);
      }

      if (dadosExtras.length > 0) {
        console.log('✅ Dados extras incluídos:', dadosExtras.join(', '));
      }
    }

    console.log('✅ Resposta montada com sucesso');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
