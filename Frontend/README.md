# ClipThat - Next.js app

Frontend dan backend menggunakan aplikasi yang sama. Tampilan baru tetap dipakai untuk mode demo maupun akun asli.

```powershell
npm.cmd install
npm.cmd run dev
```

Buka http://localhost:3000. Tanpa konfigurasi, mode demo tetap tersedia. Untuk akun asli, baca [panduan setup](docs/backend-setup.md), salin `.env.example` ke `.env.local`, jalankan kedua migration, lalu aktifkan mode live.

## Alur

- Home -> Course -> sesi kelas, dengan empat tab: Transkrip, Catatan, Pertanyaan, Materi.
- Capture 90 detik -> preview -> simpan atau ikon sampah. Preview tidak otomatis tersimpan.
- Materi -> Berkas / Peta konsep. Graph interaktif mendukung geser, zoom, pencarian, fokus subbab dan sumber pembahasan. Gemini menghasilkan data hubungan; frontend mengatur layout.
- Login/register email dan Google OAuth melalui Supabase. Google baru melengkapi nama/peran sekali pada onboarding.
- Catatan pribadi, foto bertimestamp, review, dukungan pertanyaan anonim, jawaban dosen setelah kelas, dan koreksi graph.
- Agenda kelas perlu konfirmasi. Google Calendar, Outlook, dan Notion memakai OAuth terpisah serta antrean sinkronisasi satu arah dari ClipThat.

## Struktur

```text
src/app/               Halaman, komponen per halaman, serta route API Next.js
src/components/ui/     Komponen UI bersama
src/features/auth/     Login dan registrasi
src/features/graph/    Renderer graph dan penyusunan graph lintas pertemuan
src/features/live/     Mikrofon dosen
src/features/integrations/  Pengaturan koneksi kalender asli
src/server/            Auth, DB, validasi, AI, pekerjaan, serta adapter kalender
src/state/             Provider dan pemetaan API ke model frontend
src/data/mock/         Konten contoh; hanya digunakan pada mode demo
src/data/use-content.ts  Sumber konten sesuai mode
src/styles/            Token, layout, typography, serta responsive styles
workers/               Pemicu antrean lewat Cloudflare Cron
../supabase/migrations/ SQL dan aturan akses data
```

Data live tidak disimpan ke localStorage dan tidak menggunakan course contoh. Mode demo mempertahankan key penyimpanan browser lama. Peran demo dapat diganti; peran akun asli terkunci setelah pendaftaran/onboarding.

## Pemeriksaan

```powershell
npm.cmd run typecheck
npm.cmd run test:backend
npm.cmd run test:e2e
npm.cmd run test:live
npm.cmd run build
npm.cmd run format:check
```

Tes browser memakai Chrome terpasang, port 3187 untuk demo, 3188 untuk live, dan fixture lokal 54339. Masing-masing memakai build directory terpisah dan tidak memakai kuota API asli. Lihat [kontrak backend](docs/backend-api.md).

Eksperimen Figma lama ada di [archive](../archive/README.md); aplikasi tidak memerlukan plugin Figma.
