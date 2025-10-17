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
    const { url, method = 'GET', headers = {}, body } = await req.json();

    console.log('🌐 HTTP Proxy - URL:', url);
    console.log('📋 HTTP Proxy - Método:', method);
    console.log('📤 HTTP Proxy - Body:', body);

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL é obrigatória' }),
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
    const response = await fetch(url, fetchOptions);

    console.log('📥 HTTP Response - Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ HTTP Error Response:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: `HTTP request failed: ${response.status}`,
          details: errorText 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseData = await response.json();
    console.log('✅ HTTP Success Response:', responseData);

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ HTTP Proxy Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'proxy_error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
