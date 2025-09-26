-- Adicionar foreign keys que faltam na tabela reunioes_participantes
ALTER TABLE reunioes_participantes 
ADD CONSTRAINT reunioes_participantes_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE reunioes_participantes 
ADD CONSTRAINT reunioes_participantes_equipe_id_fkey 
FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE;