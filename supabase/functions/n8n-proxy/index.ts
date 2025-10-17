import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Modo N8N (compatibilidade com código antigo)
    if (requestBody.webhookUrl) {
      const { webhookUrl, data } = requestBody;
      
      console.log('📡 N8N Proxy - URL:', webhookUrl);
      console.log('📤 N8N Proxy - Dados:', data);

      const n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📥 N8N Response - Status:', n8nResponse.status);
      
      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.log('❌ N8N Error Response:', errorText);
        
        return new Response(
          JSON.stringify({ 
            error: `N8N webhook failed: ${n8nResponse.status}`,
            details: errorText 
          }),
          { 
            status: n8nResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const responseData = await n8nResponse.json();
      console.log('✅ N8N Success Response:', responseData);

      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Modo HTTP Genérico (novo)
    const { url, method = 'GET', headers = {}, body } = requestBody;

    console.log('🌐 HTTP Proxy - URL:', url);
    console.log('📋 HTTP Proxy - Método:', method);
    console.log('📤 HTTP Proxy - Body:', body);

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'url ou webhookUrl é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar opções da requisição
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // Adicionar body se não for GET ou HEAD
    if (body && !['GET', 'HEAD'].includes(method.toUpperCase())) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Fazer requisição HTTP
    const n8nResponse = await fetch(url, fetchOptions);

    console.log('📥 N8N Response - Status:', n8nResponse.status);
    
    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.log('❌ N8N Error Response:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: `N8N webhook failed: ${n8nResponse.status}`,
          details: errorText 
        }),
        { 
          status: n8nResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseData = await n8nResponse.json();
    console.log('✅ N8N Success Response:', responseData);

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ N8N Proxy Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'proxy_error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});