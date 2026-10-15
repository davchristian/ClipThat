# Setup ClipThat: Supabase, Google Sign-In, Gemini, dan kalender

Frontend dan backend berjalan pada satu aplikasi Next.js di `Frontend/`. Mode `demo` menggunakan data browser; mode `live` menggunakan akun, database, storage, dan API server. Halaman yang digunakan sama pada kedua mode. Secret tidak masuk browser atau Git.

## 1. Coba dahulu tanpa layanan cloud

Dari folder `ClipThat/Frontend`:

```powershell
npm.cmd install
npm.cmd run dev
```

Buka http://localhost:3000. Default adalah demo. Login/register pada demo hanya memperagakan alur; akun asli tidak dibuat. Google Sign-In dan kalender tidak dipalsukan sebagai koneksi aktif.

## 2. Supabase

1. Buat proyek di https://supabase.com/dashboard. Simpan password database secara pribadi.
2. Buka SQL Editor. Jalankan migration berikut **sesuai urutan**, satu kali per migration:
   - `ClipThat/supabase/migrations/202610100001_initial.sql`
   - `ClipThat/supabase/migrations/202610140001_frontend_integration.sql`
3. Jika proyek sudah menjalankan migration pertama, cukup jalankan migration kedua. Migration kedua menambah kolom dan fitur tanpa mereset data. Alternatif dari root `ClipThat`: `supabase link`, lalu `supabase db push`.
4. Buka **Connect** untuk Project URL dan publishable key (`sb_publishable_...`). Buka **Settings > API Keys** untuk secret key server (`sb_secret_...`). Secret key server menggunakan `SUPABASE_SECRET_KEY`; nama lama `SUPABASE_SERVICE_ROLE_KEY` masih didukung sebagai fallback.
5. Di **Authentication > URL Configuration**, isi Site URL `http://localhost:3000` dan allowlist redirect `http://localhost:3000/auth/callback`.
6. Biarkan konfirmasi email aktif. Buat akun melalui aplikasi setelah migration selesai agar profil dan hak akses terbentuk.

