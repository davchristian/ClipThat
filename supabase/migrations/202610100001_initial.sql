-- ClipThat: apply once with Supabase SQL Editor or `supabase db push`.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(name) between 2 and 60),
  role text not null default 'student' check (role in ('student','lecturer')),
  created_at timestamptz not null default now()
);
create function private.handle_signup() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,name,role) values (
    new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),'Pengguna'),60),
    case when new.raw_user_meta_data->>'role' = 'lecturer' then 'lecturer' else 'student' end
  );
  return new;
end $$;
create trigger clipthat_signup after insert on auth.users for each row execute function private.handle_signup();

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null check (length(name) between 2 and 120),
  code text not null default '' check(length(code)<=30),
  created_at timestamptz not null default now()
);
create table public.course_members (
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key(course_id,user_id)
);
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  title text not null check(length(title) between 2 and 160),
  starts_at timestamptz not null,
  status text not null default 'upcoming' check(status in ('upcoming','live','processing','done','failed')),
  join_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  started_at timestamptz,
  ended_at timestamptz,
  archived_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now()
);
create index sessions_course_idx on public.sessions(course_id,starts_at);

create function private.owns_course(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.courses where id=cid and owner_id=auth.uid());
$$;
create function private.can_read_course(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select private.owns_course(cid) or exists(select 1 from public.course_members where course_id=cid and user_id=auth.uid());
$$;
create function private.owns_session(sid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.sessions where id=sid and private.owns_course(course_id));
$$;
create function private.can_read_session(sid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.sessions where id=sid and
  (private.owns_course(course_id) or (archived_at is null and private.can_read_course(course_id))));
$$;
create function private.is_student() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='student');
$$;

create table public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  start_seconds double precision not null check(start_seconds>=0 and start_seconds<=86400),
  end_seconds double precision not null check(end_seconds>=start_seconds and end_seconds<=86400),
  text text not null check(length(text) between 1 and 10000),
  chunk_id uuid not null,
  segment_index int not null check(segment_index>=0),
  unique(session_id,chunk_id,segment_index)
);
create index transcript_session_idx on public.transcript_segments(session_id,start_seconds);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  text text not null check(length(text) between 3 and 1000),
  at_seconds double precision not null default 0 check(at_seconds>=0),
  answer text check(length(answer)<=5000),
  answered_orally boolean not null default false,
  created_at timestamptz not null default now()
);
-- No author or voter identity in shared tables / Realtime payloads.
create table private.question_authors (
  question_id uuid primary key references public.questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade
);
create table private.question_votes (
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key(question_id,user_id)
);
create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  kind text not null check(kind in ('bookmark','capture','photo')),
  title text not null check(length(title) between 1 and 160),
  text text not null default '' check(length(text)<=60000),
  summary text check(length(summary)<=12000),
  question text check(length(question)<=1000),
  start_seconds double precision not null check(start_seconds>=0 and start_seconds<=86400),
  end_seconds double precision check(end_seconds>=start_seconds and end_seconds<=86400),
  label text check(label in ('Bingung','Review nanti')),
  storage_path text,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);
create index saved_owner_idx on public.saved_items(user_id,session_id);
create unique index bookmark_unique_idx on public.saved_items(user_id,session_id,start_seconds) where kind='bookmark';
create table public.personal_notes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  text text not null default '' check(length(text)<=50000),
  primary key(user_id,session_id)
);
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  name text not null check(length(name) between 1 and 160),
  storage_path text not null unique,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.session_results (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  notes jsonb not null,
  graph jsonb not null,
  graph_corrected boolean not null default false,
  agenda_drafts jsonb not null default '[]',
  generated_at timestamptz not null default now()
);
create table public.personal_reviews (
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  content jsonb not null,
  generated_at timestamptz not null default now(),
  primary key(user_id,session_id)
);
create table public.agenda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  title text not null check(length(title) between 2 and 160),
  due_at timestamptz not null,
  kind text not null check(kind in ('Tugas','Kuis','Belajar')),
  confirmed boolean not null default false,
  done boolean not null default false,
  source jsonb,
  updated_at timestamptz not null default now()
);
create table private.jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  kind text not null check(kind in ('session','review')),
  status text not null default 'pending' check(status in ('pending','running','done','failed')),
  attempts int not null default 0,
  lease uuid,
  leased_until timestamptz,
  available_at timestamptz not null default now(),
  error text,
  unique nulls not distinct(session_id,kind,user_id)
);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_members enable row level security;
alter table public.sessions enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.questions enable row level security;
alter table public.saved_items enable row level security;
alter table public.personal_notes enable row level security;
alter table public.materials enable row level security;
alter table public.session_results enable row level security;
alter table public.personal_reviews enable row level security;
alter table public.agenda enable row level security;

