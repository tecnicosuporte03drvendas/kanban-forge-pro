import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MensagemInput {
  numero_usuario: string;
  remetente: string;
  destinatario: string;
  de_mim: boolean;
  conteudo_mensagem: string;
  tipo_mensagem?: string;
  message_id?: string;
  push_name?: string;
  status?: string;
  respondida_por_ia?: boolean;
  intencao_detectada?: string;
  ferramenta_usada?: string;
  dados_completos?: any;
  instancia_id?: string;
}

interface RequestBody {
  mensagem: MensagemInput;
  limite_historico?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RequestBody = await req.json();
    const { mensagem, limite_historico = 10 } = body;

    if (!mensagem || !mensagem.numero_usuario) {
      return new Response(
        JSON.stringify({ error: 'Número do usuário é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${new Date().toISOString()}] Processando mensagem de ${mensagem.numero_usuario}`);

    // 1. Buscar ou criar sessão ativa
    const { data: conversaAtiva, error: conversaError } = await supabase
      .from('whatsapp_conversas')
      .select('*')
      .eq('numero_usuario', mensagem.numero_usuario)
      .eq('ativa', true)
      .order('sessao_iniciada_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conversaError && conversaError.code !== 'PGRST116') {
      console.error('Erro ao buscar conversa ativa:', conversaError);
      throw conversaError;
    }

    let conversaId: string;

    if (conversaAtiva) {
      conversaId = conversaAtiva.id;
      console.log(`Sessão ativa encontrada: ${conversaId}`);
    } else {
      // Criar nova sessão
      const { data: novaConversa, error: criarError } = await supabase
        .from('whatsapp_conversas')
        .insert({
          numero_usuario: mensagem.numero_usuario,
          instancia_id: mensagem.instancia_id || null,
          push_name: mensagem.push_name || null,
          ativa: true,
          sessao_iniciada_em: new Date().toISOString(),
        })
        .select()
        .single();

      if (criarError) {
        console.error('Erro ao criar nova conversa:', criarError);
        throw criarError;
      }

      conversaId = novaConversa.id;
      console.log(`Nova sessão criada: ${conversaId}`);
    }

    // 2. Salvar a mensagem
    const { data: mensagemSalva, error: mensagemError } = await supabase
      .from('whatsapp_mensagens')
      .insert({
        conversa_id: conversaId,
        numero_usuario: mensagem.numero_usuario,
        remetente: mensagem.remetente,
        destinatario: mensagem.destinatario,
        de_mim: mensagem.de_mim,
        conteudo_mensagem: mensagem.conteudo_mensagem,
        tipo_mensagem: mensagem.tipo_mensagem || 'conversation',
        message_id: mensagem.message_id || null,
        push_name: mensagem.push_name || null,
        status: mensagem.status || null,
        respondida_por_ia: mensagem.respondida_por_ia || false,
        intencao_detectada: mensagem.intencao_detectada || null,
        ferramenta_usada: mensagem.ferramenta_usada || null,
        dados_completos: mensagem.dados_completos || null,
        horario: new Date().toISOString(),
      })
      .select()
      .single();

    if (mensagemError) {
      console.error('Erro ao salvar mensagem:', mensagemError);
      throw mensagemError;
    }

    console.log(`Mensagem salva: ${mensagemSalva.id}`);

    // 3. Buscar histórico das últimas N mensagens
    const { data: historico, error: historicoError } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .eq('conversa_id', conversaId)
      .order('horario', { ascending: false })
      .limit(limite_historico);

    if (historicoError) {
      console.error('Erro ao buscar histórico:', historicoError);
      throw historicoError;
    }

    // Inverter ordem para ficar cronológico (mais antiga -> mais recente)
    const historicoOrdenado = historico.reverse();

    // 4. Verificar se deve encerrar a sessão (opcional, por timeout)
    // Isso pode ser feito via cron job separado chamando encerrar_conversas_inativas()

    return new Response(
      JSON.stringify({
        sucesso: true,
        conversa_id: conversaId,
        mensagem_id: mensagemSalva.id,
        historico: historicoOrdenado,
        total_mensagens_historico: historico.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro na função gerenciar-conversa-whatsapp:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro desconhecido',
        details: error,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});