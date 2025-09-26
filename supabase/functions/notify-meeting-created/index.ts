import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reuniao, participantes, empresa, criador } = await req.json();
    
    console.log('Reunião criada:', {
      reuniao_id: reuniao.id,
      titulo: reuniao.titulo,
      data: reuniao.data_reuniao,
      horario: reuniao.horario_inicio
    });

    // Buscar dados completos dos usuários participantes
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.58.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    interface Usuario {
      id: string;
      nome: string;
      celular: string;
    }

    let usuariosCompletos: Usuario[] = [];
    if (participantes.usuarios && participantes.usuarios.length > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome, celular')
        .in('id', participantes.usuarios);
      
      usuariosCompletos = usuarios || [];
    }

    // Obter URL do webhook N8N
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL não configurado');
      return new Response(
        JSON.stringify({ error: 'Webhook URL não configurado' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Preparar dados para envio
    const webhookData = {
      tipo: 'reuniao_criada',
      reuniao: {
        id: reuniao.id,
        titulo: reuniao.titulo,
        descricao: reuniao.descricao,
        data_reuniao: reuniao.data_reuniao,
        horario_inicio: reuniao.horario_inicio,
        duracao_minutos: reuniao.duracao_minutos,
        link_reuniao: reuniao.link_reuniao,
        created_at: reuniao.created_at
      },
      participantes: {
        usuarios: usuariosCompletos.map(user => ({
          id: user.id,
          nome: user.nome,
          celular: user.celular
        })),
        equipes: participantes.equipes || []
      },
      empresa: {
        id: empresa.id,
        nome: empresa.nome
      },
      criador: {
        id: criador.id,
        nome: criador.nome
      },
      timestamp: new Date().toISOString()
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