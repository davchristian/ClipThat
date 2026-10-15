-- Apply after 202610100001_initial.sql. Existing projects keep their data.
alter table public.courses add column days text not null default '' check(length(days)<=80);
alter table public.courses add column schedule_time text not null default '' check(length(schedule_time)<=40);
alter table public.courses add column teacher_name text not null default '';
update public.courses c set teacher_name=p.name from public.profiles p where p.id=c.owner_id;
create function private.course_teacher() returns trigger language plpgsql security definer set search_path='' as $$
begin select name into new.teacher_name from public.profiles where id=new.owner_id; return new; end $$;
create trigger course_teacher before insert or update of owner_id on public.courses for each row execute function private.course_teacher();

alter table public.agenda add column course_id uuid references public.courses(id) on delete set null;
alter table public.agenda add column reminder boolean not null default true;
alter table public.saved_items add column source_course_id uuid;
alter table public.saved_items add column source_title text not null default '';
update public.saved_items i set source_course_id=s.course_id,source_title=s.title from public.sessions s where s.id=i.session_id;
create function private.saved_source_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
begin select course_id,title into new.source_course_id,new.source_title from public.sessions where id=new.session_id; return new; end $$;
create trigger saved_source_snapshot before insert on public.saved_items for each row execute function private.saved_source_snapshot();
alter table public.profiles add column handled_notifications jsonb not null default '[]' check(jsonb_typeof(handled_notifications)='array' and jsonb_array_length(handled_notifications)<=500);
alter table public.profiles add column onboarded boolean not null default true;
create or replace function private.handle_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,name,role,onboarded) values (
 new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Pengguna'),60),
 case when new.raw_user_meta_data->>'role'='lecturer' and coalesce(new.raw_app_meta_data->>'provider','email')='email' then 'lecturer' else 'student' end,
 coalesce(new.raw_app_meta_data->>'provider','email')='email');
 return new;
