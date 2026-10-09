"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RotateCcw } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Modal, PageHeading } from "@/components/ui";
import type { Role } from "@/lib/types";

const integrations = [
  { name: "Google Calendar", mark: "31", url: "https://calendar.google.com" },
  { name: "Notion", mark: "N", url: "https://www.notion.so" },
  { name: "Microsoft Outlook", mark: "O", url: "https://outlook.live.com/calendar" },
];
const preferenceKey = "clipthat-calendar-preferences";

export function SettingsView() {
  const { data, update, reset, notify } = useApp();
  const [connection, setConnection] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState(false);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(preferenceKey) || "{}");
      if (raw && typeof raw === "object") setPreferences(raw);
    } catch {
      /* Use empty preferences. */
    }
  }, []);
  return (
    <>
      <PageHeading title="Pengaturan" />
      <div className="settings-layout">
        <section className="panel">
          <div className="settings-line">
            <span>Peran demo</span>
            <select
              aria-label="Peran aplikasi"
              value={data.role}
              onChange={(e) => update((d) => ({ ...d, role: e.target.value as Role }))}
            >
              <option value="student">Mahasiswa</option>
              <option value="lecturer">Dosen</option>
            </select>
          </div>
        </section>
        {data.role === "student" && (
          <details className="panel settings-calendars">
            <summary>Kalender</summary>
            {integrations.map((app) => (
              <div className="integration-row" key={app.name}>
                <span className="integration-logo">{app.mark}</span>
                <div className="row-main">
                  <h3>{app.name}</h3>
                  <p>
                    {preferences[app.name]
                      ? `Tujuan: ${preferences[app.name]} · belum terhubung`
                      : "Belum terhubung"}
                  </p>
                </div>
                <button
                  className="button secondary small"
                  onClick={() => {
                    setConnection(app.name);
                    setTarget(preferences[app.name] || "Kalender kuliah");
                  }}
                >
                  Atur tujuan
                </button>
              </div>
            ))}
          </details>
        )}
        <button className="text-button reset-button" onClick={() => setResetting(true)}>
          <RotateCcw size={15} />
          Reset demo
        </button>
        <p className="demo-note">
          Mode demo · data disimpan di browser. AI dan akun kalender belum terhubung.
        </p>
      </div>
      <Modal
        open={!!connection}
        title={connection || "Kalender"}
        onClose={() => setConnection(null)}
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!connection || !target.trim()) return;
            const next = { ...preferences, [connection]: target.trim() };
            setPreferences(next);
            try {
              localStorage.setItem(preferenceKey, JSON.stringify(next));
              notify("Tujuan tersimpan. Akun belum terhubung.");
            } catch {
              notify("Penyimpanan browser penuh.");
            }
            setConnection(null);
          }}
        >
          <label>
            {connection === "Notion" ? "Nama halaman tujuan" : "Nama kalender tujuan"}
            <input
              value={target}
              maxLength={60}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </label>
          <p className="field-hint">Menyimpan tujuan saja, belum menyinkronkan akun.</p>
          <div className="dialog-actions">
            <a
              className="text-button mr-auto"
              href={integrations.find((a) => a.name === connection)?.url}
              target="_blank"
              rel="noreferrer"
            >
              Buka aplikasi
              <ExternalLink size={13} />
            </a>
            <button className="button primary" disabled={!target.trim()}>
              Simpan tujuan
            </button>
          </div>
        </form>
      </Modal>
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
              setPreferences({});
              try {
                localStorage.removeItem(preferenceKey);
              } catch {
                /* App state still resets. */
              }
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
