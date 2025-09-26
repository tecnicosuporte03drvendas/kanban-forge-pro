-- Create table for task attachments
CREATE TABLE public.tarefas_anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarefa_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('imagem', 'link')),
  url TEXT NOT NULL,
  nome TEXT NOT NULL,
  tamanho BIGINT,
  usuario_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tarefas_anexos ENABLE ROW LEVEL SECURITY;

-- Create policies for task attachments
CREATE POLICY "Users can view task attachments"
ON public.tarefas_anexos
FOR SELECT
USING (true);

CREATE POLICY "Users can create task attachments"
ON public.tarefas_anexos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete task attachments"
ON public.tarefas_anexos
FOR DELETE
USING (true);

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task-attachments', 'task-attachments', true);

-- Create storage policies for task attachments
CREATE POLICY "Users can upload task attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Users can view task attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'task-attachments');

CREATE POLICY "Users can delete task attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'task-attachments');