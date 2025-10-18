-- Criar tabela de conversas (sessões)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_usuario TEXT NOT NULL,
  instancia_id UUID REFERENCES public.instancias_whatsapp(id) ON DELETE SET NULL,
  sessao_iniciada_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sessao_encerrada_em TIMESTAMP WITH TIME ZONE,
  ativa BOOLEAN NOT NULL DEFAULT true,
  contexto_atual JSONB DEFAULT '{}'::jsonb,
  ultima_mensagem_em TIMESTAMP WITH TIME ZONE,
  total_mensagens INTEGER NOT NULL DEFAULT 0,
  push_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de mensagens individuais
CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES public.whatsapp_conversas(id) ON DELETE CASCADE,
  numero_usuario TEXT NOT NULL,
  remetente TEXT NOT NULL,
  destinatario TEXT NOT NULL,
  de_mim BOOLEAN NOT NULL DEFAULT false,
  conteudo_mensagem TEXT NOT NULL,
  tipo_mensagem TEXT NOT NULL DEFAULT 'conversation',
  horario TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message_id TEXT,
  push_name TEXT,
  status TEXT,
  respondida_por_ia BOOLEAN NOT NULL DEFAULT false,
  intencao_detectada TEXT,
  ferramenta_usada TEXT,
  dados_completos JSONB,
  sender_lid TEXT,
  contexto_mensagem JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_numero_ativa 
  ON public.whatsapp_conversas(numero_usuario, ativa);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_instancia 
  ON public.whatsapp_conversas(instancia_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_ultima_mensagem 
  ON public.whatsapp_conversas(ultima_mensagem_em);

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_conversa 
  ON public.whatsapp_mensagens(conversa_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_message_id 
  ON public.whatsapp_mensagens(message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_horario 
  ON public.whatsapp_mensagens(horario DESC);

-- Função para atualizar updated_at em whatsapp_conversas
CREATE OR REPLACE FUNCTION public.update_whatsapp_conversa_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_whatsapp_conversas_updated_at
  BEFORE UPDATE ON public.whatsapp_conversas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_whatsapp_conversa_updated_at();

-- Função para atualizar última mensagem e total de mensagens na conversa
CREATE OR REPLACE FUNCTION public.update_conversa_ultima_mensagem()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.whatsapp_conversas
  SET 
    ultima_mensagem_em = NEW.horario,
    total_mensagens = total_mensagens + 1,
    updated_at = now()
  WHERE id = NEW.conversa_id;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar conversa quando nova mensagem é inserida
CREATE TRIGGER after_insert_mensagem
  AFTER INSERT ON public.whatsapp_mensagens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversa_ultima_mensagem();

-- Função para encerrar conversas inativas (mais de 30 minutos sem mensagem)
CREATE OR REPLACE FUNCTION public.encerrar_conversas_inativas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversas_encerradas INTEGER;
BEGIN
  UPDATE public.whatsapp_conversas
  SET 
    ativa = false,
    sessao_encerrada_em = now(),
    updated_at = now()
  WHERE 
    ativa = true
    AND ultima_mensagem_em < (now() - INTERVAL '30 minutes');
  
  GET DIAGNOSTICS conversas_encerradas = ROW_COUNT;
  
  RETURN conversas_encerradas;
END;
$$;

-- Habilitar RLS nas tabelas
ALTER TABLE public.whatsapp_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS permissivas para acesso do N8N
CREATE POLICY "Allow all access to whatsapp_conversas"
  ON public.whatsapp_conversas
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to whatsapp_mensagens"
  ON public.whatsapp_mensagens
  FOR ALL
  USING (true)
  WITH CHECK (true);