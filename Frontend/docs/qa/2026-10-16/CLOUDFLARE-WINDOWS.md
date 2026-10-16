# Verifikasi ulang Cloudflare di Windows

Tanggal: 16 Oktober 2026. Pengujian menggunakan proyek utama dengan dependency lokal biasa, tanpa salinan ber-junction atau distDir khusus. Tidak ada deployment atau perubahan database cloud.

## Hasil build

`npm.cmd run cf:build` selesai dengan exit code 0 dan `OpenNext build complete.`. Artefak `.open-next/worker.js` dan `.next/server/middleware.js.nft.json` terbentuk.

Versi: Windows, Node.js 24.16.0, Next.js 16.3.8, @opennextjs/cloudflare 1.20.10, @opennextjs/aws 4.1.9, Wrangler 4.149.0. Kompilasi memakai Turbopack, TypeScript dan prerender selesai.

Error ENOENT pada audit sebelumnya tidak muncul kembali. Penyebab pasti error lama belum terbukti; percobaan lama menggunakan salinan terisolasi dan dependency junction. Tidak diperlukan perubahan proxy, downgrade Next.js, atau patch node_modules untuk mencapai build yang lulus sekarang. Adapter tetap memperingatkan dukungan Windows terbatas dan Node middleware eksperimental.

Dalam sandbox agen, esbuild ditolak saat membaca direktori induk. Build diulang dengan akses proses Windows normal dan berhasil. Ini berbeda dari error aplikasi. PowerShell juga memblokir npm.ps1; npm.cmd berjalan tanpa mengubah execution policy.

## Preview runtime Cloudflare lokal

Preview dijalankan melalui `opennextjs-cloudflare preview --port 8788` pada workerd lokal.

| Pemeriksaan | Hasil |
| --- | --- |
| GET /login | 200, HTML login tampil, Cache-Control private/no-store |
| GET /register | 200 |
| GET /profile tanpa akun | 307 ke /login |
| GET aset yang tidak ada | 404 |
| GET /api/internal/jobs | 405 |
| POST /api/internal/jobs tanpa secret | 401 |
| Chrome desktop 1440 × 900 | Tombol Masuk tampil; tidak ada pageerror atau overflow horizontal |
| Chrome simulasi HP 390 × 844 | Tombol Masuk tampil; tidak ada pageerror atau overflow horizontal |
| CSS, JavaScript, font login | Semua resource yang diamati 200 |
| GET /api/v1/courses | 503; konfigurasi Supabase runtime belum diisi |

Tes halaman login tidak mengirim kredensial. Pengujian akun asli, refresh token, email, Storage, dan job produksi belum dilakukan. Favicon masih 404, tanpa menghalangi halaman atau build.

## Perubahan dan langkah berikutnya

- Menambahkan `cf:preview:built` untuk memakai hasil build yang sudah ada tanpa membangun ulang.
- Mendokumentasikan perintah Windows menggunakan npm.cmd dan kebutuhan memakai distDir standar.
- Domain APP_URL di Wrangler masih placeholder dan konfigurasi Supabase publik masih kosong. Nilai Wrangler runtime dapat menimpa nilai .env; isi konfigurasi yang sesuai sebelum menguji layanan asli. Secret produksi harus disiapkan terpisah sesuai panduan setup.
- WSL tidak wajib untuk build yang diuji ini. Build dan preview lokal yang lulus belum merupakan bukti deployment produksi lulus.
