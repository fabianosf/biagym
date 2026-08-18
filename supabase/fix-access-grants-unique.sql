-- BiAGym – Evita concessões de acesso duplicadas
-- Sem este índice único, duas chamadas simultâneas de "conceder acesso"
-- para a mesma aluna+programa podiam criar duas linhas em access_grants —
-- revogar uma delas deixava a outra ativa silenciosamente. Necessário para
-- a versão atual de createAccessGrant (usa upsert com onConflict).
-- Idempotente — seguro rodar mais de uma vez, inclusive se
-- supabase/promote-admin.sql já tiver sido executado antes.

create unique index if not exists access_grants_user_program_unique_idx
  on public.access_grants (user_id, program_id);
