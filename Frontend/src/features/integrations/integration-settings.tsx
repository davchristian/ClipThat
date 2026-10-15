"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Link2, LogOut, RefreshCw, Unplug } from "lucide-react";
import { api } from "@/lib/api";
import { Breadcrumbs, Modal, PageHeading } from "@/components/ui";
import { useApp } from "@/state/app-provider";
type Provider = "outlook" | "google" | "notion";
type Connection = {
  provider: Provider;
  configured: boolean;
  connected: boolean;
  destination?: string;
  destination_name?: string;
  pending?: number;
  failed?: number;
};
const names: Record<Provider, string> = {
  outlook: "Microsoft Outlook",
  google: "Google Calendar",
  notion: "Notion",
};
export function IntegrationSettings() {
  const { data, notify } = useApp();
  const search = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [targets, setTargets] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [disconnect, setDisconnect] = useState<Provider | null>(null);
  const load = useCallback(async () => {
    try {
      setConnections(await api<Connection[]>("integrations"));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Koneksi belum dapat diperiksa.");
    }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 15000);
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => {
    if (search.get("integration") === "failed")
      setError("Koneksi belum berhasil. Mulai lagi dari tombol Hubungkan.");
  }, [search]);
  async function work(fn: () => Promise<unknown>, message?: string) {
    setBusy(true);
    try {
      await fn();
      if (message) notify(message);
      await load();
      return true;
    } catch (e) {
      notify(e instanceof Error ? e.message : "Koneksi gagal.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function choose(c: Connection) {
    setBusy(true);
    try {
      const destinations = await api<{ id: string; name: string }[]>(
        `integrations/${c.provider}/destinations`,
      );
      setTargets(destinations);
      setSelected(c.destination || destinations[0]?.id || "");
      setEditing(c.provider);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Tujuan belum dapat dimuat.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Breadcrumbs items={[{ label: "Pengaturan" }]} />
      <PageHeading title="Pengaturan" />
      <div className="settings-layout">
        <section className="panel">
          <h2>Akun</h2>
          <div className="settings-line">
            <span>{data.profile?.name}</span>
            <span>{data.role === "lecturer" ? "Dosen" : "Mahasiswa"}</span>
          </div>
          <button
            className="text-button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api("auth/logout", "POST", {});
                window.location.assign("/login");
              } catch {
                notify("Belum bisa keluar. Coba lagi.");
                setBusy(false);
              }
            }}
          >
            <LogOut size={16} /> Keluar
          </button>
        </section>
        {data.role === "student" && (
          <section className="panel integration-settings">
            <h2>Hubungkan agenda</h2>
            <p className="muted">Agenda yang kamu konfirmasi dikirim ke tujuan pilihanmu.</p>
            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}
            {connections.map((c) => (
              <div className="integration-row" key={c.provider}>
                <span className="integration-logo">
                  <CalendarDays size={21} />
                </span>
                <div className="row-main">
                  <h3>{names[c.provider]}</h3>
                  <p>
                    {c.connected
                      ? c.destination_name || "Pilih tujuan agenda"
                      : c.configured
                        ? "Belum terhubung"
                        : "Koneksi belum tersedia"}
                  </p>
                  {c.connected && !!Number(c.pending) && (
                    <small>{c.pending} agenda menunggu sinkronisasi</small>
                  )}
                  {c.connected && !!Number(c.failed) && (
                    <small>{c.failed} agenda perlu dicoba ulang</small>
                  )}
                </div>
                <div className="integration-actions">
                  {c.connected ? (
                    <>
                      <button
                        className="button secondary small"
                        disabled={busy}
                        onClick={() => void choose(c)}
                      >
                        Pilih tujuan
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Sinkronkan ${names[c.provider]}`}
                        disabled={busy || !c.destination}
                        onClick={() =>
                          void work(
                            () => api(`integrations/${c.provider}/sync`, "POST", {}),
                            "Agenda masuk antrean sinkronisasi.",
                          )
                        }
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Putuskan ${names[c.provider]}`}
                        disabled={busy}
                        onClick={() => setDisconnect(c.provider)}
                      >
                        <Unplug size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      className="button secondary small"
                      disabled={busy || !c.configured}
                      onClick={() =>
                        void work(async () => {
                          const { url } = await api<{ url: string }>(
                            `integrations/${c.provider}/connect`,
                            "POST",
                            {},
                          );
                          window.location.assign(url);
                        })
                      }
                    >
                      <Link2 size={15} /> Hubungkan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
      <Modal
        open={!!editing}
        title={`Tujuan ${editing ? names[editing] : "agenda"}`}
        onClose={() => setEditing(null)}
      >
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              editing &&
              (await work(
                () => api(`integrations/${editing}/destination`, "PUT", { id: selected }),
                "Tujuan disimpan. Agenda siap disinkronkan.",
              ))
            )
              setEditing(null);
          }}
        >
          <label>
            Tujuan agenda
            <select value={selected} onChange={(e) => setSelected(e.target.value)} required>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          {!targets.length && (
            <p>
              Belum ada tujuan yang dapat diakses. Berikan akses kalender atau database, lalu coba
              lagi.
            </p>
          )}
          {editing === "notion" && (
            <p className="field-hint">Pilih database dengan kolom Name, Date, dan ClipThatID.</p>
          )}
          <button className="button primary" disabled={busy || !selected}>
            Simpan tujuan
          </button>
        </form>
      </Modal>
      <Modal
        open={!!disconnect}
        title="Putuskan koneksi?"
        subtitle="Sinkronisasi akan berhenti. Agenda yang sudah dikirim tetap ada di kalender tujuan."
        onClose={() => setDisconnect(null)}
      >
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setDisconnect(null)}>
            Batal
          </button>
          <button
            className="button danger"
            disabled={busy}
            onClick={async () => {
              if (
                disconnect &&
                (await work(
                  () => api(`integrations/${disconnect}`, "DELETE"),
                  "Koneksi diputuskan.",
                ))
              )
                setDisconnect(null);
            }}
          >
            Putuskan
          </button>
        </div>
      </Modal>
    </>
  );
}
