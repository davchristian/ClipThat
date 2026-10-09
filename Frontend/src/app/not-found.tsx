import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty">
      <h1>Halaman tidak ditemukan</h1>
      <Link href="/" className="button primary">
        Buka kelas
      </Link>
    </div>
  );
}
