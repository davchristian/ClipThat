begin;

alter table public.agenda drop constraint agenda_kind_check;
alter table public.agenda add constraint agenda_kind_check
  check (kind in ('Tugas','Kuis','Presentasi','Ujian','Belajar'));

-- Reprocessing a result must not duplicate or overwrite a student's edited event.
create unique index agenda_automatic_event_unique
  on public.agenda(user_id,session_id,(source->>'event_key'))
  where source->>'automatic' = 'true';

create function private.save_class_agenda() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  announcement jsonb;
  ordinal bigint;
  deadline timestamptz;
  class_course uuid;
  class_start timestamptz;
  event_key text;
begin
  select course_id,starts_at into class_course,class_start from public.sessions
    where id=new.session_id and archived_at is null;
  if class_course is null then return new; end if;
  for announcement,ordinal in
    select value, ordinality from jsonb_array_elements(new.agenda_drafts) with ordinality
  loop
    if announcement->>'kind' not in ('Tugas','Kuis','Presentasi','Ujian')
      or announcement->>'due_at' is null
      or coalesce(length(trim(announcement->>'title')),0) not between 2 and 160
      or coalesce(announcement->>'quote','') = '' then continue; end if;
    -- Only save announcements backed by this class's unmodified transcript.
    if not exists(select 1 from public.transcript_segments t
      where t.session_id=new.session_id and t.id::text=announcement->>'source_id'
        and strpos(t.text,announcement->>'quote')>0) then continue; end if;
    begin
      deadline := (announcement->>'due_at')::timestamptz;
    exception when invalid_datetime_format or datetime_field_overflow then continue;
    end;
    if not isfinite(deadline) or (deadline at time zone 'Asia/Jakarta')::date
      < (class_start at time zone 'Asia/Jakarta')::date then continue; end if;
    event_key := md5(lower(trim(announcement->>'title')) || '|' ||
      (announcement->>'kind') || '|' || extract(epoch from deadline)::text);
    insert into public.agenda(user_id,session_id,course_id,title,due_at,kind,confirmed,source)
      select m.user_id,new.session_id,class_course,trim(announcement->>'title'),deadline,
        announcement->>'kind',true,jsonb_build_object(
          'source_id',announcement->>'source_id','quote',announcement->>'quote',
          'draft_key',new.session_id::text || ':' || (ordinal-1)::text,
          'event_key',event_key,'automatic',true,
          'announcement_title',announcement->>'title',
          'announcement_kind',announcement->>'kind',
          'announcement_due_at',announcement->>'due_at')
      from public.course_members m join public.profiles p on p.id=m.user_id
      where m.course_id=class_course and p.role='student'
      on conflict do nothing;
  end loop;
  return new;
end $$;
revoke all on function private.save_class_agenda() from public,anon,authenticated;
create trigger session_result_agenda
  after insert or update of agenda_drafts on public.session_results
  for each row execute function private.save_class_agenda();

commit;
