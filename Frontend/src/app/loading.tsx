export default function Loading() {
  return <div role="status" aria-label="Memuat ruang belajar" className="space-y-8">
    <div className="space-y-3"><div className="h-4 w-28 rounded bg-[#e9ece2]" /><div className="h-9 w-64 rounded bg-[#e9ece2]" /></div>
    <div className="h-56 rounded-xl bg-[#edf0e6]" />
    <div className="h-44 rounded-xl border border-[#e8e8e0] bg-white" />
    <span className="sr-only">Memuat ruang belajar…</span>
  </div>;
}
