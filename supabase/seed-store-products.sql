-- BiAGym – Produtos iniciais da Loja
-- Execute no Supabase SQL Editor DEPOIS de supabase/phase16-store.sql.
--
-- Cadastra os 3 produtos pedidos (Whey, Creatina, Shake) só com nome e preço
-- — sem foto, porque a imagem enviada no chat não vira arquivo no Storage
-- automaticamente. Pra colocar a foto de cada um, entre em Admin > Loja,
-- toque em "Editar" no produto e anexe a foto pelo seletor de imagem.

do $$
declare
  admin_id uuid;
begin
  select id into admin_id from public.profiles where role = 'admin' limit 1;

  if admin_id is null then
    raise exception 'Nenhum admin encontrado em public.profiles. Rode fix-admin.sql primeiro.';
  end if;

  if not exists (select 1 from public.products where name = 'Whey Protein') then
    insert into public.products (name, description, price_cents, created_by)
    values ('Whey Protein', 'Whey Protein sabor morango, pote', 10000, admin_id);
  end if;

  if not exists (select 1 from public.products where name = 'Creatina') then
    insert into public.products (name, description, price_cents, created_by)
    values ('Creatina', '100% Creatina monohidratada, 300g', 12000, admin_id);
  end if;

  if not exists (select 1 from public.products where name = 'Shake Linea Baunilha') then
    insert into public.products (name, description, price_cents, created_by)
    values ('Shake Linea Baunilha', 'Shake substituto de refeição, sabor baunilha, 330g', 4500, admin_id);
  end if;
end $$;
