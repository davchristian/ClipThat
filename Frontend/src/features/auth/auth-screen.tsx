"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Bookmark, Check, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui";
import { useApp } from "@/state/app-provider";
import type { Role } from "@/lib/types";

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const router = useRouter();
  const { update, notify } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (register && name.trim().length < 2) {
      setError("Tulis nama dengan minimal 2 karakter.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (register) update((data) => ({ ...data, role }));
    // Only demonstrate the frontend flow. Credentials are never stored or sent.
    setPassword("");
    notify("Demo dibuka. Akun belum dibuat atau diverifikasi.", { kind: "info" });
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
          <form className="auth-form" onSubmit={submit} onChange={() => setError("")}>
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
            <button className="button primary auth-submit" type="submit">
              {register ? "Buat akun" : "Masuk"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <Link href={register ? "/login" : "/register"}>{register ? "Masuk" : "Daftar"}</Link>
          </p>
          <div className="auth-demo">
            <span>Mode demo · gunakan data contoh.</span>
            <span>Akun belum dibuat atau diverifikasi.</span>
            <Link href="/">
              Coba tanpa akun <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
