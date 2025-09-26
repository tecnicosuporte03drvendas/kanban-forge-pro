-- Add arquivada column to tarefas table
ALTER TABLE public.tarefas 
ADD COLUMN arquivada boolean NOT NULL DEFAULT false;