-- Fix RLS policies for custom authentication system
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create tasks based on role" ON public.tarefas;
DROP POLICY IF EXISTS "Users can view tasks based on type" ON public.tarefas;
DROP POLICY IF EXISTS "Users can update tasks based on type" ON public.tarefas;
DROP POLICY IF EXISTS "Users can delete tasks based on type" ON public.tarefas;

-- Create new policies that work with custom auth (using criado_por field)
-- Allow task creation based on tipo_tarefa and user role
CREATE POLICY "Allow task creation"
ON public.tarefas
FOR INSERT
WITH CHECK (
  -- Personal tasks: anyone can create for themselves
  (tipo_tarefa = 'pessoal') 
  OR 
  -- Professional tasks: only gestor, proprietario, master
  (tipo_tarefa = 'profissional' AND EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = tarefas.criado_por 
    AND usuarios.tipo_usuario IN ('gestor', 'proprietario', 'master')
  ))
);

-- Allow viewing tasks
CREATE POLICY "Allow task viewing"
ON public.tarefas
FOR SELECT
USING (
  -- Personal tasks: only creator can view
  (tipo_tarefa = 'pessoal' AND criado_por IN (
    SELECT id FROM usuarios WHERE ativo = true
  ))
  OR
  -- Professional tasks: everyone in company can view
  (tipo_tarefa = 'profissional' AND empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE ativo = true
  ))
);

-- Allow updating tasks
CREATE POLICY "Allow task updates"
ON public.tarefas
FOR UPDATE
USING (
  -- Personal tasks: only creator can update
  (tipo_tarefa = 'pessoal' AND criado_por IN (
    SELECT id FROM usuarios WHERE ativo = true
  ))
  OR
  -- Professional tasks: users in same company can update
  (tipo_tarefa = 'profissional' AND empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE ativo = true
  ))
);

-- Allow deleting tasks
CREATE POLICY "Allow task deletion"
ON public.tarefas
FOR DELETE
USING (
  -- Personal tasks: only creator can delete
  (tipo_tarefa = 'pessoal' AND criado_por IN (
    SELECT id FROM usuarios WHERE ativo = true
  ))
  OR
  -- Professional tasks: users in same company can delete
  (tipo_tarefa = 'profissional' AND empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE ativo = true
  ))
);