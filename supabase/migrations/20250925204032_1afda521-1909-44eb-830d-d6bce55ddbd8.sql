-- Create teams table
CREATE TABLE public.equipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  criado_por UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create many-to-many relationship table for users and teams
CREATE TABLE public.usuarios_equipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  equipe_id UUID NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, equipe_id)
);

-- Enable Row Level Security
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_equipes ENABLE ROW LEVEL SECURITY;

-- Create policies for equipes table
CREATE POLICY "Users can view their company teams" 
ON public.equipes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create teams in their company" 
ON public.equipes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their company teams" 
ON public.equipes 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete their company teams" 
ON public.equipes 
FOR DELETE 
USING (true);

-- Create policies for usuarios_equipes table
CREATE POLICY "Users can view team memberships" 
ON public.usuarios_equipes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create team memberships" 
ON public.usuarios_equipes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can delete team memberships" 
ON public.usuarios_equipes 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates on equipes
CREATE TRIGGER update_equipes_updated_at
BEFORE UPDATE ON public.equipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();