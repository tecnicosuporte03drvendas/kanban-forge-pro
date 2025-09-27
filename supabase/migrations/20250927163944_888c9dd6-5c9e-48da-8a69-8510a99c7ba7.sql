-- Create support tickets table
CREATE TABLE public.tickets_suporte (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Geral',
  prioridade TEXT NOT NULL DEFAULT 'Media' CHECK (prioridade IN ('Baixa', 'Media', 'Alta', 'Urgente')),
  status TEXT NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Andamento', 'Aguardando', 'Resolvido', 'Fechado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tickets_suporte ENABLE ROW LEVEL SECURITY;

-- Create policies for support tickets
CREATE POLICY "Users can view company support tickets" 
ON public.tickets_suporte 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create company support tickets" 
ON public.tickets_suporte 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update company support tickets" 
ON public.tickets_suporte 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tickets_suporte_updated_at
BEFORE UPDATE ON public.tickets_suporte
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();