import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const teacher = "00000000-0000-4000-8000-000000000001",
  student = "00000000-0000-4000-8000-000000000002",
  other = "00000000-0000-4000-8000-000000000003";
let course: string, session: string, question: string;
async function asUser<T>(id: string, work: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  try {
    return await work();
  } finally {
    await db.exec("reset role");
  }
}
before(async () => {
  await db.exec(`
 create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}',raw_app_meta_data jsonb not null default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema public,auth to authenticated,anon,service_role;
 grant execute on function auth.uid() to authenticated,anon,service_role;
 create schema storage;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(name text) returns text[] language sql as $$select string_to_array(name,'/')$$;
 grant usage on schema storage to authenticated,service_role;
 grant all on storage.objects to authenticated;
 `);
  await db.exec(
    readFileSync(
      new URL("../../../supabase/migrations/202610100001_initial.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      new URL(
        "../../../supabase/migrations/202610140001_frontend_integration.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const [id, role] of [
    [teacher, "lecturer"],
    [student, "student"],
    [other, "student"],
  ])
    await db.query("insert into auth.users(id,raw_user_meta_data) values($1,$2)", [
      id,
      JSON.stringify({ name: "Test User", role }),
    ]);
  course = (
    await asUser(teacher, () =>
      db.query<{ id: string }>(
        "insert into courses(owner_id,name) values($1,'Aljabar Linear') returning id",
        [teacher],
      ),
    )
  ).rows[0].id;
  session = (
    await asUser(teacher, () =>
      db.query<{ id: string }>(
        "insert into sessions(course_id,title,starts_at,join_code) values($1,'Transformasi linear',now(),'LINEAR2026') returning id",
        [course],
      ),
    )
  ).rows[0].id;
});
after(() => db.close());
test("student cannot create or start a session, or escalate role", async () => {
  await assert.rejects(
    asUser(student, () =>
      db.query("insert into courses(owner_id,name) values($1,'Forbidden')", [student]),
    ),
  );
  await assert.rejects(
    asUser(student, () => db.query("select session_action($1,'start')", [session])),
  );
  await assert.rejects(
    asUser(student, () => db.query("update profiles set role='lecturer' where id=$1", [student])),
  );
  assert.equal((await asUser(student, () => db.query("select * from sessions"))).rows.length, 0);
});
test("join is idempotent, owner starts session, transcript retry does not duplicate", async () => {
  await asUser(student, () => db.query("select join_session('LINEAR2026')"));
  await asUser(student, () => db.query("select join_session('LINEAR2026')"));
  assert.equal((await asUser(student, () => db.query("select * from sessions"))).rows.length, 1);
  await asUser(teacher, () => db.query("select session_action($1,'start')", [session]));
  const payload = JSON.stringify([{ start: 0, end: 20, text: "Ini materi transformasi linear." }]);
  for (let i = 0; i < 2; i++)
    await asUser(teacher, () =>
      db.query("select append_transcript($1,$2,$3)", [
        session,
        "00000000-0000-4000-8000-000000000099",
        payload,
      ]),
    );
  assert.equal(
    (await asUser(student, () => db.query("select * from transcript_segments"))).rows.length,
    1,
  );
  await assert.rejects(
    asUser(student, () =>
      db.query("select append_transcript($1,gen_random_uuid(),$2)", [session, payload]),
    ),
  );
});
test("shared questions contain no author, votes stay unique and private", async () => {
  question = (
    await asUser(student, () =>
      db.query<{ id: string }>("select ask_question($1,'Apa itu transformasi linear?',10) as id", [
        session,
      ]),
    )
  ).rows[0].id;
  for (let i = 0; i < 2; i++)
    await asUser(student, () => db.query("select support_question($1,true)", [question]));
  const rows = (
    await asUser(teacher, () =>
      db.query<{ votes: number; supported: boolean }>("select * from list_questions($1)", [
        session,
      ]),
    )
  ).rows;
  assert.equal(Number(rows[0].votes), 1);
  assert.equal(rows[0].supported, false);
  assert.equal("user_id" in rows[0], false);
  assert.equal("author_id" in rows[0], false);
  await assert.rejects(asUser(teacher, () => db.query("select * from private.question_authors")));
  await assert.rejects(
    asUser(student, () => db.query("select answer_question($1,'Jawaban',false)", [question])),
  );
  await asUser(teacher, () =>
    db.query(
      "select answer_question($1,'Pemetaan yang mempertahankan penjumlahan dan skala.',false)",
      [question],
    ),
  );
  await asUser(student, () => db.query("select support_question($1,false)", [question]));
  assert.equal(
    Number(
      (
        await asUser(student, () =>
          db.query<{ votes: number }>("select * from list_questions($1)", [session]),
        )
      ).rows[0].votes,
    ),
    0,
  );
});
test("private notes and saved copies are hidden from teacher and other students", async () => {
  await asUser(student, () =>
    db.query("insert into personal_notes values($1,$2,'Catatan rahasia')", [student, session]),
  );
  await asUser(student, () =>
    db.query(
      "insert into saved_items(user_id,session_id,kind,title,text,start_seconds,label) values($1,$2,'bookmark','Bookmark','Salinan pribadi',0,'Bingung')",
      [student, session],
    ),
  );
  for (const id of [teacher, other]) {
    assert.equal((await asUser(id, () => db.query("select * from personal_notes"))).rows.length, 0);
    assert.equal((await asUser(id, () => db.query("select * from saved_items"))).rows.length, 0);
  }
  const aggregate = (
    await asUser(teacher, () =>
      db.query<{ total: number }>("select * from confusion_summary($1)", [session]),
    )
  ).rows;
  assert.equal(Number(aggregate[0].total), 1);
  assert.equal("user_id" in aggregate[0], false);
});
test("ending enqueues once, jobs have exclusive leases and class result enqueues private reviews", async () => {
  await assert.rejects(
    asUser(teacher, () => db.query("select session_action($1,'archive')", [session])),
  );
  await asUser(teacher, () => db.query("select session_action($1,'end')", [session]));
  await assert.rejects(asUser(teacher, () => db.query("select claim_job()")));
  const job = (await db.query<{ job: { id: string; lease: string } }>("select claim_job() as job"))
    .rows[0].job;
  assert.equal((await db.query<{ job: unknown }>("select claim_job() as job")).rows[0].job, null);
  await assert.rejects(
    db.query("select complete_job($1,gen_random_uuid(),$2)", [job.id, JSON.stringify({})]),
  );
  await db.query("select complete_job($1,$2,$3)", [
    job.id,
    job.lease,
    JSON.stringify({ notes: [], graph: { nodes: [], edges: [] }, agenda: [] }),
  ]);
  assert.equal(
    (await db.query<{ status: string }>("select status from sessions where id=$1", [session]))
      .rows[0].status,
    "done",
  );
  assert.equal((await db.query("select * from private.jobs where kind='review'")).rows.length, 1);
});
test("archive hides sources but keeps personal saved copies; restoration reopens class", async () => {
  await asUser(teacher, () => db.query("select session_action($1,'archive')", [session]));
  assert.equal((await asUser(student, () => db.query("select * from sessions"))).rows.length, 0);
  assert.equal(
    (await asUser(student, () => db.query("select * from transcript_segments"))).rows.length,
    0,
  );
  assert.equal((await asUser(student, () => db.query("select * from saved_items"))).rows.length, 1);
  await asUser(teacher, () => db.query("select session_action($1,'restore')", [session]));
  assert.equal((await asUser(student, () => db.query("select * from sessions"))).rows.length, 1);
});
test("AI quotas are per-user and cannot be bypassed with arbitrary actions", async () => {
  for (let i = 0; i < 12; i++)
    assert.equal(
      (
        await asUser(student, () =>
          db.query<{ ok: boolean }>("select consume_limit('capture') as ok"),
        )
      ).rows[0].ok,
      true,
    );
  assert.equal(
    (
      await asUser(student, () =>
        db.query<{ ok: boolean }>("select consume_limit('capture') as ok"),
      )
    ).rows[0].ok,
    false,
  );
  assert.equal(
    (await asUser(other, () => db.query<{ ok: boolean }>("select consume_limit('capture') as ok")))
      .rows[0].ok,
    true,
  );
  assert.equal(
    (
      await asUser(student, () =>
        db.query<{ ok: boolean }>("select consume_limit('unknown') as ok"),
      )
    ).rows[0].ok,
    false,
  );
});
test("private photos and archived shared materials obey storage policies", async () => {
  await asUser(student, () =>
    db.query("insert into storage.objects(bucket_id,name) values('photos',$1)", [
      `${student}/photo.jpg`,
    ]),
  );
  assert.equal(
    (
      await asUser(teacher, () =>
        db.query("select * from storage.objects where bucket_id='photos'"),
      )
    ).rows.length,
    0,
  );
  await assert.rejects(
    asUser(other, () =>
      db.query("insert into storage.objects(bucket_id,name) values('photos',$1)", [
        `${student}/intruder.jpg`,
      ]),
    ),
  );
  const path = `${session}/lesson.pdf`;
  await asUser(teacher, () =>
    db.query("insert into storage.objects(bucket_id,name) values('materials',$1)", [path]),
  );
  const material = (
    await asUser(teacher, () =>
      db.query<{ id: string }>(
        "insert into materials(session_id,name,storage_path) values($1,'Materi.pdf',$2) returning id",
        [session, path],
      ),
    )
  ).rows[0].id;
  assert.equal(
    (
      await asUser(student, () =>
        db.query("select * from storage.objects where bucket_id='materials'"),
      )
    ).rows.length,
    1,
  );
  await asUser(teacher, () => db.query("select archive_material($1,false)", [material]));
  assert.equal(
    (
      await asUser(student, () =>
        db.query("select * from storage.objects where bucket_id='materials'"),
      )
    ).rows.length,
    0,
  );
  await asUser(teacher, () => db.query("select archive_material($1,true)", [material]));
  await db.query("update materials set archived_at=now()-interval '31 days' where id=$1", [
    material,
  ]);
  await assert.rejects(
    asUser(teacher, () => db.query("select archive_material($1,true)", [material])),
  );
});

test("calendar secrets stay server-only and unconfirmed agenda never leaves the app", async () => {
  await assert.rejects(
    asUser(student, () => db.query("select * from private.calendar_connections")),
  );
  await assert.rejects(
    asUser(student, () =>
      db.query("select save_calendar_connection($1,'outlook','encrypted','target','Kuliah')", [
        student,
      ]),
    ),
  );
  await db.query(
    "select save_calendar_connection($1,'outlook','encrypted-for-test','target','Kuliah')",
    [student],
  );
  const id = (
    await asUser(student, () =>
      db.query<{ id: string }>(
        "insert into agenda(user_id,title,due_at,kind) values($1,'Tugas pribadi',now(),'Tugas') returning id",
        [student],
      ),
    )
  ).rows[0].id;
  assert.equal(
    (await db.query("select * from private.calendar_jobs where agenda_id=$1", [id])).rows.length,
    0,
  );
  await asUser(student, () => db.query("update agenda set confirmed=true where id=$1", [id]));
  assert.equal(
    (await db.query("select * from private.calendar_jobs where agenda_id=$1", [id])).rows.length,
    1,
  );
  assert.equal(
    (await asUser(other, () => db.query("select * from calendar_status()"))).rows.length,
    0,
  );
  await assert.rejects(asUser(student, () => db.query("select claim_calendar_job()")));
  const job = (
    await db.query<{ job: { id: string; lease: string; version: string } }>(
      "select claim_calendar_job() as job",
    )
  ).rows[0].job;
  await asUser(student, () =>
    db.query("update agenda set title='Tugas diperbarui' where id=$1", [id]),
  );
  await db.query("select finish_calendar_job($1,$2,$3,'remote-event',false)", [
    job.id,
    job.lease,
    job.version,
  ]);
  const status = (
    await db.query<{ status: string }>("select status from private.calendar_jobs where id=$1", [
      job.id,
    ])
  ).rows[0].status;
  assert.equal(status, "pending");
  await asUser(student, () => db.query("delete from agenda where id=$1", [id]));
  assert.equal(
    (
      await db.query<{ remove: boolean }>(
        "select remove from private.calendar_jobs where agenda_id=$1",
        [id],
      )
    ).rows[0].remove,
    true,
  );
  await asUser(student, () => db.query("select disconnect_calendar('outlook')"));
  assert.equal(
    (await db.query("select * from private.calendar_jobs where user_id=$1", [student])).rows.length,
    0,
  );
});

test("Google onboarding chooses a role only once; notification preferences are private", async () => {
  const google = "00000000-0000-4000-8000-000000000099";
  await db.query(
    "insert into auth.users(id,raw_user_meta_data,raw_app_meta_data) values($1,$2,$3)",
    [
      google,
      JSON.stringify({ name: "Google User", role: "lecturer" }),
      JSON.stringify({ provider: "google" }),
    ],
  );
  assert.equal(
    (await db.query<{ role: string }>("select role from profiles where id=$1", [google])).rows[0]
      .role,
    "student",
  );
  await asUser(google, () => db.query("select complete_onboarding('Google User','lecturer')"));
  await assert.rejects(
    asUser(google, () => db.query("select complete_onboarding('Google User','student')")),
  );
  await asUser(student, () => db.query("select handle_notifications('[\"notice-1\"]'::jsonb)"));
  assert.deepEqual(
    (
      await asUser(student, () =>
        db.query<{ handled_notifications: string[] }>("select handled_notifications from profiles"),
      )
    ).rows[0].handled_notifications,
    ["notice-1"],
  );
});
