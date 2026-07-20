-- Supabase本番DBに適用済み（2026-07-19、SQL Editorで手動実行）
-- 目的: auth.users に行が作られた瞬間、public.users にも自動で行を作る
--       （メール確認リンクを別端末で開くと callback で users 行が
--         作られない問題への対策。アプリ側の ensureUserRecord と二重の保険）
-- 注意: このファイルは記録用。DBには適用済みなので再実行は不要。
--       新しいDB環境を作った場合のみ、SQL Editor で再実行すること。
-- 撤去する場合:
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, "isActive", "isAdmin")
  values (new.id, new.email, true, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
