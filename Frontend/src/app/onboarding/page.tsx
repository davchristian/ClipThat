"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui";
import { api } from "@/lib/api";
import type { Role } from "@/lib/types";
export default function Onboarding() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="onboarding-layout">
      <Logo />
      <div className="auth-card">
        <h1>Kenalan dulu, yuk.</h1>
        <p className="auth-subtitle">Lengkapi akunmu untuk mulai.</p>
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setBusy(true);
            try {
              await api("auth/onboarding", "POST", { name: form.get("name"), role });
              router.replace("/");
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Akun belum siap.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Nama lengkap
            <input name="name" autoComplete="name" minLength={2} maxLength={60} required />
          </label>
          <fieldset className="auth-role">
            <legend>Aku seorang</legend>
            <div>
              {(["student", "lecturer"] as const).map((value) => (
                <label className="auth-role-option" key={value}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === value}
                    onChange={() => setRole(value)}
                  />
                  <span>{value === "student" ? "Mahasiswa" : "Dosen"}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? "Menyiapkan…" : "Mulai"}
          </button>
        </form>
      </div>
    </div>
  );
}
