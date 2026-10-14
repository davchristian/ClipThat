"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  CalendarDays,
  GraduationCap,
  LoaderCircle,
  LogOut,
  Menu,
  Plus,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { Logo, Modal, Empty, PageHeading } from "@/components/ui";
import { api, RequestError } from "@/lib/api";
import type {
  Boot,
  BackendCourse,
  BackendSession,
  BackendSaved,
  BackendAgenda,
} from "@/lib/backend-types";
import { seconds } from "@/lib/format";
import { LiveSession } from "./session";
import { useApp } from "@/state/app-provider";

export function LiveWorkspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const authPage = ["/login", "/register"].includes(pathname);
  const router = useRouter();
  const { notify } = useApp();
  const [boot, setBoot] = useState<Boot | null>(null);
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const main = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    try {
      setBoot(await api<Boot>("boot"));
      setError("");
    } catch (e) {
      if (e instanceof RequestError && e.status === 401) {
        setBoot(null);
        router.replace("/login");
      } else setError(e instanceof Error ? e.message : "Gagal memuat kelas.");
    }
  }, [router]);
  useEffect(() => {
    if (!authPage) void load();
  }, [authPage, load]);
  useEffect(() => {
    setMobile(false);
    main.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  const action = useCallback(
    async (work: () => Promise<unknown>, message?: string) => {
      setBusy(true);
      try {
        await work();
        await load();
        if (message) notify(message);
        return true;
      } catch (e) {
        notify(e instanceof Error ? e.message : "Permintaan gagal.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [load, notify],
  );
  if (authPage) return <main className="auth-page">{children}</main>;
  if (!boot)
    return (
      <main className="live-loading">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="button secondary" onClick={load}>
              Coba lagi
            </button>
            <Link href="/login">Kembali ke login</Link>
          </>
        ) : (
          <LoaderCircle className="spin" aria-label="Memuat akun" />
        )}
      </main>
    );
  const lecturer = boot.profile.role === "lecturer";
  const sessionId = pathname.startsWith("/session/") ? pathname.split("/")[2] : null;
  const courses = pathname.startsWith("/classes/")
    ? boot.courses.filter((c) => c.id === pathname.split("/")[2])
    : boot.courses;
  const links = [
    { href: "/", label: "Kelas", icon: GraduationCap },
    { href: "/review", label: "Tersimpan", icon: Bookmark },
    { href: "/agenda", label: "Agenda", icon: CalendarDays },
  ];
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Langsung ke isi
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Tutup navigasi"
          onClick={() => setMobile(false)}
        />
      )}
      <aside id="live-sidebar" className={`sidebar ${mobile ? "is-open" : ""}`}>
        <Link href="/" className="brand-link" aria-label="ClipThat beranda">
          <Logo />
        </Link>
        <nav aria-label="Navigasi utama">
          {links
            .filter((l) => !lecturer || l.href === "/")
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-item ${l.href === "/" ? (pathname === "/" || sessionId || pathname.startsWith("/classes") ? "active" : "") : pathname === l.href ? "active" : ""}`}
              >
                <l.icon size={20} />
                {l.label}
              </Link>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/settings" className="nav-item">
            <Settings2 size={19} />
            Pengaturan
          </Link>
          <button
            className="nav-item"
            disabled={busy}
            onClick={() =>
              action(async () => {
                await api("auth/logout", "POST");
                setBoot(null);
                router.replace("/login");
                router.refresh();
              })
            }
          >
            <LogOut size={19} />
            Keluar
          </button>
          <div className="profile">
            <span className="avatar">
              {boot.profile.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div className="profile-info">
              <strong>{boot.profile.name}</strong>
              <span>{lecturer ? "Dosen" : "Mahasiswa"}</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-wrapper" ref={main}>
        <header className="mobile-topbar">
          <button
            className="icon-button"
            aria-label="Buka navigasi"
            aria-expanded={mobile}
            aria-controls="live-sidebar"
            onClick={() => setMobile(!mobile)}
          >
            <Menu size={22} />
          </button>
          <Logo />
          <button
            className="icon-button"
            aria-label="Tutup navigasi"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </button>
        </header>
        <main id="main-content" className="page-container" tabIndex={-1}>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          {sessionId ? (
            <LiveSession key={sessionId} id={sessionId} boot={boot} refresh={load} />
          ) : pathname === "/review" ? (
            <LiveSaved saved={boot.saved} action={action} />
          ) : pathname === "/agenda" ? (
            <LiveAgenda items={boot.agenda} action={action} />
          ) : pathname === "/settings" ? (
            <>
              <PageHeading title="Pengaturan" />
              <section className="panel">
                <h2>{boot.profile.name}</h2>
                <p>{lecturer ? "Dosen" : "Mahasiswa"}</p>
                <p className="demo-note">
                  Google Calendar, Notion, dan Outlook belum terhubung. Agenda tersedia di aplikasi.
                </p>
              </section>
            </>
          ) : (
            <>
              <PageHeading
                title="Kelas"
                action={
                  <button className="button primary" onClick={() => setCreating(true)}>
                    <Plus size={16} />
                    {lecturer ? "Buat kelas" : "Gabung kelas"}
                  </button>
                }
              />
              {!courses.length && (
                <Empty
                  title={lecturer ? "Mulai kelas pertamamu" : "Belum ada kelas"}
                  text={
                    lecturer
                      ? "Buat mata kuliah, lalu mulai satu sesi."
                      : "Masukkan kode dari dosen untuk bergabung."
                  }
                />
              )}
              {courses.map((course) => (
                <section key={course.id} className="live-course">
                  <h2>{course.name}</h2>
                  <p className="live-muted">{course.code}</p>
                  <div className="live-session-list">
                    {boot.sessions
                      .filter((s) => s.course_id === course.id && !s.archived_at)
                      .map((s) => (
                        <SessionCard key={s.id} session={s} />
                      ))}
                    {!boot.sessions.some((s) => s.course_id === course.id && !s.archived_at) && (
                      <p>Belum ada pertemuan.</p>
                    )}
                  </div>
                </section>
              ))}
              {lecturer && (
                <details className="panel">
                  <summary>Arsip kelas</summary>
                  {boot.sessions
                    .filter((s) => s.archived_at)
                    .map((s) => (
                      <div className="live-row" key={s.id}>
                        <span>{s.title}</span>
                        <button
                          className="button secondary small"
                          disabled={busy}
                          onClick={() =>
                            action(
                              () => api(`sessions/${s.id}/restore`, "POST", {}),
                              "Kelas dipulihkan.",
                            )
                          }
                        >
                          Pulihkan
                        </button>
                      </div>
                    ))}
                </details>
              )}
            </>
          )}
        </main>
      </div>
      <CreateClass
        open={creating}
        onClose={() => setCreating(false)}
        lecturer={lecturer}
        courses={boot.courses.filter((c) => c.owner_id === boot.profile.id)}
        action={action}
      />
    </div>
  );
}
type Action = (work: () => Promise<unknown>, message?: string) => Promise<boolean>;
function SessionCard({ session: s }: { session: BackendSession }) {
  const labels = {
    live: "Live",
    upcoming: "Akan datang",
    processing: "Menyiapkan catatan",
    done: "Selesai",
    failed: "Perlu dicoba ulang",
  };
  return (
    <Link className="panel live-session-card" href={`/session/${s.id}`}>
      <span className={`badge ${s.status === "live" ? "live" : ""}`}>{labels[s.status]}</span>
      <h3>{s.title}</h3>
      <p>
        {new Date(s.starts_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </Link>
  );
}
function CreateClass({
  open,
  onClose,
  lecturer,
  courses,
  action,
}: {
  open: boolean;
  onClose: () => void;
  lecturer: boolean;
  courses: BackendCourse[];
  action: Action;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || "");
  return (
    <Modal open={open} title={lecturer ? "Buat pertemuan" : "Gabung kelas"} onClose={onClose}>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setBusy(true);
          const ok = await action(async () => {
            if (!lecturer) {
              const joined = await api<{ id: string }>("sessions/join", "POST", {
                code: String(form.get("code")).trim(),
              });
              router.push(`/session/${joined.id}`);
              return;
            }
            let courseId = String(form.get("course") || "");
            if (!courseId) {
              const c = await api<BackendCourse>("courses", "POST", {
                name: form.get("course_name"),
                code: "",
              });
              courseId = c.id;
            }
            const s = await api<BackendSession>("sessions", "POST", {
              course_id: courseId,
              title: form.get("title"),
              starts_at: new Date(String(form.get("starts_at"))).toISOString(),
            });
            router.push(`/session/${s.id}`);
          });
          setBusy(false);
          if (ok) onClose();
        }}
      >
        {lecturer ? (
          <>
            {courses.length > 0 && (
              <label>
                Mata kuliah
                <select
                  name="course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="">+ Mata kuliah baru</option>
                </select>
              </label>
            )}
            {!selectedCourse && (
              <label>
                Nama mata kuliah
                <input name="course_name" minLength={2} maxLength={120} required />
              </label>
            )}
            <label>
              Topik pertemuan
              <input name="title" minLength={2} maxLength={160} required />
            </label>
            <label>
              Waktu kelas
              <input type="datetime-local" name="starts_at" required />
            </label>
          </>
        ) : (
          <label>
            Kode kelas
            <input name="code" autoCapitalize="characters" minLength={6} maxLength={12} required />
          </label>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? "Memproses…" : lecturer ? "Buat pertemuan" : "Gabung"}
        </button>
      </form>
    </Modal>
  );
}
function LiveSaved({ saved, action }: { saved: BackendSaved[]; action: Action }) {
  const [selected, setSelected] = useState<BackendSaved | null>(null);
  return (
    <>
      <PageHeading title="Tersimpan" />
      {!saved.length && (
        <Empty title="Belum ada yang disimpan" text="Simpan bagian penting saat mengikuti kelas." />
      )}
      <div className="live-session-list">
        {saved.map((s) => (
          <article key={s.id} className="panel">
            <button className="live-saved-open" onClick={() => setSelected(s)}>
              <span className="live-muted">
                {s.kind} · {seconds(s.start_seconds)}
              </span>
              <h3>{s.title}</h3>
              <p>{(s.summary || s.text).slice(0, 180)}</p>
            </button>
            <div className="live-row">
              <button
                className="text-button"
                onClick={() =>
                  action(() => api(`saved/${s.id}`, "PATCH", { reviewed: !s.reviewed }))
                }
              >
                {s.reviewed ? "Sudah direview" : "Tandai selesai"}
              </button>
              <button
                className="icon-button"
                aria-label={`Hapus ${s.title}`}
                onClick={() => action(() => api(`saved/${s.id}`, "DELETE"), "Dihapus.")}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <Modal
        open={!!selected}
        title={selected?.title || "Tersimpan"}
        onClose={() => setSelected(null)}
      >
        <p>{selected?.summary || selected?.text}</p>
        {selected?.summary && (
          <details>
            <summary>Transkrip sumber</summary>
            <p>{selected.text}</p>
          </details>
        )}
        {selected?.kind === "photo" && (
          <button
            className="button secondary"
            onClick={() =>
              action(async () => {
                const file = await api<{ signedUrl: string }>(`files/photos/${selected.id}`);
                window.open(file.signedUrl, "_blank", "noopener,noreferrer");
              })
            }
          >
            Buka foto
          </button>
        )}
        {selected?.session_id && (
          <Link className="button secondary" href={`/session/${selected.session_id}`}>
            Buka kelas
          </Link>
        )}
      </Modal>
    </>
  );
}
function LiveAgenda({ items, action }: { items: BackendAgenda[]; action: Action }) {
  const [editing, setEditing] = useState<BackendAgenda | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const current = typeof editing === "object" ? editing : null;
  return (
    <>
      <PageHeading
        title="Agenda"
        action={
          <button className="button primary" onClick={() => setEditing("new")}>
            <Plus size={16} />
            Tambah
          </button>
        }
      />
      {!items.length && <Empty title="Agendamu masih kosong" />}
      {items.map((a) => (
        <article className="panel live-row" key={a.id}>
          <input
            type="checkbox"
            aria-label={`Selesai ${a.title}`}
            checked={a.done}
            onChange={() => action(() => api(`agenda/${a.id}`, "PATCH", { done: !a.done }))}
          />
          <div className="row-main">
            <h3>{a.title}</h3>
            <p>
              {new Date(a.due_at).toLocaleString("id-ID")} · {a.confirmed ? "Dikonfirmasi" : "Draf"}
            </p>
          </div>
          <button className="button secondary small" onClick={() => setEditing(a)}>
            Edit
          </button>
          <button
            className="icon-button"
            aria-label={`Hapus ${a.title}`}
            onClick={() => action(() => api(`agenda/${a.id}`, "DELETE"))}
          >
            <Trash2 size={18} />
          </button>
        </article>
      ))}
      <Modal
        open={!!editing}
        title={current ? "Edit agenda" : "Tambah agenda"}
        onClose={() => setEditing(null)}
      >
        <form
          key={current?.id || "new"}
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            const ok = await action(() =>
              api(current ? `agenda/${current.id}` : "agenda", current ? "PATCH" : "POST", {
                title: f.get("title"),
                kind: f.get("kind"),
                due_at: new Date(String(f.get("date"))).toISOString(),
                confirmed: true,
              }),
            );
            setBusy(false);
            if (ok) setEditing(null);
          }}
        >
          <label>
            Judul
            <input
              name="title"
              defaultValue={current?.title}
              required
              minLength={2}
              maxLength={160}
            />
          </label>
          <label>
            Waktu
            <input
              name="date"
              type="datetime-local"
              defaultValue={
                current
                  ? new Date(
                      new Date(current.due_at).getTime() - new Date().getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              required
            />
          </label>
          <label>
            Jenis
            <select name="kind" defaultValue={current?.kind || "Belajar"}>
              <option>Tugas</option>
              <option>Kuis</option>
              <option>Belajar</option>
            </select>
          </label>
          <button className="button primary" disabled={busy}>
            Simpan agenda
          </button>
        </form>
      </Modal>
    </>
  );
}
