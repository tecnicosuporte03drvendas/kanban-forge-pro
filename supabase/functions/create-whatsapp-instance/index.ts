import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, telefone, webhookUrl } = await req.json();

    console.log('Creating WhatsApp instance:', { nome, telefone, webhookUrl });

    if (!nome || !telefone || !webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Nome, telefone e webhookUrl são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Chamar webhook do N8N para criar instância
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_instance',
        nome,
        telefone,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`N8N webhook failed: ${n8nResponse.status}`);
    }

    const n8nData = await n8nResponse.json();
    console.log('N8N response:', n8nData);

    // Salvar instância no banco
    const { data: instancia, error: dbError } = await supabase
      .from('instancias_whatsapp')
      .insert({
        nome,
        telefone,
        status: 'desconectada',
        webhook_url: webhookUrl,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
    }

    console.log('Instance created successfully:', instancia);

    return new Response(
      JSON.stringify(instancia),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in create-whatsapp-instance function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});