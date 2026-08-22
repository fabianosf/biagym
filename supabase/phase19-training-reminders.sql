-- BiAGym – Fase 19: lembrete de treino ("N dias sem treinar")
-- Execute no SQL Editor após supabase/phase10-notifications.sql e
-- supabase/phase13-workouts.sql.
--
-- Alvo do lembrete: alunos com pelo menos uma ficha liberada
-- (training_plan_grants), notificações ativadas e sem sessão de treino
-- concluída nos últimos p_inactive_days dias (ou nunca treinaram).
--
-- security definer: a função roda com o dono (service role via migration),
-- não com o papel de quem chama — necessário porque o cron não tem sessão
-- de usuário autenticado, só o service role da Edge Function.
create or replace function public.get_training_reminder_targets(p_inactive_days int default 3)
returns table (user_id uuid, expo_push_token text)
language sql
security definer
set search_path = public
as $$
  select p.id as user_id, p.expo_push_token
  from public.profiles p
  where p.push_notifications_enabled = true
    and p.expo_push_token is not null
    and exists (
      select 1 from public.training_plan_grants g where g.user_id = p.id
    )
    and not exists (
      select 1
      from public.workout_sessions s
      where s.user_id = p.id
        and s.completed_at >= now() - make_interval(days => p_inactive_days)
    );
$$;

revoke all on function public.get_training_reminder_targets(int) from public;
grant execute on function public.get_training_reminder_targets(int) to service_role;
