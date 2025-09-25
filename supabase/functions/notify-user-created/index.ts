import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserData {
  nome: string;
  email: string;
  celular: string;
  funcao_empresa: string;
  tipo_usuario: string;
}

interface EmpresaData {
  nome: string;
  id: string;
}

interface NotificationData {
  action: string;
  timestamp: string;
  user: UserData;
  empresa: EmpresaData;
  created_by: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
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

    const { user, empresa, created_by } = await req.json();

    // Validate required fields
    if (!user || !empresa || !created_by) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user, empresa, created_by' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format celular to remove 55 prefix if present
    let celularFormatted = user.celular;
    if (celularFormatted && celularFormatted.startsWith('55') && celularFormatted.length === 13) {
      celularFormatted = celularFormatted.substring(2);
    }

    // Prepare notification data
    const notificationData: NotificationData = {
      action: 'user_created',
      timestamp: new Date().toISOString(),
      user: {
        nome: user.nome,
        email: user.email,
        celular: celularFormatted,
        funcao_empresa: user.funcao_empresa || '',
        tipo_usuario: user.tipo_usuario
      },
      empresa: {
        nome: empresa.nome,
        id: empresa.id
      },
      created_by
    };

    console.log('Sending notification to n8n:', JSON.stringify(notificationData, null, 2));

    // Send to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Webhook notification failed', 
          details: errorText,
          status: response.status 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await response.text();
    console.log('n8n webhook success:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User creation notification sent successfully',
        webhookResponse: result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in notify-user-created function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});