end $$;
create function public.complete_onboarding(display_name text, account_role text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or length(trim(display_name)) not between 2 and 60 or account_role not in ('student','lecturer') then raise exception 'Input tidak valid' using errcode='22023'; end if;
 update public.profiles set name=trim(display_name),role=account_role,onboarded=true where id=auth.uid() and not onboarded;
 if not found then raise exception 'Peran akun sudah ditentukan' using errcode='42501'; end if;
end $$;
create function public.handle_notifications(identifiers jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or jsonb_typeof(identifiers)<>'array' or jsonb_array_length(identifiers)>500 or octet_length(identifiers::text)>50000 then raise exception 'Input tidak valid' using errcode='22023'; end if;
 update public.profiles set handled_notifications=identifiers where id=auth.uid();
end $$;
revoke all on function public.complete_onboarding(text,text), public.handle_notifications(jsonb) from public,anon;
grant execute on function public.complete_onboarding(text,text), public.handle_notifications(jsonb) to authenticated;

create function public.list_my_questions() returns table(id uuid,session_id uuid,text text,at_seconds double precision,answer text,answered_orally boolean,created_at timestamptz,votes bigint,supported boolean)
language sql stable security definer set search_path='' as $$
 select q.id,q.session_id,q.text,q.at_seconds,q.answer,q.answered_orally,q.created_at,
 (select count(*) from private.question_votes v where v.question_id=q.id),
 exists(select 1 from private.question_votes v where v.question_id=q.id and v.user_id=auth.uid())
 from public.questions q where private.can_read_session(q.session_id) order by q.created_at desc limit 500;
$$;
revoke all on function public.list_my_questions() from public,anon;
grant execute on function public.list_my_questions() to authenticated;

create table private.calendar_connections (
 user_id uuid not null references public.profiles(id) on delete cascade,
 provider text not null check(provider in ('outlook','google','notion')),
 credentials text not null, destination text not null default '', destination_name text not null default '',
 connected_at timestamptz not null default now(), primary key(user_id,provider)
);
create table private.calendar_links (
 user_id uuid not null references public.profiles(id) on delete cascade,
 agenda_id uuid not null, provider text not null, external_id text not null,
 primary key(user_id,agenda_id,provider)
);
create table private.calendar_jobs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 agenda_id uuid not null, provider text not null, payload jsonb not null, remove boolean not null default false,
 version uuid not null default gen_random_uuid(), lease uuid, leased_until timestamptz,
 status text not null default 'pending' check(status in ('pending','running','done','failed')),
 attempts int not null default 0, available_at timestamptz not null default now(), error text,
 unique(user_id,agenda_id,provider)
);
create function private.enqueue_calendar() returns trigger language plpgsql security definer set search_path='' as $$
declare a public.agenda; remove_event boolean;
begin
 if TG_OP='DELETE' then a=old; remove_event=true; else a=new; remove_event=not new.confirmed; end if;
 insert into private.calendar_jobs(user_id,agenda_id,provider,payload,remove)
 select a.user_id,a.id,c.provider,to_jsonb(a),remove_event from private.calendar_connections c where c.user_id=a.user_id and c.destination<>'' and (a.confirmed or exists(select 1 from private.calendar_links l where l.user_id=a.user_id and l.agenda_id=a.id and l.provider=c.provider))
 on conflict(user_id,agenda_id,provider) do update set payload=excluded.payload,remove=excluded.remove,version=gen_random_uuid(),
 status=case when private.calendar_jobs.status='running' then 'running' else 'pending' end,attempts=0,available_at=now(),error=null;
 return coalesce(new,old);
end $$;
create trigger calendar_agenda_changed after insert or update or delete on public.agenda for each row execute function private.enqueue_calendar();
create function public.calendar_status() returns table(provider text,destination text,destination_name text,connected_at timestamptz,pending bigint,failed bigint)
language sql stable security definer set search_path='' as $$
 select c.provider,c.destination,c.destination_name,c.connected_at,
 (select count(*) from private.calendar_jobs j where j.user_id=c.user_id and j.provider=c.provider and j.status in ('pending','running')),
 (select count(*) from private.calendar_jobs j where j.user_id=c.user_id and j.provider=c.provider and j.status='failed')
 from private.calendar_connections c where c.user_id=auth.uid();
$$;
create function public.calendar_connection(uid uuid, provider_name text) returns jsonb language sql stable security definer set search_path='' as $$
 select to_jsonb(c) from private.calendar_connections c where c.user_id=uid and c.provider=provider_name;
$$;
create function public.save_calendar_connection(uid uuid,provider_name text,secret text,target text,target_name text) returns void language plpgsql security definer set search_path='' as $$
begin
 insert into private.calendar_connections(user_id,provider,credentials,destination,destination_name) values(uid,provider_name,secret,target,target_name)
 on conflict(user_id,provider) do update set credentials=excluded.credentials,destination=excluded.destination,destination_name=excluded.destination_name;
end $$;
create function public.disconnect_calendar(provider_name text) returns void language plpgsql security definer set search_path='' as $$
begin
 delete from private.calendar_connections where user_id=auth.uid() and provider=provider_name;
 delete from private.calendar_jobs where user_id=auth.uid() and provider=provider_name;
 delete from private.calendar_links where user_id=auth.uid() and provider=provider_name;
end $$;
create function public.queue_calendar_sync(provider_name text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from private.calendar_connections where user_id=auth.uid() and provider=provider_name) then raise exception 'Hubungkan akun terlebih dahulu' using errcode='22023'; end if;
 update private.calendar_jobs set status='pending',attempts=0,available_at=now(),error=null where user_id=auth.uid() and provider=provider_name and status='failed';
 insert into private.calendar_jobs(user_id,agenda_id,provider,payload) select user_id,id,provider_name,to_jsonb(a) from public.agenda a where user_id=auth.uid() and confirmed
 on conflict(user_id,agenda_id,provider) do update set payload=excluded.payload,remove=false,version=gen_random_uuid(),
 status=case when private.calendar_jobs.status='running' then 'running' else 'pending' end,attempts=0,available_at=now(),error=null;
end $$;
create function public.claim_calendar_job() returns jsonb language plpgsql security definer set search_path='' as $$
declare j private.calendar_jobs; eid text;
begin
 select jobs.* into j from private.calendar_jobs jobs where exists(select 1 from private.calendar_connections c where c.user_id=jobs.user_id and c.provider=jobs.provider and c.destination<>'') and (jobs.status='pending' and jobs.available_at<=now() or jobs.status='running' and jobs.leased_until<now()) and jobs.attempts<5 order by jobs.available_at for update skip locked limit 1;
 if j.id is null then return null; end if;
 update private.calendar_jobs set status='running',attempts=attempts+1,lease=gen_random_uuid(),leased_until=now()+interval '2 minutes' where id=j.id returning * into j;
 select external_id into eid from private.calendar_links where user_id=j.user_id and agenda_id=j.agenda_id and provider=j.provider;
 return to_jsonb(j)||jsonb_build_object('external_id',eid);
end $$;
create function public.finish_calendar_job(jid uuid,lease_id uuid,job_version uuid,remote_id text,failed boolean) returns void language plpgsql security definer set search_path='' as $$
declare j private.calendar_jobs;
begin
 select * into j from private.calendar_jobs where id=jid and lease=lease_id and status='running' for update;
 if j.id is null then return; end if;
 if not failed then
  if remote_id is null then delete from private.calendar_links where user_id=j.user_id and agenda_id=j.agenda_id and provider=j.provider;
  else insert into private.calendar_links values(j.user_id,j.agenda_id,j.provider,remote_id) on conflict(user_id,agenda_id,provider) do update set external_id=excluded.external_id; end if;
 end if;
 update private.calendar_jobs set status=case when version<>job_version then 'pending' when not failed then 'done' when attempts>=5 then 'failed' else 'pending' end,
 available_at=case when failed then now()+make_interval(secs=>least(900,power(2,attempts)::int*15)) else now() end,
 leased_until=null,lease=null,error=case when failed then 'Sinkronisasi gagal. Periksa koneksi dan izin akun.' else null end where id=jid;
end $$;
revoke all on private.calendar_connections,private.calendar_jobs,private.calendar_links from public,anon,authenticated;
revoke all on function public.calendar_status(),public.disconnect_calendar(text),public.queue_calendar_sync(text),public.calendar_connection(uuid,text),public.save_calendar_connection(uuid,text,text,text,text),public.claim_calendar_job(),public.finish_calendar_job(uuid,uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.calendar_status(),public.disconnect_calendar(text),public.queue_calendar_sync(text) to authenticated;
grant execute on function public.calendar_connection(uuid,text),public.save_calendar_connection(uuid,text,text,text,text),public.claim_calendar_job(),public.finish_calendar_job(uuid,uuid,uuid,text,boolean) to service_role;

update storage.buckets set allowed_mime_types=array['application/pdf','text/plain','image/png','image/jpeg','image/webp'] where id='materials';
drop policy agenda_private on public.agenda;
create policy agenda_private on public.agenda for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and (session_id is null or private.can_read_session(session_id)) and (course_id is null or private.can_read_course(course_id)));
