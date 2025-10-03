import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionData {
  nome: string;
  telefone: string;
  status: string;
  webhook_url?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meeting, participants } = await req.json();
    
    // Criar cliente Supabase para buscar configurações
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Tentar buscar URL configurada
    const { data: config } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'n8n_webhook_mensagens')
      .single();

    // Usar URL configurada ou fallback para a URL padrão
    const webhookUrl = config?.valor || Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('N8N webhook URL not configured');
      return new Response('Webhook URL not configured', { status: 500 });
    }
    
    console.log('Reunião criada:', {
      reuniao_id: meeting.id,
      titulo: meeting.titulo,
      data: meeting.data_reuniao,
      horario: meeting.horario_inicio
    });

    interface Usuario {
      id: string;
      nome: string;
      celular: string;
    }

    // Fetch Evolution instance data
    const { data: evolutionInstance, error: evolutionError } = await supabase
      .from('instancias_whatsapp')
      .select('nome, telefone, status, webhook_url')
      .single();

    if (evolutionError) {
      console.error('Error fetching Evolution instance:', evolutionError);
    }

    let usuariosCompletos: Usuario[] = [];
    if (participants.usuarios && participants.usuarios.length > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome, celular')
        .in('id', participants.usuarios);
      
      usuariosCompletos = usuarios || [];
    }

    // Preparar dados para envio
    const webhookData = {
      tipo: 'reuniao_criada',
      reuniao: {
        id: meeting.id,
        titulo: meeting.titulo,
        descricao: meeting.descricao,
        data_reuniao: meeting.data_reuniao,
        horario_inicio: meeting.horario_inicio,
        duracao_minutos: meeting.duracao_minutos,
        link_reuniao: meeting.link_reuniao,
        created_at: meeting.created_at
      },
      participantes: {
        usuarios: usuariosCompletos.map(user => ({
          id: user.id,
          nome: user.nome,
          celular: user.celular
        })),
        equipes: participants.equipes || []
      },
      timestamp: new Date().toISOString(),
      ...(evolutionInstance && {
        evolution_instance: {
          nome: evolutionInstance.nome,
          telefone: evolutionInstance.telefone,
          status: evolutionInstance.status,
          webhook_url: evolutionInstance.webhook_url
        }
      })
    };

    console.log('Enviando para N8N:', webhookData);

    // Enviar dados para N8N
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao enviar para N8N:', response.status, errorText);
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Resposta do N8N:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Reunião notificada com sucesso',
        webhook_response: result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro na edge function notify-meeting-created:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});