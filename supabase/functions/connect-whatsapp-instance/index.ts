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
    const { instanceId, webhookUrl } = await req.json();

    console.log('Connecting WhatsApp instance:', { instanceId, webhookUrl });

    if (!instanceId || !webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'instanceId e webhookUrl são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar instância no banco
    const { data: instancia, error: fetchError } = await supabase
      .from('instancias_whatsapp')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchError || !instancia) {
      throw new Error('Instância não encontrada');
    }

    // Chamar webhook do N8N para conectar instância
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'connect_instance',
        instanceId: instancia.id,
        nome: instancia.nome,
        telefone: instancia.telefone,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`N8N webhook failed: ${n8nResponse.status}`);
    }

    const n8nData = await n8nResponse.json();
    console.log('N8N response:', n8nData);

    // Atualizar status e QR code no banco
    const updateData: any = {
      status: n8nData.status || 'conectando',
    };

    if (n8nData.qrCode) {
      updateData.qr_code = n8nData.qrCode;
    }

    const { data: updatedInstance, error: updateError } = await supabase
      .from('instancias_whatsapp')
      .update(updateData)
      .eq('id', instanceId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Erro ao atualizar no banco: ${updateError.message}`);
    }

    console.log('Instance updated successfully:', updatedInstance);

    return new Response(
      JSON.stringify({
        status: updatedInstance.status,
        qrCode: updatedInstance.qr_code,
        instance: updatedInstance
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in connect-whatsapp-instance function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});