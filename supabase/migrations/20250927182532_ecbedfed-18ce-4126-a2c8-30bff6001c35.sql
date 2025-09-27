-- Criar tabela de configurações do sistema
CREATE TABLE public.configuracoes_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de instâncias WhatsApp
CREATE TABLE public.instancias_whatsapp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'desconectada',
  qr_code TEXT,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(nome)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instancias_whatsapp ENABLE ROW LEVEL SECURITY;

-- Política para configurações do sistema (apenas master)
CREATE POLICY "Master users can manage system configs" 
ON public.configuracoes_sistema 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND tipo_usuario = 'master'
  )
);

-- Política para instâncias WhatsApp (apenas master)
CREATE POLICY "Master users can manage whatsapp instances" 
ON public.instancias_whatsapp 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND tipo_usuario = 'master'
  )
);

-- Trigger para atualizar updated_at nas configurações
CREATE TRIGGER update_configuracoes_sistema_updated_at
BEFORE UPDATE ON public.configuracoes_sistema
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at nas instâncias
CREATE TRIGGER update_instancias_whatsapp_updated_at
BEFORE UPDATE ON public.instancias_whatsapp
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();