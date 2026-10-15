"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { api } from "@/lib/api";

type Chunk = { id: string; file: File; offset: number; duration: number };
export function Microphone({
  sessionId,
  startedAt,
  onChange,
  onUploaded,
}: {
  sessionId: string;
  startedAt: string;
  onChange: (busy: boolean) => void;
  onUploaded: () => Promise<void>;
}) {
  const [recording, setRecording] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(false);
  const [starting, setStarting] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const active = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Chunk[]>([]);
  const draining = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    api<{ transcription_configured: boolean }>("health")
      .then((v) => setConfigured(v.transcription_configured))
      .catch(() => {});
    return () => {
      mounted.current = false;
      active.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  useEffect(() => {
    onChange(recording || count > 0 || starting);
  }, [recording, count, starting, onChange]);
  useEffect(() => {
    if (!recording && !count && !starting) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const navigate = (e: MouseEvent) => {
      if ((e.target as Element).closest("a[href]")) {
        e.preventDefault();
        e.stopPropagation();
        setError("Hentikan rekaman dan tunggu semua potongan terkirim sebelum meninggalkan kelas.");
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", navigate, true);
    };
  }, [recording, count, starting]);
  function stop() {
    active.current = false;
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === "recording") {
      setStarting(true);
      recorder.current.stop();
    }
    stream.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }
  async function drain() {
    if (draining.current) return;
    draining.current = true;
    setError("");
    try {
      while (queue.current.length) {
        const chunk = queue.current[0];
        const f = new FormData();
        f.set("file", chunk.file);
        f.set("chunk_id", chunk.id);
        f.set("offset", String(chunk.offset));
        f.set("duration", String(chunk.duration));
        await api(`sessions/${sessionId}/transcribe`, "POST", f);
        queue.current.shift();
        if (mounted.current) {
          setCount(queue.current.length);
          await onUploaded();
        }
      }
    } catch (e) {
      if (mounted.current) {
        stop();
        setError(e instanceof Error ? e.message : "Transkripsi gagal.");
      }
    } finally {
      draining.current = false;
    }
  }
  function nextChunk() {
    if (!active.current || !stream.current) return;
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/mp4";
    const r = new MediaRecorder(stream.current, { mimeType: mime });
    recorder.current = r;
    const pieces: Blob[] = [];
    const start = Date.now();
    const offset = Math.max(0, (start - new Date(startedAt).getTime()) / 1000);
    r.ondataavailable = (e) => {
      if (e.data.size) pieces.push(e.data);
    };
    r.onstop = () => {
      const duration = (Date.now() - start) / 1000;
      if (pieces.length && duration >= 0.1) {
        const ext = mime.includes("webm") ? "webm" : "mp4";
        queue.current.push({
          id: crypto.randomUUID(),
          file: new File(pieces, `audio.${ext}`, { type: mime.split(";")[0] }),
          offset,
          duration,
        });
        if (mounted.current) {
          setCount(queue.current.length);
          void drain();
        }
      }
      if (mounted.current) setStarting(false);
      if (active.current) nextChunk();
    };
    r.onerror = () => {
      stop();
      setError("Mikrofon terputus. Coba mulai rekaman lagi.");
    };
    r.start();
    timer.current = setTimeout(() => {
      if (r.state === "recording") r.stop();
    }, 15000);
  }
  async function start() {
    setStarting(true);
    try {
      if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia)
        throw Error("Browser ini belum mendukung rekaman mikrofon.");
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      active.current = true;
      setRecording(true);
      setError("");
      nextChunk();
    } catch (e) {
      stop();
      setError(e instanceof Error ? e.message : "Mikrofon tidak bisa digunakan.");
    } finally {
      setStarting(false);
    }
  }
  return (
    <section className="panel live-mic">
      <button
        className="button secondary"
        disabled={!configured || starting || (!recording && count > 0)}
        onClick={recording ? stop : start}
      >
        {recording ? <Square size={16} /> : <Mic size={16} />}{" "}
        {starting ? "Menyiapkan…" : recording ? "Hentikan rekaman" : "Rekam suara dosen"}
      </button>
      {count > 0 && <span>{count} potongan menunggu</span>}
      {error && (
        <>
          <p role="alert">{error}</p>
          <button className="button secondary small" onClick={drain}>
            Coba kirim ulang
          </button>
        </>
      )}
      <p>
        {!configured
          ? "Transkripsi belum diaktifkan oleh pengelola aplikasi."
          : recording
            ? "Mikrofon aktif. Transkrip diperbarui per potongan audio."
            : count
              ? "Tunggu semua potongan terkirim sebelum mengakhiri atau meninggalkan kelas."
              : "Suara diambil dari perangkat dosen. Hentikan rekaman sebelum mengakhiri kelas."}
      </p>
    </section>
  );
}
