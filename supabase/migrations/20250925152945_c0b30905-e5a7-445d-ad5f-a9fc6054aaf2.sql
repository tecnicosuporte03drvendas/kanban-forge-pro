-- Drop all existing tables
DROP TABLE IF EXISTS public.anexos CASCADE;
DROP TABLE IF EXISTS public.categorias CASCADE;
DROP TABLE IF EXISTS public.comentarios CASCADE;
DROP TABLE IF EXISTS public.daily_user_stats CASCADE;
DROP TABLE IF EXISTS public.event_notifications_schedule CASCADE;
DROP TABLE IF EXISTS public.feedbacks CASCADE;
DROP TABLE IF EXISTS public.google_calendar_configuracoes CASCADE;
DROP TABLE IF EXISTS public.google_meet_configuracoes CASCADE;
DROP TABLE IF EXISTS public.google_tokens CASCADE;
DROP TABLE IF EXISTS public.grupo_de_usuarios CASCADE;
DROP TABLE IF EXISTS public.integration_logs CASCADE;
DROP TABLE IF EXISTS public.lembretes CASCADE;
DROP TABLE IF EXISTS public.meeting_notifications_sent CASCADE;
DROP TABLE IF EXISTS public.performance_insights CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.system_info CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.tarefa_responsaveis CASCADE;
DROP TABLE IF EXISTS public.tarefa_tags CASCADE;
DROP TABLE IF EXISTS public.tarefas CASCADE;
DROP TABLE IF EXISTS public.task_activities CASCADE;
DROP TABLE IF EXISTS public.task_checklists CASCADE;
DROP TABLE IF EXISTS public.ticket_comments CASCADE;
DROP TABLE IF EXISTS public.tipo_de_usuario CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.user_goals CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.whatsapp_configuracoes CASCADE;
DROP TABLE IF EXISTS public.whatsapp_logs CASCADE;
DROP TABLE IF EXISTS public.workspace_configuracoes CASCADE;
DROP TABLE IF EXISTS public.workspace_funcoes CASCADE;
DROP TABLE IF EXISTS public.workspace_membros CASCADE;
DROP TABLE IF EXISTS public.workspaces CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS public.verify_password(password text, hash text, salt text) CASCADE;
DROP FUNCTION IF EXISTS public.protect_workspace_owner() CASCADE;
DROP FUNCTION IF EXISTS public.verify_password(password text, hash text) CASCADE;
DROP FUNCTION IF EXISTS public.count_group_members(group_id integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_workspace_stats(target_workspace_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_workspace_admin_specific(target_workspace_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.set_current_user_id(user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.refresh_expired_google_tokens() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_daily_user_stats(target_date date) CASCADE;
DROP FUNCTION IF EXISTS public.is_workspace_owner(workspace_id uuid, usuario_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_workspace() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_workspace_ids() CASCADE;
DROP FUNCTION IF EXISTS public.is_mentor_master() CASCADE;
DROP FUNCTION IF EXISTS public.is_workspace_admin(workspace_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_workspace_atomic(workspace_name text, workspace_description text) CASCADE;
DROP FUNCTION IF EXISTS public.generate_salt() CASCADE;
DROP FUNCTION IF EXISTS public.hash_password(password text, salt text) CASCADE;
DROP FUNCTION IF EXISTS public.is_workspace_active(workspace_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.delete_workspace(workspace_id uuid, confirmation_name text) CASCADE;
DROP FUNCTION IF EXISTS public.notify_task_changes() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_workspace_data(workspace_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_custom_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_workspace_members(target_workspace_id uuid) CASCADE;

-- Drop all custom types (enums)
DROP TYPE IF EXISTS public.tipo_anexo CASCADE;
DROP TYPE IF EXISTS public.tipo_feedback CASCADE;
DROP TYPE IF EXISTS public.status_feedback CASCADE;
DROP TYPE IF EXISTS public.prioridade_feedback CASCADE;
DROP TYPE IF EXISTS public.categoria_ticket CASCADE;
DROP TYPE IF EXISTS public.prioridade_ticket CASCADE;
DROP TYPE IF EXISTS public.status_ticket CASCADE;
DROP TYPE IF EXISTS public.prioridade_tarefa CASCADE;
DROP TYPE IF EXISTS public.status_tarefa CASCADE;
DROP TYPE IF EXISTS public.papel_workspace CASCADE;

-- Drop all sequences
DROP SEQUENCE IF EXISTS public.categorias_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.grupo_de_usuarios_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.tags_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.tipo_de_usuario_id_seq CASCADE;

-- Clear all storage buckets
DELETE FROM storage.objects WHERE bucket_id = 'task-attachments';
DELETE FROM storage.buckets WHERE id = 'task-attachments';