# Setup backend ClipThat

Backend berada di aplikasi Next.js yang sama dengan frontend. Tidak perlu menjalankan server Express atau membuat `node_modules` kedua. Mulai dari folder `ClipThat/Frontend`.

## 1. Coba UI tanpa akun

```powershell
npm.cmd install
npm.cmd run dev
```

Default aplikasi adalah **demo**. Data contoh tetap memakai penyimpanan browser lama. Mode ini tidak memanggil Supabase, Gemini, atau Whisper. Backend API tidak menerima akun demo sebagai akun asli.

## 2. Buat Supabase

1. Buat proyek baru di [Supabase](https://supabase.com/dashboard). Simpan password database di tempat aman.
2. Buka **SQL Editor**, salin seluruh isi [migration awal](../../supabase/migrations/202610100001_initial.sql), lalu Run **satu kali** pada proyek baru. Alternatif: gunakan Supabase CLI `supabase link` dan `supabase db push` dari root `ClipThat`.
3. Migration membuat tabel, trigger akun, RLS, fungsi kelas/pertanyaan, antrean pekerjaan, dan bucket private `materials` serta `photos`. Migration ini bukan reset database; jangan mengulangnya pada database yang sudah berisi tabel tersebut.
4. Di **Project Settings → API**, ambil project URL, publishable key, dan service role key untuk server. Isi hanya di mesinmu. Service role tidak boleh berada dalam variabel `NEXT_PUBLIC_*` atau kode browser.
5. Di **Authentication → URL Configuration**, isi Site URL `http://127.0.0.1:3000`; tambahkan redirect URL `http://127.0.0.1:3000/auth/callback`. Saat produksi, tambahkan domain HTTPS aplikasi.
6. Biarkan konfirmasi email aktif. Login dilakukan sesudah pengguna mengonfirmasi email. Buat akun melalui UI **setelah** migration dijalankan supaya profil terbentuk oleh trigger.

Peran dipilih saat register. Peran disimpan di profil dan tidak bisa diganti sendiri setelah akun dibuat. Verifikasi dosen oleh kampus belum termasuk; untuk layanan kampus sungguhan, tambahkan proses persetujuan dosen sebelum membuka pendaftaran umum.

## 3. Isi konfigurasi lokal

```powershell
Copy-Item .env.example .env.local
```

Isi `.env.local`:

```dotenv
NEXT_PUBLIC_APP_MODE=live
APP_URL=http://127.0.0.1:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SERVICE_ROLE_KEY
GEMINI_API_KEY=YOUR_GEMINI_KEY
GEMINI_MODEL=gemini-2.5-flash
CAPTURE_SIGNING_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
JOB_RUNNER_SECRET=ANOTHER_INDEPENDENT_RANDOM_SECRET
OPENAI_API_KEY=
```

Buat **dua secret berbeda** dengan perintah ini; jalankan dua kali dan salin setiap hasil ke variabel yang sesuai:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
```

Ambil Gemini key di [Google AI Studio](https://aistudio.google.com/apikey). Model default tetap **Gemini 2.5 Flash** sesuai arsitektur. Key Gemini hanya digunakan di server. Biaya atau kuota layanan mengikuti akun penyedianya; penyiapan kode ini tidak membuat akun, mengaktifkan billing, atau memanggil API berbayar.

Whisper opsional: isi `OPENAI_API_KEY` untuk mengaktifkan tombol rekam dosen. Tanpa key, fitur kelas lain tetap berfungsi; aplikasi menampilkan bahwa transkripsi belum diaktifkan. Adapter memakai `whisper-1` dengan timestamp per segmen. Whisper tidak menyediakan streaming pada endpoint ini, sehingga aplikasi mengirim potongan audio lengkap sekitar 15 detik dan memperbarui transkrip melalui polling 5 detik. Setiap potongan memiliki ID tetap agar pengiriman ulang tidak menggandakan transkrip. Audio mentah tidak disimpan di bucket aplikasi. Izin mikrofon memerlukan HTTPS atau localhost.

Dokumentasi OpenAI mencatat penghentian `whisper-1` pada 26 Februari 2027. Adapter sengaja mempertahankan pilihan model yang diminta; rencanakan penggantian adapter sebelum tanggal tersebut jika aplikasi digunakan melewati tanggal itu. Periksa [status model](https://developers.openai.com/api/docs/deprecations) saat mengaktifkannya.

Restart server setelah mengubah `.env.local`. `NEXT_PUBLIC_APP_MODE` dan konfigurasi publik dibaca saat build; build ulang saat mengubah mode atau proyek Supabase.

Buka alamat **APP_URL persis**, default `http://127.0.0.1:3000`. Origin ini dipakai untuk proteksi permintaan dan callback login. Jika memilih `localhost`, ubah `APP_URL` serta allowlist Supabase menjadi `http://localhost:3000` secara konsisten.

## 4. Jalankan alur akun asli

```powershell
npm.cmd run dev
```

1. Daftar sebagai dosen, konfirmasi email, lalu login. Buat mata kuliah pertama dan satu pertemuan. Mulai kelas dan salin kode kelas.
2. Di browser/profil lain, daftar sebagai mahasiswa dan gabung memakai kode itu. Tidak ada data contoh di mode live.
3. Dosen menyalakan mikrofon jika Whisper dikonfigurasi. Jangan meninggalkan kelas selama merekam atau ketika masih ada potongan menunggu. Jika transkripsi gagal, hentikan rekaman dan gunakan **Coba kirim ulang** selama tab masih terbuka.
4. Mahasiswa bisa menandai bagian, melihat preview capture, lalu memilih simpan atau buang. Preview ditandatangani server, berlaku 15 menit, dan **belum masuk database**. Hanya konfirmasi simpan yang membuat simpanan pribadi. Simpan ulang preview yang sama menghasilkan satu item.
5. Pertanyaan anonim terlihat oleh anggota kelas dan dosen; identitas penanya/voter tidak dikirim. Dukungan dihitung satu kali per mahasiswa. Dosen dapat menjawab sesudah kelas.
6. Dosen menghentikan rekaman, menunggu potongan terkirim, lalu mengakhiri kelas. Sesi masuk status `processing` dan pekerjaan masuk antrean Postgres.
7. Untuk development, jalankan worker pekerjaan dari terminal kedua:

   ```powershell
   npm.cmd run jobs:run
   ```

   Perintah ini mengambil pekerjaan yang siap dikerjakan, menyusun catatan kelas, peta konsep, draf agenda, lalu panduan review pribadi setiap mahasiswa. Bila provider gagal, pekerjaan dijadwalkan ulang dengan jeda; jalankan lagi setelah jeda. Setelah lima kegagalan, sesi menjadi `failed` dan dosen dapat memilih **Coba proses lagi**.

8. Pada tab **Materi**, pilih subbab peta konsep untuk membuka penjelasan, hubungan subbab, dan transkrip sumber. Dosen dapat mengoreksi isi/hubungan. Koreksi tidak ditimpa oleh pemrosesan ulang otomatis.
9. Draf agenda dari kelas wajib ditinjau mahasiswa. Tanggal ambigu dibiarkan kosong untuk diisi; tidak ditebak. Menekan **Konfirmasi agenda** menyimpan agenda pribadi.

## 5. Deploy ke Cloudflare

Aplikasi memakai [OpenNext Cloudflare](https://opennext.js.org/cloudflare/get-started), Next.js **Node.js runtime** dengan flag `nodejs_compat`; jangan mengganti route ke `runtime = "edge"`.

Adapter yang digunakan berhasil membangun bundle, tetapi menandai dukungan **Node.js middleware/proxy sebagai experimental**. Uji alur login, refresh cookie, dan proteksi halaman pada preview Worker sebelum membuka akses produksi. Route API tetap memverifikasi akun dan RLS walaupun navigasi halaman memakai proxy.

1. Isi domain `APP_URL`, project URL, dan publishable key pada `wrangler.jsonc`. Isi domain aplikasi yang sama pada `wrangler.jobs.jsonc`. Placeholder `.example` harus diganti.
2. Isi `.env.local` dengan mode live dan konfigurasi publik proyek produksi untuk proses build. Di CI, isi melalui environment build. `.env.local` tidak di-commit.
3. Login Cloudflare dari terminalmu:

   ```powershell
   npx.cmd wrangler login
   ```

4. Tambahkan secret aplikasi melalui prompt Wrangler, satu perintah per secret:

   ```powershell
   npx.cmd wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx.cmd wrangler secret put GEMINI_API_KEY
   npx.cmd wrangler secret put CAPTURE_SIGNING_SECRET
   npx.cmd wrangler secret put JOB_RUNNER_SECRET
   # Hanya jika memakai transkripsi:
   npx.cmd wrangler secret put OPENAI_API_KEY
   ```

5. Build/preview lokal sebelum deploy:

   ```powershell
   npm.cmd run cf:preview
   npm.cmd run cf:deploy
   ```

   OpenNext/Wrangler dapat memerlukan WSL pada Windows jika build adapter menemui kendala filesystem. `npm run dev` tetap dapat dijalankan di PowerShell.

6. Deploy scheduler agar pemrosesan otomatis berjalan tanpa terminal lokal:

   ```powershell
   npx.cmd wrangler secret put JOB_RUNNER_SECRET --config wrangler.jobs.jsonc
   npm.cmd run cf:deploy:jobs
   ```

   Secret scheduler harus **sama** dengan `JOB_RUNNER_SECRET` aplikasi. Cron memanggil endpoint server setiap menit dan menguras maksimal empat pekerjaan per invocation. Postgres menyimpan antrean dan lease; invocation ganda tidak mengerjakan job yang sama bersamaan. Tidak ada service-role key di scheduler. Untuk kelas besar, ukur throughput dan naikkan kapasitas worker/antrean sesuai kuota akun.

7. Tambahkan URL produksi ke Supabase Auth redirect allowlist dan uji dengan dua akun berbeda. Jangan mengandalkan keberhasilan demo sebagai pengujian Supabase produksi.

## Struktur dan batas saat ini

```text
Frontend/
  src/app/api/         Route API Next.js
  src/server/          Validasi, akses DB, provider AI, jobs, handler domain
  src/features/live/   UI yang menggunakan API asli
  src/features/auth/   Login/register demo atau Supabase sesuai mode
  workers/             Scheduler Cloudflare Cron
  tests/backend/       SQL/RLS dan service tests lokal
  .env.example         Template tanpa secret
  wrangler*.jsonc      Konfigurasi Cloudflare
supabase/migrations/   Skema dan aturan akses database
```

- Data pribadi dibatasi oleh RLS database, bukan hanya tombol yang disembunyikan. Dosen melihat rekap kebingungan tanpa catatan pribadi atau identitas mahasiswa.
- Foto tersimpan dengan timestamp, tidak dianalisis AI. Materi PDF/gambar disimpan sebagai berkas; pemrosesan catatan saat ini memakai **transkrip**, belum mengekstrak isi PDF/foto. Latihan personal tetap future plan.
- AI menggunakan materi kelas dan pertemuan sebelumnya yang tersedia. Tautan sumber menunjuk segmen transkrip; pencarian web/rujukan eksternal belum diaktifkan, sehingga tidak ada sumber eksternal yang dikarang.
- Google Calendar, Notion, Outlook OAuth/sinkronisasi, QR scanner, notifikasi pengingat, serta verifikasi dosen oleh institusi **belum diimplementasikan**. Mode live tidak menampilkan koneksi kalender palsu. Agenda sudah tersimpan di database dan bisa diedit/dikonfirmasi.
- Arsip bersama dapat dipulihkan selama 30 hari. Setelah itu pemulihan ditolak; **penghapusan fisik otomatis belum dijadwalkan**. Simpanan pribadi yang memuat kutipan tetap ada. Kebijakan retensi/purge permanen perlu ditentukan sebelum produksi.
- Materi maksimal 10 MB, foto 5 MB, audio 5 MB per potongan. Preview capture 12/menit, transkripsi 20/menit, pertanyaan 20/menit, percobaan kode 15/menit per akun. Ini pembatasan aplikasi, bukan pengganti pengaturan biaya provider.
- Supabase upload dan insert metadata bukan transaksi lintas Storage/Postgres. Jika insert metadata gagal sesudah upload sukses, dapat tertinggal berkas tanpa referensi; bersihkan dari dashboard Storage setelah memastikan tidak ada metadata yang merujuknya.

## Pemeriksaan

```powershell
npm.cmd run typecheck
npm.cmd run test:backend
npm.cmd run test:e2e
npm.cmd run test:live
npm.cmd run build
```

`test:backend` menjalankan migration asli pada PostgreSQL embedded PGlite dengan stub schema `auth`/`storage`. Ini memeriksa query, hak akses, anonimitas, siklus sesi, dan lease pekerjaan tanpa proyek cloud. Provider AI memakai respons tiruan. `test:live` menjalankan mode live pada port 3101 dengan server HTTP Supabase tiruan pada 54329; login dan simpan capture melewati route Next yang sebenarnya. Pengujian tersebut tidak menguji email Supabase, kualitas audio perangkat fisik, kuota API asli, atau deployment akun Cloudflare.

Referensi implementasi: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output), [OpenAI audio transcriptions](https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create), [OpenNext Cloudflare](https://opennext.js.org/cloudflare/get-started).
