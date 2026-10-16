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

## Build Cloudflare di Windows

Jalankan dari folder `Frontend` dengan dependency proyek terpasang. Gunakan `npm.cmd` di PowerShell agar tidak terhalang kebijakan eksekusi `npm.ps1`.

```powershell
npm.cmd run cf:build
npm.cmd run cf:preview:built -- --port 8788
```

Build berhasil bila muncul `OpenNext build complete.` dan `.open-next/worker.js` tersedia. Buka preview di http://127.0.0.1:8788; tekan Ctrl+C untuk menghentikannya. `cf:preview:built` memakai hasil build terakhir, jadi jalankan build lagi setelah mengubah kode atau environment build. Untuk build dan preview sekaligus, gunakan `npm.cmd run cf:preview`.

Adapter memakai direktori `.next` untuk build produksi. Jangan menetapkan `CLIPTHAT_DIST_DIR` khusus saat menjalankan build Cloudflare. Build standar telah lulus di Windows dengan dependency lokal pada 16 Oktober 2026; hasil lengkap ada di [laporan verifikasi](docs/qa/2026-10-16/CLOUDFLARE-WINDOWS.md).

Sebelum menguji akun asli, isi konfigurasi publik Cloudflare dan secret sesuai [panduan setup](docs/backend-setup.md#7-cloudflare). Nilai kosong di `wrangler.jsonc` dapat menimpa nilai `.env` pada runtime Worker. Keberhasilan build belum membuktikan login, email, Storage, atau job produksi berfungsi. Perintah di atas hanya build dan preview lokal.

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
