"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { api } from "@/lib/api";
import { deepgramResult, type SpeechDraft, type SpeechSegment } from "./deepgram-results";

type Batch = { chunk_id: string; segments: SpeechSegment[] };
export function DeepgramMicrophone({
  sessionId,
  startedAt,
  onChange,
  onUploaded,
  onDraft,
}: {
  sessionId: string;
  startedAt: string;
  onChange: (busy: boolean) => void;
  onUploaded: () => Promise<void>;
  onDraft?: (draft: SpeechDraft) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "connecting" | "recording" | "finishing">("idle");
  const [pending, setPending] = useState(0);
  const [error, setError] = useState("");
  const socket = useRef<WebSocket | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const unsaved = useRef<SpeechSegment[]>([]);
  const batches = useRef<Batch[]>([]);
  const interim = useRef<SpeechSegment | null>(null);
  const saving = useRef(false);
  const failed = useRef(false);
  const mounted = useRef(true);
  const finishing = useRef(false);
  const callbacks = useRef({ onUploaded, onDraft });
  callbacks.current = { onUploaded, onDraft };
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function publish() {
    if (!mounted.current) return;
    const segments = [
      ...batches.current.flatMap((b) => b.segments),
      ...unsaved.current,
      ...(interim.current ? [interim.current] : []),
    ];
    setPending(batches.current.length + (unsaved.current.length ? 1 : 0));
    callbacks.current.onDraft?.(
      segments.length
        ? { time: segments[0].start, text: segments.map((s) => s.text).join(" ") }
        : null,
    );
  }
  async function persist() {
    if (saving.current || !mounted.current) return;
    saving.current = true;
    if (unsaved.current.length)
      batches.current.push({
        chunk_id: crypto.randomUUID(),
        segments: unsaved.current.splice(0, 200),
      });
    publish();
    try {
      while (batches.current.length && mounted.current) {
        await api(`sessions/${sessionId}/transcript`, "POST", batches.current[0]);
        // Retain the same batch ID if a refresh fails; append_transcript is idempotent.
        await callbacks.current.onUploaded();
        batches.current.shift();
        publish();
      }
      failed.current = false;
    } catch (e) {
      failed.current = true;
      if (mounted.current) {
        setError(e instanceof Error ? e.message : "Transkrip belum tersimpan. Coba kirim ulang.");
        stop();
      }
    } finally {
      saving.current = false;
      if (
        mounted.current &&
        !failed.current &&
        unsaved.current.length &&
        socket.current?.readyState === WebSocket.CLOSED
      )
        void persist();
    }
  }
  function stop() {
    finishing.current = true;
    setPhase("finishing");
    if (recorder.current?.state === "recording") recorder.current.stop();
    else if (socket.current?.readyState === WebSocket.OPEN)
      socket.current.send(JSON.stringify({ type: "CloseStream" }));
    else socket.current?.close();
    stream.current?.getTracks().forEach((t) => t.stop());
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!socket.current || socket.current.readyState === WebSocket.CLOSED) {
      setPhase("idle");
      return;
    }
    closeTimer.current = setTimeout(() => {
      if (socket.current?.readyState !== WebSocket.CLOSED) {
        setError(
          "Deepgram belum menyelesaikan audio terakhir. Sebagian ucapan terakhir mungkin belum diterima.",
        );
        socket.current?.close();
      }
    }, 10000);
  }
  useEffect(() => {
    onChange(phase !== "idle" || pending > 0);
  }, [phase, pending, onChange]);
  useEffect(() => {
    if (phase === "idle" && !pending) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    const navigate = (e: MouseEvent) => {
      if ((e.target as Element).closest("a[href]")) {
        e.preventDefault();
        e.stopPropagation();
        setError("Hentikan rekaman dan tunggu transkrip tersimpan sebelum meninggalkan kelas.");
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", navigate, true);
    };
  }, [phase, pending]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (interval.current) clearInterval(interval.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      socket.current?.close();
    };
  }, []);
  async function start() {
    setPhase("connecting");
    setError("");
    finishing.current = false;
    try {
      if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia)
        throw new Error("Browser belum mendukung rekaman mikrofon.");
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      if (!mime)
        throw new Error("Format audio browser belum didukung. Coba Chrome atau Edge terbaru.");
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        stream.current.getTracks().forEach((t) => t.stop());
        return;
      }
      const { access_token } = await api<{ access_token: string }>(
        `sessions/${sessionId}/speech-token`,
        "POST",
      );
      if (!mounted.current) return;
      const url = new URL("wss://api.deepgram.com/v1/listen");
      url.search = new URLSearchParams({
        model: "nova-3",
        language: "id",
        interim_results: "true",
        punctuate: "true",
        smart_format: "true",
        endpointing: "500",
      }).toString();
      const ws = new WebSocket(url, ["bearer", access_token]);
      socket.current = ws;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error("Koneksi Deepgram timeout. Periksa jaringan dan kredit proyek."));
        }, 15000);
        ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };
        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Koneksi Deepgram gagal. Periksa jaringan dan akses proyek."));
        };
        ws.onclose = () => {
          clearTimeout(timeout);
          reject(new Error("Deepgram menutup koneksi sebelum rekaman dimulai."));
        };
      });
      if (!mounted.current) {
        ws.close();
        return;
      }
      const offset = Math.max(0, (Date.now() - new Date(startedAt).getTime()) / 1000);
      const r = new MediaRecorder(stream.current!, { mimeType: mime });
      recorder.current = r;
      ws.onmessage = (event) => {
        if (!mounted.current) return;
        try {
          const value = JSON.parse(event.data);
          if (value.type === "Error") {
            setError(
              "Deepgram gagal memproses audio. Periksa kredit dan model di konsol Deepgram.",
            );
            stop();
            return;
          }
          const result = deepgramResult(value, offset);
          if (!result) return;
          if (result.final) {
            unsaved.current.push(result.segment);
            interim.current = null;
          } else interim.current = result.segment;
          publish();
        } catch {
          setError("Pesan transkrip Deepgram tidak valid.");
          stop();
        }
      };
      ws.onerror = () => {
        setError("Koneksi transkripsi terganggu. Hentikan dan mulai ulang rekaman.");
        stop();
      };
      ws.onclose = () => {
        if (!mounted.current) return;
        if (!finishing.current)
          setError("Koneksi Deepgram terputus. Mulai ulang rekaman untuk melanjutkan.");
        if (interval.current) clearInterval(interval.current);
        if (closeTimer.current) clearTimeout(closeTimer.current);
        if (r.state === "recording") r.stop();
        stream.current?.getTracks().forEach((t) => t.stop());
        interim.current = null;
        setPhase("idle");
        publish();
        if (!failed.current) void persist();
      };
      r.ondataavailable = (event) => {
        if (event.data.size && ws.readyState === WebSocket.OPEN) {
          if (ws.bufferedAmount > 1024 * 1024) {
            setError("Jaringan terlalu lambat untuk streaming. Rekaman dihentikan.");
            stop();
            return;
          }
          ws.send(event.data);
        }
      };
      r.onstop = () => {
        if (mounted.current && ws.readyState === WebSocket.OPEN)
          ws.send(JSON.stringify({ type: "CloseStream" }));
      };
      r.onerror = () => {
        setError("Mikrofon terputus. Coba mulai ulang rekaman.");
        stop();
      };
      r.start(250);
      setPhase("recording");
      // Persist finals in batches to stay within the existing server rate limit.
      interval.current = setInterval(() => {
        if (!failed.current) void persist();
      }, 5000);
    } catch (e) {
      stream.current?.getTracks().forEach((t) => t.stop());
      socket.current?.close();
      if (mounted.current) {
        setPhase("idle");
        setError(e instanceof Error ? e.message : "Tidak bisa memulai Deepgram.");
      }
    }
  }
  return (
    <section className="live-mic" aria-label="Rekaman kelas">
      <div className="mic-control-row">
        <button
          className="button secondary"
          disabled={
            phase === "connecting" || phase === "finishing" || (phase === "idle" && pending > 0)
          }
          onClick={phase === "recording" ? stop : start}
        >
          {phase === "recording" ? <Square size={16} /> : <Mic size={16} />}
          {phase === "recording"
            ? "Hentikan rekaman"
            : phase === "connecting"
              ? "Menghubungkan…"
              : phase === "finishing"
                ? "Menyelesaikan…"
                : "Rekam suara dosen"}
        </button>
        <span className="mic-status" role="status">
          {phase === "recording"
            ? "Transkripsi langsung · Deepgram"
            : phase === "finishing"
              ? "Menunggu hasil akhir…"
              : pending
                ? "Menyimpan transkrip…"
                : "Siap merekam · Deepgram"}
        </span>
      </div>
      {error && (
        <div className="mic-error">
          <p role="alert">{error}</p>
          {pending > 0 && (
            <button
              className="button secondary small"
              onClick={() => {
                setError("");
                void persist();
              }}
            >
              Coba kirim ulang
            </button>
          )}
        </div>
      )}
    </section>
  );
}