create policy profiles_self on public.profiles for select to authenticated using(id=auth.uid());
create policy courses_read on public.courses for select to authenticated using(owner_id=auth.uid() or private.can_read_course(id));
create policy courses_create on public.courses for insert to authenticated with check(
 owner_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and role='lecturer'));
create policy courses_edit on public.courses for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy members_self on public.course_members for select to authenticated using(user_id=auth.uid());
create policy sessions_read on public.sessions for select to authenticated using(private.owns_course(course_id) or
 (archived_at is null and private.can_read_course(course_id)));
create policy sessions_create on public.sessions for insert to authenticated with check(private.owns_course(course_id)
 and status='upcoming' and archived_at is null and started_at is null and ended_at is null);
-- Lifecycle updates only through checked functions below.
create policy transcript_read on public.transcript_segments for select to authenticated using(private.can_read_session(session_id));
create policy questions_read on public.questions for select to authenticated using(private.can_read_session(session_id));
create policy saved_read on public.saved_items for select to authenticated using(user_id=auth.uid());
create policy saved_create on public.saved_items for insert to authenticated with check(
 user_id=auth.uid() and private.is_student() and private.can_read_session(session_id));
create policy saved_update on public.saved_items for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy saved_delete on public.saved_items for delete to authenticated using(user_id=auth.uid());
create policy notes_private on public.personal_notes for all to authenticated using(user_id=auth.uid())
 with check(user_id=auth.uid() and private.can_read_session(session_id));
create policy materials_read on public.materials for select to authenticated using(
 private.can_read_session(session_id) and (archived_at is null or private.owns_session(session_id)));
create policy materials_create on public.materials for insert to authenticated with check(private.owns_session(session_id));
create policy results_read on public.session_results for select to authenticated using(private.can_read_session(session_id));
create policy reviews_private on public.personal_reviews for select to authenticated using(user_id=auth.uid());
create policy agenda_private on public.agenda for all to authenticated using(user_id=auth.uid()) with check(
 user_id=auth.uid() and (session_id is null or private.can_read_session(session_id)));

create function public.join_session(code text) returns uuid language plpgsql security definer set search_path='' as $$
declare s public.sessions;
begin
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
 select * into s from public.sessions where join_code=upper(trim(code)) and archived_at is null;
 if s.id is null then raise exception 'Kode kelas tidak ditemukan' using errcode='P0002'; end if;
 insert into public.course_members(course_id,user_id) values(s.course_id,auth.uid()) on conflict do nothing;
 return s.id;
end $$;
create function public.session_action(sid uuid, action text) returns public.sessions language plpgsql security definer set search_path='' as $$
declare s public.sessions;
begin
 select * into s from public.sessions where id=sid for update;
 if s.id is null or not private.owns_session(sid) then raise exception 'Tidak diizinkan' using errcode='42501'; end if;
 if action='start' and s.status='upcoming' and s.archived_at is null then
  update public.sessions set status='live', started_at=now() where id=sid;
 elsif action='end' and s.status='live' and s.archived_at is null then
  update public.sessions set status='processing', ended_at=now(),processing_error=null where id=sid;
  insert into private.jobs(session_id,kind) values(sid,'session') on conflict do nothing;
 elsif action='retry' and s.status='failed' and s.archived_at is null then
  update public.sessions set status='processing',processing_error=null where id=sid;
  update private.jobs set status='pending',attempts=0,available_at=now(),error=null where session_id=sid and kind='session';
 elsif action='archive' and s.status not in ('live','processing') then
  update public.sessions set archived_at=coalesce(archived_at,now()) where id=sid;
 elsif action='restore' and s.archived_at>now()-interval '30 days' then
  update public.sessions set archived_at=null where id=sid;
 else raise exception 'Status kelas tidak sesuai' using errcode='22023';
 end if;
 select * into s from public.sessions where id=sid;
 return s;
