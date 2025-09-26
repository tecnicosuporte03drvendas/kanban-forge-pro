import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserDeletedData {
  userId: string;
  deletedBy: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = 'https://n8n-tezeus-agenda-n8n.upvzfg.easypanel.host/webhook-test/whatsapp-test';
    
    if (!webhookUrl) {
      console.error('Webhook URL not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook URL not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { userId, deletedBy }: UserDeletedData = await req.json();

    if (!userId || !deletedBy) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, deletedBy' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Received user deletion request for userId:', userId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user data before deletion
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User data fetched:', userData);

    // Fetch company data
    const { data: companyData, error: companyError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', userData.empresa_id)
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

    // Count user's tasks
    const { data: userTasks } = await supabase
      .from('tarefas_responsaveis')
      .select('tarefa_id')
      .eq('usuario_id', userId);

    const totalUserTasks = userTasks?.length || 0;

    // Prepare notification data
    const notificationData = {
      event: 'user_deleted',
      timestamp: new Date().toISOString(),
      deleted_by: deletedBy,
      usuario: {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        celular: userData.celular,
        funcao_empresa: userData.funcao_empresa,
        tipo_usuario: userData.tipo_usuario,
        created_at: userData.created_at,
        deleted_at: new Date().toISOString()
      },
      empresa: {
        id: companyData.id,
        nome_fantasia: companyData.nome_fantasia,
        razao_social: companyData.razao_social,
        cnpj: companyData.cnpj
      },
      metadata: {
        total_tasks_assigned: totalUserTasks,
        user_was_active: userData.ativo,
        notification_sent_at: new Date().toISOString()
      }
    };

    console.log('Sending user deletion notification to n8n:', JSON.stringify(notificationData, null, 2));

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
        message: 'User deletion notification sent successfully',
        webhook_response: webhookResult 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in notify-user-deleted function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});