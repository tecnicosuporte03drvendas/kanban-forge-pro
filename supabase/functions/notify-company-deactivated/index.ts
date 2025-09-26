import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompanyDeactivatedData {
  empresaId: string;
  deactivatedBy: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = 'https://n8n-tezeus-agenda-n8n.upvzfg.easypanel.host/webhook-test/whatsapp-test';
    
    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook URL not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { empresaId, deactivatedBy }: CompanyDeactivatedData = await req.json();

    if (!empresaId || !deactivatedBy) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: empresaId, deactivatedBy' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Received company deactivation request for empresaId:', empresaId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch company data
    const { data: companyData, error: companyError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (companyError || !companyData) {
      console.error('Error fetching company:', companyError);
      return new Response(
        JSON.stringify({ error: 'Company not found' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Company data fetched:', companyData);

    // Fetch company owner (proprietário)
    const { data: ownerData, error: ownerError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('tipo_usuario', 'proprietario')
      .eq('ativo', true)
      .single();

    if (ownerError) {
      console.warn('No owner found for company:', ownerError);
    }

    console.log('Owner data fetched:', ownerData);

    // Prepare notification data
    const notificationData = {
      event: 'company_deactivated',
      timestamp: new Date().toISOString(),
      deactivated_by: deactivatedBy,
      empresa: {
        id: companyData.id,
        nome_fantasia: companyData.nome_fantasia,
        razao_social: companyData.razao_social,
        cnpj: companyData.cnpj,
        created_at: companyData.created_at,
        deactivated_at: new Date().toISOString()
      },
      proprietario: ownerData ? {
        id: ownerData.id,
        nome: ownerData.nome,
        email: ownerData.email,
        celular: ownerData.celular,
        funcao_empresa: ownerData.funcao_empresa
      } : null,
      metadata: {
        total_users_affected: 0, // Will be updated after counting
        notification_sent_at: new Date().toISOString()
      }
    };

    // Count affected users
    const { data: usersCount } = await supabase
      .from('usuarios')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('ativo', true);

    notificationData.metadata.total_users_affected = usersCount?.length || 0;

    console.log('Sending company deactivation notification to n8n:', JSON.stringify(notificationData, null, 2));

    // Send to n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    if (!webhookResponse.ok) {
      console.error('Failed to send webhook:', webhookResponse.status, webhookResponse.statusText);
      const errorText = await webhookResponse.text();
      console.error('Webhook error response:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send notification', 
          details: `HTTP ${webhookResponse.status}: ${webhookResponse.statusText}` 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const webhookResult = await webhookResponse.text();
    console.log('Webhook sent successfully:', webhookResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Company deactivation notification sent successfully',
        webhook_response: webhookResult 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in notify-company-deactivated function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});