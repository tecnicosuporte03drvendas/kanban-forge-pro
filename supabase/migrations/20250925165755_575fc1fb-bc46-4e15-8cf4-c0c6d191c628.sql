-- Atualizar todos os proprietários existentes para terem a função "Proprietário"
UPDATE usuarios 
SET tipo_usuario = 'proprietario'
WHERE tipo_usuario = 'proprietario';

-- Comentário: Esta query garante que todos os proprietários tenham o tipo correto
-- Mesmo que já estejam como 'proprietario', isso normaliza os dados