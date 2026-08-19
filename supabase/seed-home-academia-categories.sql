-- BiAGym – Categorias "Casa" e "Academia" pros programas em vídeo
-- Execute no Supabase SQL Editor após supabase/schema.sql
--
-- Não existe hoje uma tela de admin pra criar categoria nova (só pra
-- escolher entre as que já existem no formulário de programa) — por isso
-- via SQL, igual ao seed original de Força/Condicionamento.

insert into public.categories (name, slug, description)
values
  ('Casa', 'casa', 'Treinos gravados pra fazer em casa, sem equipamento de academia'),
  ('Academia', 'academia', 'Treinos gravados pra fazer na academia, com os equipamentos de lá')
on conflict (slug) do nothing;
