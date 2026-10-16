"use client";
import { Copy } from "lucide-react";
import { useApp } from "@/state/app-provider";

export function CourseCode({ code }: { code?: string }) {
  const { notify } = useApp();
  if (!code) return <span className="muted">Kode course belum tersedia.</span>;
  return (
    <button
      className="text-button"
      aria-label={`Salin kode course ${code}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          notify("Kode course disalin.");
        } catch {
          notify(`Kode course: ${code}`);
        }
      }}
    >
      Kode: {code} <Copy size={14} />
    </button>
  );
}
