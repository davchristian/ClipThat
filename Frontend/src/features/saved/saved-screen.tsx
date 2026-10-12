"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Camera, Check, CircleCheck, ChevronRight, Lock, ScanLine } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Empty, PageHeading } from "@/components/ui";
import { courseFor } from "@/lib/demo-data";
import { seconds } from "@/lib/format";
import { SavedDetail } from "./saved-detail";

export function ReviewView() {
  const { data, update, notify } = useApp();
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState<string | null>(null);
  if (data.role === "lecturer")
    return (
      <Empty
        icon={Lock}
        title="Simpanan mahasiswa bersifat pribadi"
        text="Bagian yang ditandai dan capture hanya terlihat oleh mahasiswa yang menyimpannya."
        action={
          <Link className="button secondary" href="/">
            Kembali ke kelas
          </Link>
        }
      />
    );
  const filtered = data.saved.filter(
    (s) => filter === "all" || (filter === "pending" ? !s.reviewed : s.reviewed),
  );
  return (
    <>
      <PageHeading title="Tersimpan" />
      <div className="chip-row">
        {[
          ["pending", "Belum diulang"],
          ["done", "Sudah paham"],
          ["all", "Semua"],
        ].map(([id, text]) => (
          <button
            key={id}
            className={`chip ${filter === id ? "active" : ""}`}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {text}
          </button>
        ))}
      </div>
      <div className="list-panel">
        {filtered.map((item) => {
          const lesson =
            data.lessons.find((s) => s.id === item.sessionId) ||
            data.archived.find((s) => s.lesson.id === item.sessionId)?.lesson;
          const Icon =
            item.type === "capture" ? ScanLine : item.type === "photo" ? Camera : Bookmark;
          return (
            <article className={`saved-row ${item.reviewed ? "reviewed" : ""}`} key={item.id}>
              <span className={`saved-kind ${courseFor(lesson?.courseId || "aljabar").color}`}>
                <Icon size={20} />
              </span>
              <button className="row-main" onClick={() => setSelected(item.id)}>
                <h3>{item.title}</h3>
                <p>
                  {courseFor(lesson?.courseId || "aljabar").name} · {seconds(item.time)}
                </p>
              </button>
              <button
                className="icon-button"
                aria-label={`${item.reviewed ? "Review lagi" : "Tandai sudah paham"}: ${item.title}`}
                aria-pressed={item.reviewed}
                onClick={() => {
                  update((d) => ({
                    ...d,
                    saved: d.saved.map((s) =>
                      s.id === item.id ? { ...s, reviewed: !s.reviewed } : s,
                    ),
                  }));
                  notify(item.reviewed ? "Masuk daftar review." : "Ditandai sudah paham.");
                }}
              >
                <Check size={18} />
              </button>
              <button
                className="icon-button"
                aria-label={`Buka ${item.title}`}
                onClick={() => setSelected(item.id)}
              >
                <ChevronRight size={18} />
              </button>
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <Empty
          icon={filter === "pending" ? CircleCheck : Bookmark}
          title={filter === "pending" ? "Semua sudah diulang" : "Belum ada simpanan"}
          text={
            filter === "pending"
              ? "Tidak ada yang menunggu diulang. Bagian yang kamu simpan berikutnya muncul di sini."
              : filter === "all"
                ? "Saat kelas berlangsung, ketuk penanda di samping kalimat atau tekan Capture 90 detik. Hasilnya tersimpan di sini."
                : "Tandai simpanan sebagai sudah paham setelah kamu mengulangnya."
          }
          action={
            <Link href="/" className="button secondary">
              Buka kelas
            </Link>
          }
        />
      )}
      <SavedDetail
        item={data.saved.find((s) => s.id === selected) || null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
