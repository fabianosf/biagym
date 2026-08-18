-- BiAGym – Remove o sufixo "– QA" dos títulos visíveis para as alunas
-- Execute no Supabase SQL Editor.
--
-- Os títulos "Treino A – QA" / "Treino B – QA" / "Base 4 semanas – QA" vieram
-- do seed de dados fictícios (supabase/seed-qa-students.sql) e não deveriam
-- aparecer assim para quem usa o app. Só renomeia o título de exibição; slug
-- e demais dados continuam os mesmos.

update public.training_plans
set title = 'Treino A'
where title = 'Treino A – QA';

update public.training_plans
set title = 'Treino B'
where title = 'Treino B – QA';

update public.programs
set title = 'Base 4 semanas'
where title = 'Base 4 semanas – QA';
