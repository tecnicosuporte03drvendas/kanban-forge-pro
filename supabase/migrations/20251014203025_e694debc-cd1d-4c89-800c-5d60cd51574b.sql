-- Configurar pg_cron para executar a função de geração de tarefas recorrentes
-- Executa todos os dias às 00:05 AM

SELECT cron.schedule(
  'generate-recurring-tasks-daily',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/generate-recurring-tasks',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);