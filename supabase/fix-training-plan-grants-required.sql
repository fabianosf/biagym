-- BiAGym – o aluno só vê treino com liberação explícita
-- Execute no SQL Editor se phase13-workouts.sql já rodou.
-- Admin continua vendo todos os treinos.

create or replace function public.can_read_training_plan(p_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.training_plans tp
      join public.training_plan_grants g on g.plan_id = tp.id
      where tp.id = p_plan_id
        and tp.is_published = true
        and g.user_id = auth.uid()
    );
$$;

revoke all on function public.can_read_training_plan(uuid) from public;
grant execute on function public.can_read_training_plan(uuid) to authenticated;