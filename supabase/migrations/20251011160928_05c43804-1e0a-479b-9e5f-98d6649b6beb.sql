-- Enable realtime for tasks and related tables
ALTER TABLE public.tarefas REPLICA IDENTITY FULL;
ALTER TABLE public.tarefas_responsaveis REPLICA IDENTITY FULL;
ALTER TABLE public.tarefas_atividades REPLICA IDENTITY FULL;
ALTER TABLE public.tarefas_comentarios REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tarefas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tarefas_responsaveis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tarefas_atividades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tarefas_comentarios;