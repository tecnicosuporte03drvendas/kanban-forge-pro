import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompanyDeleteData {
  empresaId: string;
  deletedBy: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { empresaId, deletedBy }: CompanyDeleteData = await req.json();
    
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

    // Usar URL configurada ou fallback para variável de ambiente
    const webhookUrl = config?.valor || Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('N8N webhook URL not configured');
      return new Response('Webhook URL not configured', { status: 500 });
    }

    if (!empresaId || !deletedBy) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: empresaId, deletedBy' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Received company deletion request for empresaId:`, empresaId);

    // Fetch company data BEFORE deletion
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

    // Fetch company owner (proprietário) - pegar primeiro proprietário ativo
    const { data: ownerData, error: ownerError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('tipo_usuario', 'proprietario')
      .eq('ativo', true)
      .limit(1)
      .maybeSingle();

    if (ownerError) {
      console.warn('No owner found for company:', ownerError);
    }

    console.log('Owner data fetched:', ownerData);

    // Fetch Evolution instance data
    const { data: evolutionInstance, error: evolutionError } = await supabase
      .from('instancias_whatsapp')
      .select('nome, telefone, status, webhook_url')
      .single();

    if (evolutionError) {
      console.error('Error fetching Evolution instance:', evolutionError);
    }

    // Count affected users
    const { data: usersCount } = await supabase
      .from('usuarios')
      .select('id')
      .eq('empresa_id', empresaId);

    // Count affected tasks
    const { data: tasksCount } = await supabase
      .from('tarefas')
      .select('id')
      .eq('empresa_id', empresaId);

    // Count affected teams
    const { data: teamsCount } = await supabase
      .from('equipes')
      .select('id')
      .eq('empresa_id', empresaId);

    // Prepare notification data
    const notificationData = {
      event: 'company_deleted',
      timestamp: new Date().toISOString(),
      deleted_by: deletedBy,
      empresa: {
        id: companyData.id,
        nome_fantasia: companyData.nome_fantasia,
        razao_social: companyData.razao_social,
        cnpj: companyData.cnpj,
        created_at: companyData.created_at,
        deleted_at: new Date().toISOString()
      },
      proprietario: ownerData ? {
        id: ownerData.id,
        nome: ownerData.nome,
        email: ownerData.email,
        celular: ownerData.celular,
        funcao_empresa: ownerData.funcao_empresa
      } : null,
      metadata: {
        total_users_deleted: usersCount?.length || 0,
        total_tasks_deleted: tasksCount?.length || 0,
        total_teams_deleted: teamsCount?.length || 0,
        notification_sent_at: new Date().toISOString()
      },
      ...(evolutionInstance && {
        evolution_instance: {
          nome: evolutionInstance.nome,
          telefone: evolutionInstance.telefone,
          status: evolutionInstance.status,
          webhook_url: evolutionInstance.webhook_url
        }
      })
    };

    console.log(`Sending company deletion notification to n8n:`, JSON.stringify(notificationData, null, 2));

    // Send to n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    const webhookResult = await webhookResponse.text();

    if (!webhookResponse.ok) {
      console.error('Failed to send webhook:', webhookResponse.status, webhookResponse.statusText);
      console.error('Webhook error response:', webhookResult);
      
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

    console.log('Webhook sent successfully:', webhookResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Company deletion notification sent successfully',
        webhook_response: webhookResult 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in notify-company-deleted function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