end $$;
create function public.append_transcript(sid uuid, chunk uuid, segments jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.owns_session(sid) or not exists(select 1 from public.sessions where id=sid and status='live' and archived_at is null)
 then raise exception 'Kelas harus aktif dan dimiliki dosen' using errcode='42501'; end if;
 if jsonb_typeof(segments)<>'array' or jsonb_array_length(segments)>200 then raise exception 'Segmen tidak valid'; end if;
 insert into public.transcript_segments(session_id,chunk_id,segment_index,start_seconds,end_seconds,text)
 select sid,chunk,(ordinality-1)::int,(value->>'start')::float8,(value->>'end')::float8,value->>'text'
 from jsonb_array_elements(segments) with ordinality on conflict do nothing;
end $$;
create function public.ask_question(sid uuid, body text, at_seconds double precision default 0) returns uuid language plpgsql security definer set search_path='' as $$
declare qid uuid;
begin
 if not private.can_read_session(sid) or not private.is_student() then raise exception 'Tidak diizinkan' using errcode='42501'; end if;
 insert into public.questions(session_id,text,at_seconds) values(sid,trim(body),at_seconds) returning id into qid;
 insert into private.question_authors values(qid,auth.uid());
 return qid;
end $$;
create function public.list_questions(sid uuid) returns table(
 id uuid,session_id uuid,text text,at_seconds double precision,answer text,answered_orally boolean,created_at timestamptz,votes bigint,supported boolean
) language sql stable security definer set search_path='' as $$
 select q.id,q.session_id,q.text,q.at_seconds,q.answer,q.answered_orally,q.created_at,
 (select count(*) from private.question_votes v where v.question_id=q.id),
 exists(select 1 from private.question_votes v where v.question_id=q.id and v.user_id=auth.uid())
 from public.questions q where q.session_id=sid and private.can_read_session(sid) order by q.created_at;
$$;
create function public.support_question(qid uuid, support boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_student() or not exists(select 1 from public.questions where id=qid and private.can_read_session(session_id))
 then raise exception 'Tidak diizinkan' using errcode='42501'; end if;
 if support then insert into private.question_votes values(qid,auth.uid()) on conflict do nothing;
 else delete from private.question_votes where question_id=qid and user_id=auth.uid(); end if;
end $$;
create function public.answer_question(qid uuid, body text, oral boolean default false) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.questions where id=qid and private.owns_session(session_id)) then raise exception 'Tidak diizinkan' using errcode='42501'; end if;
 update public.questions set answer=nullif(trim(body),''),answered_orally=oral where id=qid;
end $$;
create function public.confusion_summary(sid uuid) returns table(start_seconds double precision,total bigint) language sql stable security definer set search_path='' as $$
 select i.start_seconds,count(distinct i.user_id) from public.saved_items i
 where i.session_id=sid and i.kind='bookmark' and i.label='Bingung' and private.owns_session(sid)
 group by i.start_seconds order by count(distinct i.user_id) desc;
$$;
create function public.correct_graph(sid uuid, content jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.owns_session(sid) then raise exception 'Tidak diizinkan' using errcode='42501'; end if;
 if jsonb_typeof(content)<>'object' or not (content ? 'nodes' and content ? 'edges') or octet_length(content::text)>100000
 then raise exception 'Graph tidak valid' using errcode='22023'; end if;
 update public.session_results set graph=content,graph_corrected=true where session_id=sid;
end $$;
create function public.archive_material(mid uuid, restore boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare m public.materials;
begin
 select * into m from public.materials where id=mid;
 if m.id is null or not private.owns_session(m.session_id) then raise exception 'Tidak diizinkan' using errcode='42501'; end if;
 if exists(select 1 from public.sessions where id=m.session_id and status='live') then raise exception 'Akhiri kelas terlebih dahulu' using errcode='22023'; end if;
 if restore and (m.archived_at is null or m.archived_at<=now()-interval '30 days') then raise exception 'Masa pemulihan berakhir' using errcode='22023'; end if;
 update public.materials set archived_at=case when restore then null else now() end where id=mid;
end $$;

-- Durable jobs: only a server with service_role can claim or complete them.
create function public.claim_job() returns jsonb language plpgsql security definer set search_path='' as $$
declare j private.jobs;
begin
 select * into j from private.jobs where (status='pending' and available_at<=now() or status='running' and leased_until<now())
 and attempts<5 order by available_at for update skip locked limit 1;
 if j.id is null then return null; end if;
 update private.jobs set status='running',attempts=attempts+1,lease=gen_random_uuid(),leased_until=now()+interval '5 minutes'
 where id=j.id returning * into j;
 return to_jsonb(j);
end $$;
create function public.complete_job(jid uuid, token uuid, result jsonb) returns void language plpgsql security definer set search_path='' as $$
declare j private.jobs;
begin
 select * into j from private.jobs where id=jid and lease=token and status='running' for update;
 if j.id is null then raise exception 'Lease kedaluwarsa'; end if;
 if j.kind='session' then
  insert into public.session_results(session_id,notes,graph,agenda_drafts) values(j.session_id,result->'notes',result->'graph',result->'agenda')
  on conflict(session_id) do update set notes=excluded.notes,agenda_drafts=excluded.agenda_drafts,
   graph=case when public.session_results.graph_corrected then public.session_results.graph else excluded.graph end,generated_at=now();
  update public.sessions set status='done',processing_error=null where id=j.session_id;
  insert into private.jobs(session_id,kind,user_id)
   select j.session_id,'review',m.user_id from public.course_members m join public.sessions s on s.course_id=m.course_id
   join public.profiles p on p.id=m.user_id where s.id=j.session_id and p.role='student' on conflict do nothing;
 else
  insert into public.personal_reviews(user_id,session_id,content) values(j.user_id,j.session_id,result)
   on conflict(user_id,session_id) do update set content=excluded.content,generated_at=now();
 end if;
 update private.jobs set status='done',lease=null,leased_until=null,error=null where id=jid;
end $$;
create function public.fail_job(jid uuid, token uuid) returns void language plpgsql security definer set search_path='' as $$
declare j private.jobs;
begin
 update private.jobs set status=case when attempts>=5 then 'failed' else 'pending' end,
  available_at=now()+interval '1 minute'*power(2,attempts),lease=null,leased_until=null,error='Pemrosesan AI gagal. Coba lagi nanti.'
  where id=jid and lease=token and status='running' returning * into j;
 if j.kind='session' and j.status='failed' then
  update public.sessions set status='failed',processing_error=j.error where id=j.session_id;
 end if;
end $$;

-- Private file buckets. Shared files still require course membership.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('materials','materials',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp']),
 ('photos','photos',false,5242880,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create policy photos_owner on storage.objects for all to authenticated using(
 bucket_id='photos' and (storage.foldername(name))[1]=auth.uid()::text)
 with check(bucket_id='photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy material_upload on storage.objects for insert to authenticated with check(
 bucket_id='materials' and private.owns_session(((storage.foldername(name))[1])::uuid));
create policy material_download on storage.objects for select to authenticated using(
 bucket_id='materials' and exists(select 1 from public.materials m where m.storage_path=storage.objects.name and m.archived_at is null and private.can_read_session(m.session_id)));

create table private.rate_limits (
 user_id uuid not null references public.profiles(id) on delete cascade,
 action text not null, window_start timestamptz not null, total int not null,
 primary key(user_id,action)
);
create function public.consume_limit(action text) returns boolean language plpgsql security definer set search_path='' as $$
declare count_now int; max_count int;
begin
 if auth.uid() is null then return false; end if;
 max_count := case action when 'capture' then 12 when 'transcribe' then 20 when 'question' then 20 when 'join' then 15 else 0 end;
 if max_count=0 then return false; end if;
 insert into private.rate_limits values(auth.uid(),action,date_trunc('minute',now()),1)
 on conflict on constraint rate_limits_pkey do update set
  total=case when private.rate_limits.window_start=date_trunc('minute',now()) then private.rate_limits.total+1 else 1 end,
  window_start=date_trunc('minute',now()) returning total into count_now;
 return count_now<=max_count;
end $$;

-- Explicit privileges also override Supabase's default grants for new tables.
revoke all on public.profiles,public.courses,public.course_members,public.sessions,public.transcript_segments,
 public.questions,public.saved_items,public.personal_notes,public.materials,public.session_results,public.personal_reviews,public.agenda from anon,authenticated;
-- Clients cannot update ownership, lifecycle or public identities.
grant select on public.profiles,public.courses,public.course_members,public.sessions,public.transcript_segments,
 public.questions,public.saved_items,public.personal_notes,public.materials,public.session_results,public.personal_reviews,public.agenda to authenticated;
grant insert on public.courses,public.sessions,public.saved_items,public.personal_notes,public.materials,public.agenda to authenticated;
grant update(name,code) on public.courses to authenticated;
grant update(reviewed,question,label) on public.saved_items to authenticated;
grant update(text) on public.personal_notes to authenticated;
grant update(title,due_at,kind,confirmed,done,updated_at) on public.agenda to authenticated;
grant delete on public.saved_items,public.personal_notes,public.agenda to authenticated;
grant all on all tables in schema public,private to service_role;
revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.owns_course(uuid),private.can_read_course(uuid),private.owns_session(uuid),
 private.can_read_session(uuid),private.is_student() to authenticated;
revoke all on function public.join_session(text),public.session_action(uuid,text),public.append_transcript(uuid,uuid,jsonb),
 public.ask_question(uuid,text,double precision),public.list_questions(uuid),public.support_question(uuid,boolean),
 public.answer_question(uuid,text,boolean),public.confusion_summary(uuid),public.correct_graph(uuid,jsonb),public.archive_material(uuid,boolean),
 public.claim_job(),public.complete_job(uuid,uuid,jsonb),public.fail_job(uuid,uuid),public.consume_limit(text) from public,anon,authenticated;
grant execute on function public.join_session(text),public.session_action(uuid,text),public.append_transcript(uuid,uuid,jsonb),
 public.ask_question(uuid,text,double precision),public.list_questions(uuid),public.support_question(uuid,boolean),
 public.answer_question(uuid,text,boolean),public.confusion_summary(uuid),public.correct_graph(uuid,jsonb),public.archive_material(uuid,boolean),public.consume_limit(text) to authenticated;
grant execute on function public.claim_job(),public.complete_job(uuid,uuid,jsonb),public.fail_job(uuid,uuid) to service_role;
commit;
