"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, GraduationCap, LogOut, RotateCcw } from "lucide-react";
import { Breadcrumbs, Modal, PageHeading } from "@/components/ui";
import { useApp } from "@/state/app-provider";
import { useContent } from "@/data/use-content";
import { liveMode } from "@/lib/app-mode";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { data, reset } = useApp();
  const { courses } = useContent();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);
  const lecturer = data.role === "lecturer";
  const name = data.profile?.name || (liveMode ? "" : lecturer ? "Nadia Putri" : "Davin Farel");
  const profileCourses = courses.filter(
    (course) => liveMode || !lecturer || course.id === "aljabar",
  );
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <>
      <Breadcrumbs items={[{ label: "Profil" }]} />
      <PageHeading title="Profil" />
      <div className="profile-page">
        <section className="profile-content" aria-label="Informasi profil">
          {liveMode && !data.profile ? (
            <p role="status" className="profile-loading">
              Memuat profil…
            </p>
          ) : (
            <>
              <div className="profile-identity">
                <div className="profile-summary">
                  <span className="avatar profile-page-avatar" aria-hidden="true">
                    {initials}
                  </span>
                  <div>
                    <h2>{name}</h2>
                    <div className="profile-meta">
                      <span>{lecturer ? "Dosen" : "Mahasiswa"}</span>
                      <span>
                        {profileCourses.length} course {lecturer ? "diajar" : "diikuti"}
                      </span>
                    </div>
                    {data.profile?.email && <p className="profile-email">{data.profile.email}</p>}
                  </div>
                </div>
              </div>
              <div className="profile-course-section">
                <div className="profile-section-heading">
                  <h2>Course yang {lecturer ? "diajar" : "diikuti"}</h2>
                </div>
                <div className="profile-course-list">
                  {profileCourses.length ? (
                    profileCourses.map((course) => (
                      <Link
                        className="profile-course-row"
                        href={`/classes/${course.id}`}
                        key={course.id}
                      >
                        <GraduationCap size={22} aria-hidden="true" />
                        <div>
                          <h3>{course.name}</h3>
                          <p>
                            {[course.code, !lecturer ? course.teacher : course.days]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    ))
                  ) : (
                    <p className="profile-empty">
                      {lecturer
                        ? "Belum ada course yang dibuat."
                        : "Belum ada course yang diikuti."}
                    </p>
                  )}
                </div>
              </div>
              <div className="profile-account-actions">
                <div>
                  <h2>Akun</h2>
                </div>
                <div className="profile-logout">
                  {error && (
                    <p className="field-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    className="text-button profile-logout-button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError("");
                      try {
                        if (liveMode) await api("auth/logout", "POST", {});
                        router.replace("/login");
                        router.refresh();
                      } catch {
                        setError("Belum bisa keluar. Coba lagi.");
                        setBusy(false);
                      }
                    }}
                  >
                    <LogOut size={16} /> {busy ? "Keluar…" : "Keluar"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
        {!liveMode && (
          <details className="profile-demo">
            <summary>Demo</summary>
            <button className="text-button" onClick={() => setResetting(true)}>
              <RotateCcw size={15} /> Reset demo
            </button>
          </details>
        )}
      </div>
      <Modal
        open={resetting}
        title="Reset demo?"
        subtitle="Semua perubahan lokal akan dihapus."
        onClose={() => setResetting(false)}
      >
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setResetting(false)}>
            Batal
          </button>
          <button
            className="button danger"
            onClick={() => {
              reset();
              setResetting(false);
            }}
          >
            Reset sekarang
          </button>
        </div>
      </Modal>
    </>
  );
}
