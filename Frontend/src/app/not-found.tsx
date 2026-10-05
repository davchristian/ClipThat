import Link from "next/link";
export default function NotFound() { return <div className="empty"><h1>Halaman ini belum ada.</h1><p>Kembali ke ruang belajarmu untuk melanjutkan.</p><Link href="/" className="button primary">Kembali ke beranda</Link></div>; }
