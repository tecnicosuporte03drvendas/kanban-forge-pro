-- Adicionar coluna tipo_tarefa na tabela tarefas
ALTER TABLE public.tarefas 
ADD COLUMN tipo_tarefa TEXT NOT NULL DEFAULT 'profissional';

-- Adicionar constraint para validar valores
ALTER TABLE public.tarefas
ADD CONSTRAINT tarefas_tipo_tarefa_check CHECK (tipo_tarefa IN ('pessoal', 'profissional'));

-- Criar índice para melhor performance nas queries
CREATE INDEX idx_tarefas_tipo_tarefa ON public.tarefas(tipo_tarefa);

-- Atualizar RLS policies para tarefas pessoais
-- Drop das policies antigas
DROP POLICY IF EXISTS "Users can view company tasks" ON public.tarefas;
DROP POLICY IF EXISTS "Users can create company tasks" ON public.tarefas;
DROP POLICY IF EXISTS "Users can update company tasks" ON public.tarefas;
DROP POLICY IF EXISTS "Users can delete company tasks" ON public.tarefas;

-- Policy para SELECT: usuários veem suas tarefas pessoais + tarefas profissionais da empresa
CREATE POLICY "Users can view tasks based on type" 
ON public.tarefas 
FOR SELECT 
USING (
  -- Tarefas pessoais: apenas o criador vê
  (tipo_tarefa = 'pessoal' AND criado_por = auth.uid())
  OR
  -- Tarefas profissionais: todos da empresa veem
  (tipo_tarefa = 'profissional' AND TRUE)
);

-- Policy para INSERT: colaboradores só criam pessoais, gestores/proprietários criam ambas
CREATE POLICY "Users can create tasks based on role" 
ON public.tarefas 
FOR INSERT 
WITH CHECK (
  -- Tarefas profissionais: apenas gestores, proprietários e master podem criar
  (tipo_tarefa = 'profissional' AND EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo_usuario IN ('gestor', 'proprietario', 'master')
  ))
  OR
  -- Tarefas pessoais: qualquer usuário autenticado pode criar (incluindo colaboradores)
  (tipo_tarefa = 'pessoal' AND criado_por = auth.uid())
);

-- Policy para UPDATE: apenas o criador de tarefas pessoais, para profissionais segue regra normal
CREATE POLICY "Users can update tasks based on type" 
ON public.tarefas 
FOR UPDATE 
USING (
  -- Tarefas pessoais: apenas o criador pode editar
  (tipo_tarefa = 'pessoal' AND criado_por = auth.uid())
  OR
  -- Tarefas profissionais: todos da empresa podem editar
  (tipo_tarefa = 'profissional' AND TRUE)
);

-- Policy para DELETE: apenas o criador de tarefas pessoais, para profissionais segue regra normal
CREATE POLICY "Users can delete tasks based on type" 
ON public.tarefas 
FOR DELETE 
USING (
  -- Tarefas pessoais: apenas o criador pode deletar
  (tipo_tarefa = 'pessoal' AND criado_por = auth.uid())
  OR
  -- Tarefas profissionais: todos da empresa podem deletar
  (tipo_tarefa = 'profissional' AND TRUE)
);