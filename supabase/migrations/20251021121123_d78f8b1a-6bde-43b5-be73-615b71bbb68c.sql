-- Atualizar tarefas sem tipo_tarefa definido para 'profissional'
UPDATE public.tarefas
SET tipo_tarefa = 'profissional'
WHERE tipo_tarefa IS NULL 
   OR tipo_tarefa = ''
   OR tipo_tarefa NOT IN ('pessoal', 'profissional');