"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Bookmark, Check, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui";
import { useApp } from "@/state/app-provider";
import type { Role } from "@/lib/types";
import { liveMode } from "@/lib/app-mode";
import { api } from "@/lib/api";

export function AuthScreen({
  mode,
  setupError = "",
}: {
  mode: "login" | "register";
  setupError?: string;
}) {
  const register = mode === "register";
  const router = useRouter();
  const { update, notify } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (setupError) return;
    if (register && name.trim().length < 2) {
      setError("Tulis nama dengan minimal 2 karakter.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (liveMode) {
      setBusy(true);
      try {
        const result = await api<{ needs_confirmation?: boolean }>(
          `auth/${mode}`,
          "POST",
          register ? { name, email, password, role } : { email, password },
        );
        setPassword("");
        if (result.needs_confirmation) {
          setConfirmation(true);
          return;
        }
        router.push("/");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Belum bisa masuk.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (register) update((data) => ({ ...data, role }));
    // Only demonstrate the frontend flow. Credentials are never stored or sent.
    setPassword("");
    notify("Demo dibuka. Akun belum dibuat atau diverifikasi.");
    router.push("/");
  }

  return (
    <div className="auth-layout">
      <section className="auth-intro">
        <Link href="/" aria-label="ClipThat beranda">
          <Logo />
        </Link>
        <div className="auth-intro-content">
          <h2>Ruang untuk memahami.</h2>
          <p>Ikuti kelas, simpan yang penting, pelajari lagi dengan tenang.</p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="auth-paper-back" />
            <div className="auth-paper">
              <span className="auth-paper-label">CATATAN KELAS</span>
              <strong>Transformasi linear</strong>
              <div className="auth-paper-line" />
              <div className="auth-paper-line short" />
              <div className="auth-paper-highlight">
                <Bookmark size={20} />
                <span>Simpan. Pahami lagi nanti.</span>
              </div>
              <div className="auth-paper-line" />
              <div className="auth-paper-line short" />
            </div>
            <span className="auth-saved-note">
              <Check size={16} />
              Sudah tersimpan
            </span>
          </div>
        </div>
      </section>
      <div className="auth-form-area">
        <div className="auth-card">
          <h1>{register ? "Buat akun" : "Selamat datang kembali."}</h1>
          <p className="auth-subtitle">
            {register ? "Mulai dari satu kelas." : "Lanjutkan dari yang terakhir kamu pelajari."}
          </p>
          {setupError && (
            <p className="field-error" role="alert">
              {setupError}
            </p>
          )}
          <form className="auth-form" onSubmit={submit} onChange={() => setError("")}>
            {confirmation && <p role="status">Cek emailmu untuk mengonfirmasi akun, lalu masuk.</p>}
            {register && (
              <div className="auth-field">
                <label htmlFor="auth-name">Nama lengkap</label>
                <input
                  id="auth-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nama kamu"
                  autoComplete="name"
                  minLength={2}
                  maxLength={60}
                  required
                />
              </div>
            )}
            <div className="auth-field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@kampus.ac.id"
                autoComplete="email"
                maxLength={254}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-password">Kata sandi</label>
              <div className="auth-password">
                <input
                  id="auth-password"
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimal 8 karakter"
                  autoComplete={register ? "new-password" : "current-password"}
                  minLength={8}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  aria-pressed={visible}
                  onClick={() => setVisible((value) => !value)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {register && (
              <fieldset className="auth-role">
                <legend>Aku seorang</legend>
                <div>
                  {(["student", "lecturer"] as const).map((value) => (
                    <label className="auth-role-option" key={value}>
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={role === value}
                        onChange={() => setRole(value)}
                      />
                      <span>{value === "student" ? "Mahasiswa" : "Dosen"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button primary auth-submit"
              type="submit"
              disabled={busy || !!setupError}
            >
              {busy ? "Memproses…" : register ? "Buat akun" : "Masuk"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <Link href={register ? "/login" : "/register"}>{register ? "Masuk" : "Daftar"}</Link>
          </p>
          {!liveMode && (
            <div className="auth-demo">
              <span>Mode demo · gunakan data contoh.</span>
              <span>Akun belum dibuat atau diverifikasi.</span>
              <Link href="/" className="text-button">
                Coba tanpa akun <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
