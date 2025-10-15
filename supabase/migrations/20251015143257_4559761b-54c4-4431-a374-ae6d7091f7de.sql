-- Inserir configurações para habilitar/desabilitar notificações
INSERT INTO configuracoes_sistema (chave, valor, descricao) VALUES
  ('notif_tarefa_criada_ativa', 'true', 'Ativar notificação quando tarefa é criada'),
  ('notif_lembrete_1dia_ativa', 'true', 'Ativar lembrete 1 dia antes do vencimento'),
  ('notif_lembrete_dia_ativa', 'true', 'Ativar lembrete no dia do vencimento'),
  ('notif_atraso_1dia_ativa', 'true', 'Ativar notificação de atraso de 1 dia'),
  ('notif_atraso_5dias_ativa', 'true', 'Ativar notificação de atraso de 5 dias')
ON CONFLICT (chave) DO NOTHING;

-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Lembrete 1 dia antes (9h horário de Brasília = 12h UTC)
SELECT cron.schedule(
  'notify-task-reminder-1day',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url:='https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/notify-task-reminder-1day',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Lembrete no dia (9h horário de Brasília = 12h UTC)
SELECT cron.schedule(
  'notify-task-reminder-today',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url:='https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/notify-task-reminder-today',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Atraso 1 dia (9h horário de Brasília = 12h UTC)
SELECT cron.schedule(
  'notify-task-overdue-1day',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url:='https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/notify-task-overdue-1day',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Atraso 5 dias (9h horário de Brasília = 12h UTC)
SELECT cron.schedule(
  'notify-task-overdue-5days',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url:='https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/notify-task-overdue-5days',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);