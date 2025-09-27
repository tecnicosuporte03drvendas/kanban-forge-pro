-- Criar tabela para logs de instâncias WhatsApp
CREATE TABLE public.instancias_whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instancia_id UUID,
  acao TEXT NOT NULL,
  status TEXT,
  dados_retorno JSONB,
  dados_entrada JSONB,
  sucesso BOOLEAN DEFAULT true,
  mensagem_erro TEXT,
  origem TEXT DEFAULT 'n8n',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instancias_whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for logs management
CREATE POLICY "Allow logs management" 
ON public.instancias_whatsapp_logs 
FOR ALL 
USING (true);

-- Create index for better performance
CREATE INDEX idx_instancias_logs_created_at ON public.instancias_whatsapp_logs(created_at DESC);
CREATE INDEX idx_instancias_logs_instancia_id ON public.instancias_whatsapp_logs(instancia_id);
CREATE INDEX idx_instancias_logs_acao ON public.instancias_whatsapp_logs(acao);