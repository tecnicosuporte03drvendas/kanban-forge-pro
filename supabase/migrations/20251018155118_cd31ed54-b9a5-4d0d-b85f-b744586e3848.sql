-- Criar tabela para armazenar histórico de chat do n8n
CREATE TABLE IF NOT EXISTS public.n8n_chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  key TEXT NOT NULL DEFAULT 'chat_history',
  message JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice para melhorar performance de busca por sessão
CREATE INDEX idx_n8n_chat_history_session ON public.n8n_chat_history(session_id);

-- Criar índice composto para buscar por sessão e chave
CREATE INDEX idx_n8n_chat_history_session_key ON public.n8n_chat_history(session_id, key);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.n8n_chat_history ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso total (já que é usado pelo n8n via service role)
CREATE POLICY "Allow all access to n8n_chat_history" 
ON public.n8n_chat_history 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_n8n_chat_history_updated_at
BEFORE UPDATE ON public.n8n_chat_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();