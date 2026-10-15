// Local HTTP fixture only. SQL/RLS are tested separately against the actual migration.
import { createServer } from "node:http";
const student = "00000000-0000-4000-8000-000000000002";
const teacher = "00000000-0000-4000-8000-000000000001";
const courseId = "00000000-0000-4000-8000-000000000010";
const sessionId = "00000000-0000-4000-8000-000000000020";
const session = {
  id: sessionId,
  course_id: courseId,
  title: "Transformasi linear",
  starts_at: "2026-10-10T02:00:00Z",
  started_at: new Date(Date.now() - 1110000).toISOString(),
  ended_at: null,
  status: "live",
  join_code: "LINEAR2026",
  archived_at: null,
  processing_error: null,
};
const course = { id: courseId, owner_id: teacher, name: "Aljabar Linear", code: "IF2123" };
let saved = [];
let questions = [];
let agenda = [];
const notes = {};
let result = null;
let empty = false;
function token(id) {
  return (
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url") +
    "." +
    Buffer.from(
      JSON.stringify({
        sub: id,
        role: "authenticated",
        aud: "authenticated",
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString("base64url") +
    ".fixture-signature"
  );
}
function user(id) {
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: id === teacher ? "dosen@test.local" : "student@test.local",
    created_at: "2026-10-10T00:00:00Z",
    app_metadata: { provider: "email" },
    user_metadata: { name: id === teacher ? "Nadia Putri" : "Davin Farel" },
  };
}
function userId(req) {
  try {
    return JSON.parse(
      Buffer.from((req.headers.authorization || "").split(".")[1], "base64url").toString(),
    ).sub;
  } catch {
    return student;
  }
}
const transcript = Array.from({ length: 8 }, (_, i) => ({
  id: `00000000-0000-4000-8000-${String(100 + i).padStart(12, "0")}`,
  session_id: sessionId,
  start_seconds: 960 + i * 20,
  end_seconds: 980 + i * 20,
  text: "Sebuah transformasi disebut linear jika mempertahankan penjumlahan dan perkalian skalar. Hasil pemetaan vektor basis menjadi kolom matriks transformasi.",
}));
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:54329");
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString();
  let body = {};
  try {
    body = JSON.parse(raw);
  } catch {}
  const id = userId(req);
  const object = String(req.headers.accept).includes("vnd.pgrst.object");
  function send(data, status = 200) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }
  if (url.pathname === "/health") return send({ ok: true });
  if (url.pathname === "/reset") {
    saved = [];
    questions = [];
    agenda = [];
    result = null;
    session.started_at = new Date(Date.now() - 1110000).toISOString();
    empty = url.searchParams.has("empty");
    session.status = "live";
    session.ended_at = null;
    if (url.searchParams.has("processed")) {
      session.status = "done";
      session.ended_at = new Date().toISOString();
      result = {
        notes: [
          {
            title: "Representasi matriks",
            body: "Setiap hasil pemetaan basis menjadi kolom matriks.",
            source_ids: [transcript[0].id],
          },
        ],
        graph: {
          nodes: [
            {
              id: "basis",
              title: "Basis",
              description: "Vektor pembangun ruang.",
              topics: ["Vektor basis"],
              source_ids: [transcript[0].id],
            },
            {
              id: "matrix",
              title: "Matriks",
              description: "Kolom dari hasil pemetaan basis.",
              topics: ["Kolom matriks"],
              source_ids: [transcript[1].id],
            },
          ],
          edges: [{ from: "basis", to: "matrix", relation: "prasyarat" }],
        },
        agenda_drafts: [
          {
            title: "Latihan matriks",
            kind: "Tugas",
            due_at: "2026-10-16T02:00:00Z",
            source_id: transcript[0].id,
            quote: transcript[0].text,
          },
        ],
      };
    }
    return send({ ok: true });
  }
  if (url.pathname === "/auth/v1/token") {
    if (body.password !== "password123")
      return send({ msg: "Invalid credentials", code: "invalid_credentials" }, 400);
    const who = body.email === "dosen@test.local" ? teacher : student;
    return send({
      access_token: token(who),
      refresh_token: "fixture-refresh",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "bearer",
      user: user(who),
    });
  }
  if (url.pathname === "/auth/v1/user") return send(user(id));
  if (url.pathname === "/auth/v1/logout") return send({});
  const table = url.pathname.replace("/rest/v1/", "");
  if (table === "profiles")
    return send({
      id,
      name: id === teacher ? "Nadia Putri" : "Davin Farel",
      role: id === teacher ? "lecturer" : "student",
      onboarded: true,
      handled_notifications: [],
    });
  if (table === "courses") {
    if (req.method === "POST") {
      empty = false;
      Object.assign(course, body);
      return send(course, 201);
    }
    return send(object ? course : empty ? [] : [course]);
  }
  if (table === "sessions") {
    if (req.method === "POST") {
      Object.assign(session, body, { status: "upcoming" });
      return send(session, 201);
    }
    return send(object ? session : empty ? [] : [session]);
  }
  if (table === "transcript_segments") return send(transcript);
  if (table === "materials") return send([]);
  if (table === "agenda") {
    if (req.method === "POST") {
      const item = { ...body, id: crypto.randomUUID() };
      agenda.push(item);
      return send(item, 201);
    }
    if (req.method === "PATCH") {
      const item = agenda.find((a) => "eq." + a.id === url.searchParams.get("id"));
      if (item) Object.assign(item, body);
      return send(item);
    }
    if (req.method === "DELETE") {
      agenda = agenda.filter((a) => "eq." + a.id !== url.searchParams.get("id"));
      return send(null);
    }
    return send(agenda.filter((a) => a.user_id === id));
  }
  if (table === "session_results")
    return send(object ? result : result ? [{ session_id: sessionId, ...result }] : []);
  if (table === "personal_notes") {
    if (req.method === "POST") {
      notes[id] = body.text;
      return send({});
    }
    return send(notes[id] ? { text: notes[id] } : null);
  }
  if (table === "rpc/calendar_status") return send([]);
  if (table === "rpc/handle_notifications") return send(null);
  if (table === "rpc/correct_graph") {
    if (id !== teacher || body.sid !== sessionId || !result)
      return send({ message: "Only the session owner can correct this graph." }, 403);
    result.graph = body.content;
    return send(null);
  }

  if (table === "session_results" || table === "personal_reviews" || table === "personal_notes")
    return send(null);
  if (table === "saved_items") {
    if (req.method === "POST") {
      const item = { ...body, reviewed: false };
      saved.push(item);
      return send(item, 201);
    }
    if (req.method === "DELETE") {
      saved = saved.filter((s) => "eq." + s.id !== url.searchParams.get("id"));
      return send(null);
    }
    const filtered = saved.filter(
      (s) =>
        (!url.searchParams.get("id") || "eq." + s.id === url.searchParams.get("id")) &&
        s.user_id === id,
    );
    return send(object ? filtered[0] || null : filtered);
  }
  if (table === "rpc/list_questions" || table === "rpc/list_my_questions") return send(questions);
  if (table === "rpc/ask_question") {
    const qid = crypto.randomUUID();
    questions.push({
      id: qid,
      text: body.body,
      session_id: sessionId,
      at_seconds: body.at_seconds,
      votes: 0,
      supported: false,
      answer: null,
      answered_orally: false,
    });
    return send(qid);
  }
  if (table === "rpc/support_question") {
    const q = questions.find((q) => q.id === body.qid);
    if (q && q.supported !== body.support) {
      q.votes += body.support ? 1 : -1;
      q.supported = body.support;
    }
    return send(null);
  }
  if (table === "rpc/answer_question") {
    const q = questions.find((q) => q.id === body.qid);
    if (q) {
      q.answer = body.body;
      q.answered_orally = body.oral;
    }
    return send(null);
  }
  if (table === "rpc/confusion_summary") return send([]);
  if (table === "rpc/consume_limit") return send(true);
  if (table === "rpc/join_session") return send(sessionId);
  if (table === "rpc/session_action") {
    session.status = body.action === "end" ? "processing" : "live";
    if (body.action === "end") session.ended_at = new Date().toISOString();
    return send(session);
  }
  return send({ message: "Fixture endpoint missing", path: url.pathname }, 404);
});
const port = Number(process.env.CLIPTHAT_FIXTURE_PORT || 54339);
server.listen(port, "127.0.0.1", () => console.log(`Supabase HTTP fixture: ${port}`));
