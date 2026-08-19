-- Cria/confirma 4 alunas fictícias de teste, com login por e-mail+senha já
-- confirmado (sem depender do e-mail de confirmação, que tem limite de envio
-- baixo no plano gratuito do Supabase).
--
-- Senha de todas: Teste123!
--
-- Idempotente: pode rodar de novo sem duplicar nem quebrar nada.

do $$
declare
  v_password text := 'Teste123!';
  v_students jsonb := '[
    {"email":"camila@teste.com","name":"Camila Souza"},
    {"email":"juliana@teste.com","name":"Juliana Reis"},
    {"email":"marcela@teste.com","name":"Marcela Lima"},
    {"email":"beatriz@teste.com","name":"Beatriz Alves"}
  ]'::jsonb;
  v_student jsonb;
  v_user_id uuid;
begin
  for v_student in select * from jsonb_array_elements(v_students)
  loop
    select id into v_user_id from auth.users where email = v_student ->> 'email';

    if v_user_id is null then
      v_user_id := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token,
        email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
        v_student ->> 'email', crypt(v_password, gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', v_student ->> 'name', 'full_name', v_student ->> 'name', 'role', 'student'),
        now(), now(), '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_student ->> 'email'),
        'email', v_user_id::text, now(), now(), now()
      );
    else
      -- Já existe (ex.: criada via app antes de rodar esse script) — só garante senha e confirmação.
      update auth.users
      set encrypted_password = crypt(v_password, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now())
      where id = v_user_id;
    end if;

    -- handle_new_user() já cria a linha em profiles no insert; isso só garante o nome certo.
    update public.profiles set name = v_student ->> 'name' where id = v_user_id;
  end loop;
end $$;

select id, email, name, role from public.profiles
where email in ('camila@teste.com', 'juliana@teste.com', 'marcela@teste.com', 'beatriz@teste.com')
order by email;
