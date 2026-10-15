# API backend

Base URL `/api/v1`. Request JSON memakai `Content-Type: application/json`. Respons sukses `{ "data": ... }`, error `{ "error": { "code": "...", "message": "..." } }`. Data akun memakai cookie Supabase; mutasi wajib mengirim `Origin` yang sama dengan origin aplikasi. Semua respons data akun `private, no-store`.

| Endpoint                                   | Method         | Fungsi / input utama                                                                                      |
| ------------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------- |
| `health`                                   | GET            | Status konfigurasi, tanpa key                                                                             |
| `auth/register`                            | POST           | `{name,email,password,role}`; konfirmasi email bila diaktifkan                                            |
| `auth/login`                               | POST           | `{email,password}`                                                                                        |
| `auth/logout`                              | POST           | Hapus sesi auth                                                                                           |
| `auth/me`                                  | GET            | Profil milik pengguna terverifikasi                                                                       |
| `auth/google`                              | POST           | Body `{}`; mulai Google OAuth melalui Supabase, respons `{url}`                                           |
| `auth/onboarding`                          | POST           | `{name,role}`; lengkapi profil OAuth sekali, peran kemudian terkunci                                      |
| `boot`                                     | GET            | Profil, mata kuliah, sesi, simpanan pribadi, agenda, hasil pertemuan, status notifikasi                   |
| `courses`                                  | GET / POST     | Daftar; buat `{name,code,days?,schedule_time?}` khusus dosen                                              |
| `sessions`                                 | GET / POST     | Daftar; buat `{course_id,title,starts_at}` khusus dosen pemilik                                           |
| `sessions/join`                            | POST           | `{code}` → ID sesi, membership idempotent                                                                 |
| `sessions/:id`                             | GET            | Detail sesi, transkrip, pertanyaan, hasil kelas, materi, catatan/review pribadi                           |
| `sessions/:id/start`                       | POST           | Mulai sesi upcoming                                                                                       |
| `sessions/:id/end`                         | POST           | Akhiri sesi live, buat pekerjaan pemrosesan                                                               |
| `sessions/:id/retry`                       | POST           | Ulangi pekerjaan sesi failed                                                                              |
| `sessions/:id/archive`                     | POST           | Arsip sesi selesai/upcoming, tidak saat live/processing                                                   |
| `sessions/:id/restore`                     | POST           | Pulihkan sebelum 30 hari                                                                                  |
| `sessions/:id/transcript`                  | GET / POST     | Baca; input dosen `{chunk_id,segments:[{start,end,text}]}`                                                |
| `sessions/:id/transcribe`                  | POST multipart | Dosen: `file`, `chunk_id`, `offset` (detik), `duration` (0.1–90 detik)                                    |
| `sessions/:id/capture-preview`             | POST           | Mahasiswa: `{end?}` (detik); default akhir transkrip terakhir. Respons token preview, tidak ditulis ke DB |
| `sessions/:id/bookmarks`                   | POST           | `{segment_id,label}`; `Bingung` / `Review nanti`                                                          |
| `sessions/:id/questions`                   | GET / POST     | Daftar; mahasiswa mengirim `{text,at_seconds}`                                                            |
| `sessions/:id/personal-note`               | PUT            | `{text}`; milik pengguna saja                                                                             |
| `sessions/:id/graph`                       | PUT            | Dosen: `{nodes:[{id,title,description,source_ids}],edges:[{from,to,relation}]}`                           |
| `sessions/:id/confusion`                   | GET            | Dosen pemilik: hitungan mahasiswa unik per timestamp                                                      |
| `questions/:id/support`                    | POST           | Mahasiswa: `{support:boolean}`                                                                            |
| `questions/:id/answer`                     | POST           | Dosen pemilik: `{text,oral}`                                                                              |
| `saved`                                    | GET            | Semua simpanan milik pengguna (maks. 500)                                                                 |
| `saved/capture`                            | POST           | `{token,question?}` → konfirmasi simpan preview, ID idempotent                                            |
| `saved/:id`                                | PATCH / DELETE | `{reviewed?,question?,label?}`; hapus hanya milik sendiri                                                 |
| `agenda`                                   | GET / POST     | `{title,due_at,kind,confirmed,done,reminder?,course_id?,session_id?,source?}`                             |
| `agenda/:id`                               | PATCH / DELETE | Edit field agenda pribadi atau hapus                                                                      |
| `files/materials`                          | POST multipart | Dosen: `session_id`, `file` PDF/TXT/gambar                                                                |
| `files/photos`                             | POST multipart | Mahasiswa: `session_id`, `file` gambar, `at_seconds`                                                      |
| `files/materials/:id` / `files/photos/:id` | GET            | Signed URL berlaku 120 detik setelah pengecekan akses                                                     |
| `files/materials/:id/archive` / `restore`  | POST           | Dosen pemilik, body `{}`                                                                                  |
| `notifications`                            | PUT            | `{ids:[string]}`; preferensi ditangani milik akun sendiri                                                 |
| `integrations`                             | GET            | Status konfigurasi/koneksi/tujuan dan jumlah antrean; tanpa token                                         |
| `integrations/:provider/connect`           | POST           | Body `{}`; mulai OAuth terikat pengguna, respons `{url}`                                                  |
| `integrations/:provider/destinations`      | GET            | Tujuan yang dapat diakses akun yang terhubung                                                             |
| `integrations/:provider/destination`       | PUT            | `{id}`; validasi tujuan dan antrekan agenda terkonfirmasi                                                 |
| `integrations/:provider/sync`              | POST           | Body `{}`; antrekan agenda terkonfirmasi dan ulangi pekerjaan gagal                                       |
| `integrations/:provider`                   | DELETE         | Putuskan koneksi lokal; agenda yang sudah terkirim tetap di layanan tujuan                                |

Timestamp transkrip/capture/foto berupa **detik dari awal sesi**, bukan jam dinding. Tanggal kalender memakai ISO 8601 dengan timezone. `starts_at` dan `due_at` sebaiknya dikirim dalam UTC (`...Z`) setelah form lokal dikonversi.

Provider kalender: `outlook`, `google`, `notion`. Callback `GET /api/integrations/:provider/callback` menggunakan cookie OAuth httpOnly, nonce, kedaluwarsa, dan akun Supabase yang memulai koneksi. Outlook/Google menggunakan PKCE. Sinkronisasi satu arah dari ClipThat; token terenkripsi di schema private.

Endpoint internal `POST /api/internal/jobs` memakai `Authorization: Bearer JOB_RUNNER_SECRET`, tidak memakai cookie browser. Satu request mengambil maksimal satu pekerjaan pembelajaran dan satu pekerjaan kalender. Endpoint ini dipanggil scheduler Cloudflare atau `npm run jobs:run`; tidak tersedia dari UI mahasiswa/dosen.

API memvalidasi payload dengan Zod dan tetap menggunakan client DB milik pengguna. Secret key server digunakan pada pemrosesan background dan RPC kredensial kalender yang hanya dapat dipanggil server. Tabel shared tidak memiliki identitas penanya; author/vote berada pada schema `private` tanpa grant ke pengguna. Draf hasil AI tidak berubah menjadi agenda tersimpan sampai mahasiswa mengonfirmasi.
