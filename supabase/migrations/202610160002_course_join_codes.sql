-- Separate membership codes from academic course codes (e.g. IF2123).
-- Existing courses are backfilled; newly created courses receive a code automatically.
alter table public.courses add column join_code text not null unique
  default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))
  check (join_code ~ '^[A-Z0-9]{10}$');

create function public.join_course(code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare cid uuid;
begin
  if not private.is_student() then raise insufficient_privilege; end if;
  select c.id into cid from public.courses c where c.join_code=upper(trim($1));
  if cid is null then raise no_data_found; end if;
  insert into public.course_members(course_id,user_id) values(cid,auth.uid()) on conflict do nothing;
  return cid;
end $$;
revoke all on function public.join_course(text) from public,anon;
grant execute on function public.join_course(text) to authenticated;
