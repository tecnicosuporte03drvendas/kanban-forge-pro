import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido. Use POST.' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body = await req.json();
    console.log('📨 Log recebido do N8n:', JSON.stringify(body, null, 2));

    // Validar campos obrigatórios
    const { acao, instancia_id } = body;
    if (!acao) {
      return new Response(
        JSON.stringify({ error: 'Campo "acao" é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extrair dados para o log
    const logData = {
      instancia_id: instancia_id || null,
      acao: acao,
      status: body.status || null,
      dados_retorno: body.dados_retorno || body, // Todo o body como dados de retorno se não especificado
      dados_entrada: body.dados_entrada || null,
      sucesso: body.sucesso !== false, // Default para true, a menos que explicitamente false
      mensagem_erro: body.mensagem_erro || body.error || null,
      origem: body.origem || 'n8n'
    };

    console.log('💾 Salvando log:', JSON.stringify(logData, null, 2));

    // Inserir log na tabela
    const { data, error } = await supabase
      .from('instancias_whatsapp_logs')
      .insert(logData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar log:', error);
      throw new Error(`Erro ao salvar log: ${error.message}`);
    }

    console.log('✅ Log salvo com sucesso:', data);

    // Se os dados contém informações da instância, tentar atualizar também
    if (instancia_id && (body.status || body.qr_code || body.dados_retorno?.status || body.dados_retorno?.qrCode)) {
      const updateData: any = {};
      
      // Atualizar status se disponível
      if (body.status || body.dados_retorno?.status) {
        updateData.status = body.status || body.dados_retorno?.status;
      }
      
      // Atualizar QR code se disponível
      if (body.qr_code || body.dados_retorno?.qrCode || body.dados_retorno?.qr_code) {
        updateData.qr_code = body.qr_code || body.dados_retorno?.qrCode || body.dados_retorno?.qr_code;
      }
      
      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString();
        
        console.log('🔄 Atualizando instância:', instancia_id, updateData);
        
        const { error: updateError } = await supabase
          .from('instancias_whatsapp')
          .update(updateData)
          .eq('id', instancia_id);
        
        if (updateError) {
          console.error('⚠️ Erro ao atualizar instância (continuando):', updateError);
        } else {
          console.log('✅ Instância atualizada');
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Log registrado com sucesso',
        log_id: data.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Erro na função whatsapp-logs:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});