Dokumentasi: [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [redirect URL](https://supabase.com/docs/guides/auth/redirect-urls).

## 3. Login dengan Google (opsional)

Alamat Gmail juga bisa dipakai untuk akun email/password ClipThat. Cara tersebut memakai Supabase Auth. Tombol **Lanjutkan dengan Google** menggunakan OAuth Google, dengan setup terpisah dari Gemini API key.

1. Buka Google Cloud / Google Auth Platform. Siapkan Branding, Audience, dan test users untuk pengembangan.
2. Buat OAuth client bertipe **Web application**.
3. Authorized JavaScript origin: `http://localhost:3000`.
4. Authorized redirect URI: salin callback yang ditampilkan pada provider Google di Supabase, biasanya `https://PROJECT.supabase.co/auth/v1/callback`. Ini berbeda dari callback aplikasi `/auth/callback`.
5. Di Supabase **Authentication > Sign In / Providers > Google**, aktifkan provider dan isi Google Client ID serta Client Secret.
6. OAuth hanya meminta profil dasar dan email. Tidak meminta akses isi Gmail. Setelah login pertama, pengguna memilih nama dan peran pada `/onboarding`; peran kemudian terkunci.

Peran dosen belum diverifikasi oleh institusi. Untuk penggunaan kampus resmi, proses persetujuan dosen perlu ditambahkan sebelum pendaftaran umum.

Panduan resmi: [Google Sign-In dengan Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google).

## 4. Gemini dan environment lokal

Buat key di https://aistudio.google.com/apikey. Pilih model yang tersedia pada proyekmu. Default kode tetap `gemini-2.5-flash` sesuai arsitektur yang diminta; akses model 2.5 saat ini dibatasi untuk pengguna lama. Untuk proyek baru, pilih model seperti `gemini-3.5-flash-lite` melalui `GEMINI_MODEL`. Ketersediaan dan kuota mengikuti akun Google. Daftar model atau sukses membaca metadata model belum membuktikan request transkripsi dapat dijalankan. [Jadwal dan akses model](https://ai.google.dev/gemini-api/docs/deprecations).

Salin template tanpa menimpa file yang sudah berisi secret:

```powershell
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Isi minimal:

```dotenv
NEXT_PUBLIC_APP_MODE=live
APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ISI_MILIKMU
SUPABASE_SECRET_KEY=sb_secret_ISI_MILIKMU
GEMINI_API_KEY=ISI_MILIKMU
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_TRANSCRIPTION_MODEL=gemini-3.5-transcribe
TRANSCRIPTION_PROVIDER=gemini
CAPTURE_SIGNING_SECRET=SECRET_ACAK_PERTAMA
JOB_RUNNER_SECRET=SECRET_ACAK_KEDUA
INTEGRATION_ENCRYPTION_KEY=SECRET_HEX_ACAK_KETIGA
```

Buat tiga secret **berbeda**, dengan menjalankan perintah berikut tiga kali:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
```

`INTEGRATION_ENCRYPTION_KEY` harus 64 karakter hex. Simpan key ini agar token kalender yang sudah terenkripsi tetap bisa dibaca. Jika menggantinya, pengguna perlu menghubungkan ulang kalender.

Restart server setelah mengubah environment. Buka **APP_URL persis**; jangan mencampur `localhost` dan `127.0.0.1`, karena origin diperiksa pada permintaan yang mengubah data. Untuk produksi gunakan satu domain HTTPS dan tambahkan domain tersebut ke allowlist Supabase serta redirect OAuth.

Gemini menghasilkan struktur catatan, nodes/edges graph, draf agenda, dan review pribadi. Layout graph digambar oleh Cytoscape.js di frontend. Hasil kelas disimpan dan digunakan bersama agar membuka graph tidak mengulang request AI. AI memakai sumber transkrip dan referensi pertemuan sebelumnya, bukan sumber web yang dikarang.

Mikrofon dosen sekarang bisa memakai Gemini: set `TRANSCRIPTION_PROVIDER=gemini` dengan `GEMINI_API_KEY` dan `GEMINI_MODEL` di atas. `OPENAI_API_KEY` tidak diperlukan. Untuk tetap memakai Whisper, pilih `TRANSCRIPTION_PROVIDER=whisper` dan isi `OPENAI_API_KEY`. Jika provider tidak diisi, aplikasi memilih Gemini ketika key Gemini tersedia, atau Whisper untuk konfigurasi lama yang hanya memiliki key OpenAI. Kegagalan Gemini tidak otomatis dialihkan ke Whisper.

Gunakan `GEMINI_TRANSCRIPTION_MODEL=gemini-3.5-transcribe` untuk model khusus speech-to-text. Adapter mengirim audio melalui **Interactions API** tanpa prompt ringkasan atau JSON schema. `GEMINI_MODEL` tetap model umum untuk ringkasan, graph, dan review; jangan mengisinya dengan model Transcribe. Jika `GEMINI_TRANSCRIPTION_MODEL` dikosongkan, transkripsi memakai model umum pada `GEMINI_MODEL` dengan keluaran JSON. Model Transcribe menyimpan satu segmen per potongan dengan rentang waktu rekaman yang diukur browser; timestamp kata per kata belum digunakan. [API transkripsi khusus](https://ai.google.dev/gemini-api/docs/transcribe).

### Tes transkripsi dengan suara sendiri

1. Pada `.env` atau `.env.local` yang digunakan, set `NEXT_PUBLIC_APP_MODE=live` dan `TRANSCRIPTION_PROVIDER=gemini`. Pastikan key Gemini dan konfigurasi Supabase sudah diisi. `.env.local` memiliki prioritas lebih tinggi daripada `.env`.
2. Restart `npm.cmd run dev`. Buka origin yang sama persis dengan `APP_URL`, misalnya `http://localhost:3000`.
3. Login/register sebagai **dosen**. Pilihan peran demo tidak membuat akun dosen live. Buat sesi, buka sesi, lalu klik **Mulai kelas**.
4. Pada kelas yang berlangsung, klik **Rekam suara dosen**, izinkan mikrofon, lalu bicara selama sekitar 15–20 detik. Audio baru dikirim setelah satu potongan 15 detik lengkap; waktu respons Gemini menambah jeda.
5. Klik **Hentikan rekaman** untuk mengirim potongan terakhir. Tunggu antrean selesai. Buka **Transkrip** untuk memeriksa hasil; reload halaman untuk memastikan hasil tersimpan di Supabase.

`GET /api/v1/health` menampilkan `transcription_configured: true` ketika key provider tersedia. Status tersebut hanya memeriksa konfigurasi, bukan membuktikan key valid atau kuota tersedia. Kesalahan/kuota ditampilkan di panel mikrofon; potongan gagal menunggu **Coba kirim ulang**. Hindari menutup halaman sebelum semua potongan terkirim karena antrean audio masih berada dalam memori browser.

Dalam mode `demo`, transkrip tetap contoh dan mikrofon cloud tidak aktif. Audio dikirim ke Gemini dari server; key tidak dikirim ke browser. Hasil transkrip tersimpan, sedangkan potongan audio tidak diunggah ke storage aplikasi. Timestamp Gemini adalah perkiraan model dan perlu diperiksa. Ini transkripsi per potongan, bukan streaming kata demi kata. Dokumentasi: [audio Gemini](https://ai.google.dev/gemini-api/docs/generate-content/audio).

Jika Gemini menolak request:

- **Model tidak tersedia / HTTP 404:** pilih model yang didukung proyek melalui `GEMINI_MODEL`, kemudian restart server.
- **Kredit prabayar / HTTP 402:** cocokkan proyek pada halaman **API Keys** dengan proyek pada **Usage & Billing**. Key dari proyek dengan kredit prabayar habis tidak dapat dipakai hanya dengan memilih proyek Free tier lain di tampilan AI Studio. Untuk pengujian gratis, buat/pilih proyek Free tier dan gunakan API key milik proyek tersebut; jangan aktifkan billing jika ingin tetap gratis. Dukungan Free tier berbeda menurut model dan akun.
- **Kuota / HTTP 429:** periksa batas pemakaian proyek dan tunggu sebelum mencoba ulang. Jangan menekan retry berulang kali.

Status konfigurasi `/api/v1/health` tidak memeriksa saldo atau kuota. Perubahan API key/model membutuhkan restart server. [Billing Gemini](https://ai.google.dev/gemini-api/docs/billing), [harga dan Free tier](https://ai.google.dev/gemini-api/docs/pricing).

## 5. Kalender: ClipThat ke layanan tujuan

Sinkronisasi saat ini **satu arah**. Hanya agenda yang sudah dikonfirmasi mahasiswa yang dikirim. Mengubah/menghapus agenda di ClipThat memperbarui/menghapus salinan agenda milik ClipThat di tujuan; perubahan langsung di layanan tujuan belum ditarik kembali. Aplikasi tidak mengundang peserta atau mengirim email.

Token disimpan terenkripsi di schema private. Callback mengikat nonce, pengguna, provider, dan kedaluwarsa; Outlook/Google memakai PKCE. Status pada UI tidak pernah mengirim token. Antrean Postgres menyimpan pekerjaan, menangani retry, dan mempertahankan perubahan yang datang saat sinkronisasi sedang berlangsung.

### Microsoft Outlook

1. Di Microsoft Entra, buat app registration. Pilih akun organisasi dan akun Microsoft pribadi jika keduanya dibutuhkan. Registrasi memerlukan tenant dan izin yang sesuai.
2. Tambahkan platform **Web** dengan callback `http://localhost:3000/api/integrations/outlook/callback`.
3. Tambahkan delegated permissions `Calendars.ReadWrite`, `openid`, `profile`, dan `offline_access`.
4. Buat client secret untuk development; salin **Value**, bukan Secret ID. Catat tanggal kedaluwarsa.
5. Isi environment:

```dotenv
MICROSOFT_CLIENT_ID=APPLICATION_CLIENT_ID
MICROSOFT_CLIENT_SECRET=SECRET_VALUE
MICROSOFT_TENANT_ID=common
```

6. Restart aplikasi. Mahasiswa membuka **Pengaturan > Microsoft Outlook > Hubungkan**, login, menyetujui izin, lalu **Pilih tujuan**. Kalender yang ditawarkan dibatasi pada kalender yang bisa ditulis akun itu. Akun kampus bisa memerlukan persetujuan admin.

Panduan: [registrasi](https://learn.microsoft.com/en-us/graph/auth-register-app-v2), [OAuth](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow).

### Google Calendar

1. Aktifkan Google Calendar API pada proyek Google Cloud.
2. Buat OAuth web client dengan callback `http://localhost:3000/api/integrations/google/callback`. Client yang sama dengan Google Sign-In bisa digunakan jika kedua callback didaftarkan, tetapi izin kalender diminta melalui alur koneksi terpisah.
3. Isi `GOOGLE_CALENDAR_CLIENT_ID` dan `GOOGLE_CALENDAR_CLIENT_SECRET`.
4. Siapkan Audience/test users dan verifikasi OAuth sesuai kebutuhan akun Google. Lalu hubungkan dari Pengaturan dan pilih kalender yang dapat ditulis.

Panduan: [OAuth web server](https://developers.google.com/identity/protocols/oauth2/web-server).

### Notion

1. Buat public OAuth integration Notion dengan read/insert/update content, lalu daftarkan callback `http://localhost:3000/api/integrations/notion/callback`.
2. Isi `NOTION_CLIENT_ID` dan `NOTION_CLIENT_SECRET`.
3. Siapkan database/data source dengan properti persis: **Name** (title), **Date** (date), **ClipThatID** (rich text). ClipThatID dipakai untuk menemukan salinan yang sama saat request diulang.
4. Hubungkan melalui Pengaturan, pilih halaman/database yang boleh diakses saat persetujuan Notion, lalu pilih tujuan di ClipThat.

Adapter menggunakan Notion API version `2025-09-03` dan data sources. Tujuan yang struktur kolomnya tidak cocok ditolak sebelum sinkronisasi.

Panduan: [Notion authorization](https://developers.notion.com/guides/get-started/authorization).

## 6. Jalankan pemrosesan dan uji akun asli

Terminal pertama:

```powershell
npm.cmd run dev
```

Terminal kedua, saat ada pekerjaan siap diproses:

```powershell
npm.cmd run jobs:run
```

1. Register dosen, konfirmasi email, login, buat mata kuliah dan sesi. Mulai kelas dan bagikan kodenya.
2. Dengan browser/profil lain, register mahasiswa dan gabung melalui kode.
3. Buat transkrip. Coba bookmark, preview capture, buang, lalu preview baru dan simpan. Buang/reload preview tidak menyimpan data; konfirmasi simpan memakai token bertanda tangan dengan masa berlaku 15 menit.
4. Ajukan pertanyaan anonim dan dukung sekali. Dosen bisa menjawab lisan atau tertulis, termasuk setelah kelas.
5. Hentikan rekaman dan tunggu upload selesai sebelum mengakhiri kelas. Jalankan job runner untuk catatan/graph/review. Dosen tetap dapat mengoreksi graph setelah kelas; koreksi tidak ditimpa oleh retry.
6. Buka Agenda mahasiswa. Usulan kelas tetap draf sampai ditinjau, tanggal dipastikan, dan dikonfirmasi. Pastikan draf tidak muncul di kalender luar.
7. Hubungkan kalender, pilih tujuan, jalankan job runner. Ubah agenda dan ulangi runner. Uji hapus agenda serta retry. Memutus koneksi menghentikan sinkronisasi; event yang sudah ada di tujuan dipertahankan.
8. Pastikan dosen tidak bisa melihat catatan pribadi mahasiswa dan akun kedua tidak bisa membaca simpanan akun pertama.

## 7. Cloudflare

Aplikasi memakai Next.js Node runtime dan OpenNext. Route API tidak memakai edge runtime.

1. Ganti placeholder domain dan konfigurasi publik pada `wrangler.jsonc` / `wrangler.jobs.jsonc`.
2. Isi mode live dan environment publik proyek produksi pada environment build. Supabase public keys serta mode dibaca saat build.
3. Login dengan `npx.cmd wrangler login`.
4. Gunakan `npx.cmd wrangler secret put NAMA_VARIABEL` untuk setiap secret: `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, `CAPTURE_SIGNING_SECRET`, `JOB_RUNNER_SECRET`, `INTEGRATION_ENCRYPTION_KEY`, serta client ID/secret provider kalender yang diaktifkan dan key transkripsi opsional. Jangan menaruh secret pada `vars` atau Git.
5. Jalankan `npm.cmd run cf:preview` sebelum `npm.cmd run cf:deploy`.
6. Pasang `JOB_RUNNER_SECRET` yang sama pada scheduler dengan `npx.cmd wrangler secret put JOB_RUNNER_SECRET --config wrangler.jobs.jsonc`, lalu `npm.cmd run cf:deploy:jobs`.
7. Daftarkan callback HTTPS produksi pada Supabase/Google/Microsoft/Notion dan uji dua akun nyata.

Adapter OpenNext menandai Node proxy/middleware experimental. Verifikasi refresh cookie dan proteksi halaman pada preview Worker sebelum membuka aplikasi ke pengguna. Keberhasilan build bukan bukti deployment akun sudah aktif.

## Pemeriksaan dan batas

```powershell
npm.cmd run typecheck
npm.cmd run test:backend
npm.cmd run test:e2e
npm.cmd run test:live
npm.cmd run build
npm.cmd run cf:build
```

Tes backend memakai migration asli pada PGlite dan provider tiruan. Tes live memakai server HTTP Supabase tiruan; login/simpan melewati route Next sebenarnya, sementara AI preview ditiru. Tes ini tidak memakai kuota API dan tidak membuktikan koneksi cloud sebelum key serta akun asli diuji.

Foto dan berkas disimpan sebagai referensi; OCR/PDF extraction dan latihan personal belum diaktifkan. Pengingat yang dihasilkan adalah reminder kalender jika provider mendukungnya; tidak ada push notification ClipThat atau email pengingat. Notifikasi dalam aplikasi dan status ditangani disimpan per pengguna. Pemulihan arsip tersedia 30 hari; penghapusan fisik otomatis setelah itu belum dijadwalkan. Dukungan sinkronisasi dua arah dan verifikasi dosen institusi adalah pekerjaan terpisah.
