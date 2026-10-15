import Link from "next/link";
import { PageHeading } from "@/components/ui";
export default function NotFound() {
  return (
    <>
      <PageHeading title="Halaman tidak ditemukan" />
      <div className="empty">
        <Link href="/" className="button primary">
          Buka kelas
        </Link>
      </div>
    </>
  );
}
