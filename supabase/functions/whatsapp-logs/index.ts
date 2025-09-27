import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface LogRequestBody {
  acao?: string;
  instancia_id?: string;
  status?: string;
  qr_code?: string;
  dados_retorno?: any;
  dados_entrada?: any;
  sucesso?: boolean;
  mensagem_erro?: string;
  error?: string;
  origem?: string;
}

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

    // Check if request has content
    const contentType = req.headers.get('content-type');
    console.log('📋 Content-Type recebido:', contentType);

    let body: LogRequestBody = {};
    
    // Try to parse JSON body if content exists
    try {
      const textBody = await req.text();
      console.log('📄 Body raw recebido:', textBody);
      
      if (textBody && textBody.trim() !== '') {
        body = JSON.parse(textBody) as LogRequestBody;
        console.log('📨 Log recebido do N8n:', JSON.stringify(body, null, 2));
      } else {
        console.log('⚠️ Body vazio recebido, usando objeto padrão');
        body = { acao: 'ping', origem: 'n8n-test' };
      }
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Erro desconhecido';
      return new Response(
        JSON.stringify({ 
          error: 'JSON inválido no body da requisição',
          details: errorMessage
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

    // Processar dados de retorno para resposta
    const evolutionData = body.dados_retorno || body;
    let qrCodeProcessado = null;
    let statusProcessado = body.status || 'conectando';

    // Verificar se é resposta da Evolution API com estrutura específica
    if (evolutionData.success && evolutionData.data) {
      // Extrair QR code da estrutura Evolution: data.base64
      if (evolutionData.data.base64) {
        qrCodeProcessado = evolutionData.data.base64; // Já vem formatado
        console.log('📱 QR Code extraído da Evolution API');
      }
      
      // Status baseado no success: se true = conectada, se tem QR = conectando, senão desconectada
      if (evolutionData.success === true) {
        statusProcessado = 'conectada';
        console.log('✅ Status definido como conectada (success = true)');
      } else {
        statusProcessado = evolutionData.data.base64 ? 'conectando' : 'desconectada';
      }
    }
    // Verificar se o QR code está no próprio evolutionData (caso seja a string base64 direta)
    else if (typeof evolutionData === 'string' && evolutionData.startsWith('data:image/png;base64,')) {
      qrCodeProcessado = evolutionData;
      console.log('📱 QR Code extraído diretamente dos dados');
      statusProcessado = 'conectando';
    } else {
      // Processar outros formatos (fallback)
      const qrCode = body.qr_code || 
                    evolutionData.qrCode || 
                    evolutionData.qr_code || 
                    evolutionData.base64 ||
                    evolutionData.instance?.qr ||
                    evolutionData.instance?.qrcode;
                    
      if (qrCode) {
        qrCodeProcessado = qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`;
        console.log('📱 QR Code processado (formato alternativo)');
      }
      
      statusProcessado = body.status || evolutionData.status || evolutionData.instance?.state || 'conectando';
    }

    // Se os dados contém informações da instância, tentar atualizar também
    if (instancia_id) {
      const updateData: any = {};
      
      // Atualizar status se disponível
      if (statusProcessado) {
        updateData.status = statusProcessado;
      }
                     
      if (qrCodeProcessado) {
        updateData.qr_code = qrCodeProcessado;
      }
      
      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString();
        
        console.log('🔄 Atualizando instância com dados completos:', instancia_id, {
          ...updateData,
          qr_code: updateData.qr_code ? '[QR_CODE_DATA]' : 'null'
        });
        
        const { error: updateError } = await supabase
          .from('instancias_whatsapp')
          .update(updateData)
          .eq('id', instancia_id);
        
        if (updateError) {
          console.error('⚠️ Erro ao atualizar instância:', updateError);
        } else {
          console.log('✅ Instância atualizada com sucesso');
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Log registrado com sucesso',
        log_id: data.id,
        // Retornar os dados recebidos para o N8n usar
        dados_processados: {
          instancia_id: instancia_id,
          acao: acao,
          status: statusProcessado,
          qr_code: qrCodeProcessado,
          dados_completos: evolutionData
        }
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