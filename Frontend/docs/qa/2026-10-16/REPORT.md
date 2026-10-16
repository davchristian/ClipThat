# Laporan audit fungsional dan kebersihan UI ClipThat

**Update setelah perbaikan:** lihat [FIXES.md](FIXES.md). Angka dan temuan di bawah adalah kondisi saat audit awal, bukan status terbaru aplikasi.

Tanggal: 16 Oktober 2026, zona Asia/Jakarta. Audit terhadap working tree saat ini, termasuk perubahan yang belum di-commit. Windows, Node 24.16.0, Next 16.3.8, Chrome melalui Playwright.

**Kesimpulan: sebagian besar alur bekerja, tetapi proyek belum sepenuhnya bersih dari masalah.** Ada dua bug aplikasi yang terverifikasi: draf agenda tidak dapat ditinjau dari UI, dan sidebar tidak membuka label saat fokus keyboard masuk. Target bundle Cloudflare juga belum berhasil di lingkungan audit. Ada dua masalah pada suite tes: locator capture lama dan reset fixture catatan pribadi.

Audit ini menambahkan tes, konfigurasi audit, log, screenshot, dan laporan. Tidak mengubah perilaku aplikasi atau menghapus teks produk. Perubahan konfigurasi TypeScript yang dibuat otomatis oleh Next dikembalikan setelah pengujian. Database cloud pengguna tidak diubah, tidak ada deployment, dan tidak ada email/undangan yang dikirim. Gemini asli diuji dengan lima percakapan buatan.

## 1. Hasil pengujian

| Kelompok                     |   Kasus |   Lulus | Gagal | Keterangan                                                                                                                                |
| ---------------------------- | ------: | ------: | ----: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Backend                      |      55 |      55 |     0 | Migration asli di PGlite, layanan eksternal sebagian besar mock; termasuk tes legacy integrasi kalender yang sudah tidak menjadi fitur UI |
| Browser demo, suite existing |      24 |      23 |     1 | Sidebar keyboard gagal; mouse, halaman utama, agenda, capture, foto, graph, dan fullscreen lulus                                          |
| Browser live, suite existing |      14 |      11 |     3 | Supabase HTTP fixture; gagal di locator capture lama, reset fixture catatan, dan draf agenda                                              |
| Audit demo/UI tambahan       |       9 |       9 |     0 | Dua peran, dua lebar layar, grid profil, autosize, validasi auth, pencarian, storage rusak, diagnosis jam/sidebar                         |
| Audit live tambahan          |       3 |       2 |     1 | Capture lewat UI terbaru dan catatan pribadi dengan isi baru lulus; draf agenda gagal                                                     |
| Gemini asli                  |       5 |       5 |     0 | Data sintetis; tanggal relatif, materi/obrolan, perubahan jadwal, tanggal tidak pasti, contoh hipotetis                                   |
| **Total unik**               | **110** | **105** | **5** | Tidak menghitung retry sebagai kasus tambahan; lima kegagalan bukan lima bug terpisah                                                     |

Daftar **110 kasus satu per satu**, termasuk lokasi tes dan pesan kegagalan: [CASES.md](CASES.md). Data mesin: [case-results.json](case-results.json).

| Pemeriksaan tambahan             | Hasil                                                            | Bukti                                                                         |
| -------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| TypeScript, awal dan akhir audit | Lulus                                                            | [typecheck-final.log](typecheck-final.log)                                    |
| Production build Next.js         | Lulus; 12 halaman statis dan route dinamis/API selesai dibangun  | [build.log](build.log)                                                        |
| Build Cloudflare/OpenNext        | Belum lulus; bundling middleware gagal                           | [cloudflare-isolated-final.log](cloudflare-isolated-final.log)                |
| Format Prettier awal             | Gagal; 75 file tidak konsisten                                   | [format.log](format.log)                                                      |
| npm audit dependency produksi    | 0 advisori yang dilaporkan registry saat audit                   | [npm-audit.json](npm-audit.json); bukan jaminan seluruh kode bebas celah      |
| Koneksi Supabase asli            | Lulus untuk server key/tabel profiles dan kolom course join_code | [cloud-services.log](cloud-services.log)                                      |
| Token Deepgram asli              | Lulus                                                            | Log layanan cloud; ini belum menguji kualitas audio/WebSocket end-to-end asli |
| Gemini asli, ringkasan smoke     | Lulus                                                            | Log layanan cloud                                                             |
| Tanda tangan capture             | Lulus                                                            | Log layanan cloud dan tes token/tampering                                     |
| Job runner secret                | Terisi                                                           | Belum menjalankan job terhadap kelas asli pengguna                            |

Provider Google Supabase terdeteksi belum diaktifkan. Ini tidak menghalangi login email/password yang sekarang digunakan; tombol Google memang sudah dihapus.

## 2. Bug aplikasi yang terverifikasi

### F-01 — Tinggi: draf agenda tersimpan di data tetapi tidak dapat dilengkapi dari halaman Agenda

**Langkah reproduksi:** hasil kelas menghasilkan `agenda_drafts`; masuk sebagai mahasiswa; buka Agenda. Pada fixture, endpoint boot mengembalikan satu draf berjudul “Latihan matriks”, tetapi teks/jadwal itu tidak ditemukan di UI.

**Seharusnya:** pengumuman yang belum lengkap tanggalnya, atau draf lama yang belum dikonfirmasi, dapat dibuka untuk dilengkapi/dikonfirmasi.

**Aktual:** [agenda/page.tsx](../../../src/app/agenda/page.tsx:68) hanya mengambil `confirmed === true`. Tidak ada daftar draf atau tombol untuk meninjaunya. [live-data.ts](../../../src/state/live-data.ts) masih memasukkan draf hasil AI ke state. Notifikasi “agenda kelas perlu dikonfirmasi” masih dapat mengarahkan pengguna ke halaman yang tidak menampilkan drafnya.

**Dampak:** alur fallback untuk tanggal ambigu terputus. Agenda baru yang bertanggal jelas dapat disimpan oleh trigger, tetapi itu tidak menyelesaikan masalah draf yang belum bertanggal atau draf sebelum migration baru.

**Bukti:** [hasil tes khusus draf](live-draft-results.json), [hasil audit live final](qa-live-verified-results.json), [trace dan screenshot kegagalan](../../../test-results/qa-live-verified/qa-live-audit-QA-generated-e14cb-for-the-student-to-complete/error-context.md). Tes existing graph/agenda juga berhenti di titik ini; tahap konfirmasi/reload dan koreksi graph sesudahnya belum tercapai dalam kasus tersebut.

**Saran:** tambahkan bagian ringkas “Perlu dilengkapi” pada Agenda; tampilkan judul dan satu aksi tinjau. Pertahankan draf di luar kalender sampai tanggalnya ditentukan. Jangan menambahkan penjelasan permanen yang panjang.

### F-02 — Sedang: sidebar tetap mengecil saat navigasi dengan keyboard

**Langkah reproduksi:** desktop; pointer di luar sidebar; fokuskan konten utama; tekan Shift+Tab. Fokus berpindah ke tautan profil di sidebar.

**Seharusnya:** sidebar membuka label ketika fokus keyboard masuk, seperti saat hover.

**Aktual:** lebar tetap 76px, bukan 216px. Diagnosis DOM membuktikan fokus sudah berada pada `.sidebar-profile-avatar` di dalam sidebar. Interaksi hover dengan mouse berhasil.

**Bukti:** [demo-final-results.json](demo-final-results.json), [clock-sidebar-diagnostic.json](clock-sidebar-diagnostic.json), [error context](../../../test-results/qa-demo-final/app-sidebar-expands-on-hov-bb04a-e-without-shifting-the-page/error-context.md). Selector terkait berada di [sidebar.css](../../../src/app/components/sidebar.css:192), memakai `:has(:focus-visible)`.

**Dampak:** pengguna keyboard mendapat label/sidebar yang tidak konsisten. Ini bukan kegagalan fungsi hover secara keseluruhan.

**Saran:** pastikan kondisi membuka sidebar menangkap fokus pada tautan avatar, misalnya evaluasi `:focus-within` atau pengelolaan fokus yang konsisten. Uji bahwa perpindahan fokus keluar menutup sidebar lagi tanpa menggeser konten.

## 3. Temuan build, test harness, dan hal yang perlu diperbaiki

### B-01 — Build Cloudflare belum berhasil

Build Next.js biasa lulus. Percobaan build Cloudflare dengan distDir terpisah gagal karena adapter tetap mencari `.next`. Karena server pengembangan pengguna sedang berjalan, build standar diuji di salinan terisolasi tanpa `.env`, dengan dependency junction dan root Turbopack yang disesuaikan hanya di salinan itu.

Di percobaan terisolasi terakhir, Next berhasil compile/typecheck/prerender. OpenNext kemudian gagal saat menyalin `.next/server/middleware.js.nft.json`, dengan ENOENT. Adapter juga mengeluarkan peringatan dukungan Windows dan middleware Node yang experimental. [Log lengkap](cloudflare-isolated-final.log).

**Kesimpulan yang dapat dibuktikan:** bundle target Cloudflare belum berhasil dalam lingkungan audit ini. **Belum dapat disimpulkan** bahwa deployment Linux pasti gagal; isolasi/junction/Windows merupakan batas uji. Ulangi di WSL/Linux atau CI dengan dependency lokal biasa sebelum menganggap jalur deployment siap. Tidak ada deployment dilakukan.

### T-01 — Tes capture existing mencari kontrol yang sudah dihapus

[live.spec.ts](../../../tests/live.spec.ts:68) menunggu tombol “Tersimpan (1)”. Tampilan sekarang menggunakan “Bagian tersimpan” di tab Catatan. Tes itu gagal sebelum mencapai sebagian pemeriksaan selanjutnya.

Tes audit tambahan mengikuti UI terbaru dan **lulus**: buang preview tidak menulis data; simpan menghasilkan satu capture di API; capture terlihat di Catatan; reload mempertahankannya; respons simpan 503 menampilkan error dan mempertahankan preview. [Hasil](qa-live-verified-results.json).

Perbarui locator/alur tes lama. Jangan menyatakan fitur capture rusak berdasarkan tombol lama itu.

### T-02 — Reset fixture tidak membersihkan catatan pribadi

[supabase.mjs](../../../tests/fixtures/supabase.mjs:29) menyimpan `notes` di objek global; handler `/reset` membersihkan saved/questions/agenda/results tetapi tidak mengosongkan `notes`. Akibatnya uji ulang dengan teks “Ulangi basis dahulu.” dapat menemukan isi yang sama sudah tersimpan; tombol “Simpan catatan” memang seharusnya disabled dan tes mengalami timeout 45 detik.

Kasus ini lulus pada run awal dengan fixture kosong. Tes tambahan dengan teks baru yang unik **lulus**, termasuk reload. [Hasil final audit live](qa-live-verified-results.json).

Saran: kosongkan seluruh state fixture per test, atau gunakan fixture per worker/test. Jangan mengubah perilaku tombol aplikasi agar tes ini dipaksakan lulus.

### T-03 — Selector global dan artefak pengujian membuat sebagian hasil awal tidak stabil

Tes jam awal sempat menemukan dua elemen berlabel “Waktu saat ini”; pada run final tes jam existing lulus, dan diagnosis menemukan tepat satu jam terlihat di desktop maupun HP. Ini **tidak terbukti sebagai bug jam ganda yang terlihat oleh pengguna**. Sebagian DOM rute dapat tertahan/tersembunyi selama navigasi atau hydration; tes UI perlu memilih elemen yang terlihat dan menunggu peran pengguna selesai dimuat.

Dua pemeriksaan audit awal juga salah menganggap setiap empty state harus memiliki h1. Empty state “Kelas tidak tersedia” memakai heading h3 dan aplikasi tetap bekerja. Test harness dikoreksi, lalu uji recovery storage rusak/route tidak dikenal lulus.

Saat dua audit awal menggunakan outputDir yang sama, sebagian trace terkena konflik ENOENT. Run final memakai outputDir terpisah. Klaim dalam laporan memakai run final/diagnosis yang terisolasi; log percobaan awal tetap disimpan untuk transparansi.

Runner awal juga menahan server tes saat teardown Windows sehingga port 3187/3197 tetap terpakai. Pengujian lanjutan memakai konfigurasi audit yang mengenali server tes tersebut. Ini masalah proses/infrastruktur pengujian, bukan bukti aplikasi gagal login atau berpindah halaman.

### Q-01 — Representasi agenda yang hanya menyebut tanggal masih berupa jam 00:00

Pada uji Gemini asli, “Selasa minggu depan ada kuis” menghasilkan `2026-10-20T00:00:00+07:00`. Ini sesuai instruksi backend saat ini, tetapi model data belum membedakan “tanggal saja” dari kegiatan yang benar-benar pukul 00:00.

[calendar-export.ts](../../../src/app/agenda/components/calendar-export.ts:26) membuat event berdurasi 30 menit. Akibatnya agenda bertanggal saja dapat diekspor menjadi event tengah malam, bukan all-day. Ini temuan desain/model data dari kode dan hasil AI; **belum diuji impor ke kalender asli**.

Saran: simpan penanda `date_only`/all-day, sembunyikan jam jika belum disebut, dan ekspor kalender sebagai event tanggal penuh. Jangan mengarang jam kuis.

### Q-02 — Pengumuman tanpa tanggal belum selalu menjadi draf dari AI

Kasus buatan “Akan ada ujian matriks, tapi tanggalnya belum ditentukan” menghasilkan `agenda: []`. Tes keamanan tanggal lulus karena AI tidak mengarang tanggal, tetapi hasil ini **tidak membuktikan janji semua pengumuman ambigu akan disimpan sebagai draf**. Jika produk mengharuskan setiap pengumuman penting tetap dicatat, prompt/eval perlu mewajibkan kegiatan semacam itu muncul dengan `due_at: null`.

### Q-03 — 75 file belum mengikuti format yang disepakati

`npm run format:check` awal melaporkan 75 file. Ini bukan 75 bug fungsi. Tidak dilakukan format massal karena audit tidak memerlukan perubahan seluruh source. Berkas audit baru diformat; [log awal](format.log) mencatat backlog yang sudah ada.

## 4. Cakupan fitur dan batas hasilnya

| Fitur                    | Skenario yang dijalankan                                                                                                                                       | Hasil/batas                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Auth                     | Validasi required/email/password, show/hide password, login salah/benar melalui route Next + fixture, logout, onboarding role tidak bisa diulang, error signup | Lulus sesuai test; signup email asli, konfirmasi email, expiry sesi dan reset password belum diuji end-to-end pada akun cloud |
| Role/privasi             | Mahasiswa tidak membuat/memulai kelas, tidak eskalasi role, private notes/saved/photos tidak terbaca dosen/mahasiswa lain, worker ditolak untuk mahasiswa      | Lulus di SQL/PGlite dan HTTP fixture; belum pengujian dua akun cloud nyata                                                    |
| Course                   | Dosen membuat course pertama, kode otomatis, kode lama, join idempotent/case/whitespace, kode salah, isolasi anggota, UI HP/desktop                            | Lulus; kolom join_code di cloud asli sudah terverifikasi tersedia                                                             |
| Sesi kelas               | Start/end, tahan end sampai final transcript tersimpan, retry upload, enqueue job sekali, arsip/restore, salinan pribadi bertahan                              | Lulus di demo/fixture/SQL; antrean asli pengguna tidak dijalankan                                                             |
| Transkrip                | Streaming drafts/finals, interval 15 detik, pecahan detik, chunk audio/timestamp, silence, provider/rate-limit error, tampil tanpa overlap                     | Lulus dengan audio/provider/WebSocket buatan; token Deepgram asli lulus, kualitas mikrofon/accent/jaringan asli belum diukur  |
| Capture                  | Window 90 detik, preview, discard, signed save, reload, error simpan, token tampering/expiry/akun lain                                                         | Backend dan UI terbaru lulus; locator existing perlu diperbarui                                                               |
| Pertanyaan               | Posting anonim, teks kosong/pendek, voting/unvote, dosen menjawab/menandai jawaban lisan, reload, autosize untuk newline dan text wrap                         | Lulus; kartu pertanyaan tidak lagi menampilkan Anonim/timestamp. Footer input masih menampilkan Anonim                        |
| Catatan                  | Generate, sumber valid, sanitasi UUID, private save/reload, off-topic-only tidak mengarang catatan                                                             | Lulus; fixture reset perlu dibetulkan untuk uji ulang                                                                         |
| Graph                    | Node/topic, source navigation, hubungan, merge, detail, desktop/mobile                                                                                         | Pemeriksaan graph mandiri lulus; tes live gabungan terhenti di bug agenda sebelum tahap koreksi graph terakhir                |
| Foto/berkas              | Upload foto contoh, batas timestamp, persist saved, bucket/RLS/arsip, hak upload dosen                                                                         | Lulus pada cakupan fixture/SQL; upload-download file dan signed URL di Storage cloud asli belum diuji                         |
| Agenda manual            | Pilih tanggal, buat, edit, selesai, hapus, export .ics, draf tidak masuk kalender                                                                              | Lulus; akses untuk melengkapi draf AI gagal                                                                                   |
| Agenda AI otomatis       | Empat jenis kegiatan, sumber kutipan wajib, tanggal rusak/past ditolak, anggota course saja, retry tidak duplikat/tidak menimpa edit mahasiswa                 | Lulus di migration/PGlite; trigger migration 003 di cloud asli belum diverifikasi lewat SQL                                   |
| AI asli                  | Campur materi+kuis+liburan, off-topic-only, tanggal tidak pasti, revisi Selasa→Rabu 09.00, cerita masa lalu/hipotetis                                          | Lima pemeriksaan lulus; satu sampel per skenario, bukan pengukuran akurasi populasi                                           |
| Home/kalender/notifikasi | Kartu 1/2/4 course, navigasi kalender, notifikasi modal, status handled, reload, responsif                                                                     | Lulus; notifikasi draf tetap terkena dampak F-01                                                                              |
| Profil                   | Dosen/mahasiswa, tautan sidebar, logout, grid di bawah judul, tidak ada Semua course, reset demo                                                               | Lulus desktop dan HP                                                                                                          |
| Navigasi/pencarian       | Ctrl+K, no result, filter, pindah hasil, Escape, sidebar hover, mobile drawer, scroll terpisah                                                                 | Lulus selain fokus keyboard sidebar F-02                                                                                      |
| Focus mode               | Native fullscreen desktop/HP, pindah tab, keluar tombol/browser, restore                                                                                       | Lulus di Chrome                                                                                                               |
| Recovery/responsif       | Storage demo rusak, sesi tidak dikenal, overflow halaman, auth 320/390/768/1440, halaman utama 390/1024/1440                                                   | Lulus pada kondisi yang diuji; browser iOS/Safari/Firefox belum dijalankan                                                    |

Tidak ada klaim “semua fitur 100% bebas bug”. Test case menguji jalur dan kondisi tertentu. Integrasi cloud/SMTP/Storage nyata, deployment Worker, dan rekaman perangkat fisik masih memerlukan verifikasi tersendiri.

## 5. Audit tulisan kecil agar tampilan lebih clean

40 screenshot diambil pada 10 halaman × 2 peran × 2 lebar layar. Teks kecil diinventarisasi di `ui-labels-*.json`, lalu screenshot pertanyaan, catatan, profil, dan detail course ditinjau secara visual. Tidak semua teks berukuran kecil perlu dihapus: isi materi, tanggal, identitas course, dan status yang membantu tindakan tetap berguna.

| Prioritas | Lokasi dan teks sekarang                                                                       | Saran                                                                              | Alasan                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Tinggi    | Footer input pertanyaan: **Anonim**                                                            | Hapus label dan ikon orang di footer; tetap simpan placeholder “Tanya tanpa nama…” | Makna privasi sudah disampaikan placeholder; ini contoh pengulangan yang dimaksud pengguna |
| Tinggi    | Catatan → Peta konsep: “Lihat hubungan antar subbab.”                                          | Hapus kalimat; pertahankan judul dan aksi Jelajahi                                 | Mengulang arti peta konsep tanpa membantu keputusan                                        |
| Tinggi    | Footer capture: “Lihat preview sebelum menyimpan”                                              | Hapus dari tampilan permanen                                                       | Alur sudah membuka preview sebelum tombol Simpan                                           |
| Tinggi    | Profil → Akun: “Kelola sesi masuk di perangkat ini.”                                           | Hapus; cukup judul Akun dan tombol Keluar                                          | Hanya ada satu aksi, jadi penjelasan tidak diperlukan                                      |
| Sedang    | Preview capture: rentang waktu + “90 detik terakhir”                                           | Pertahankan rentang; hapus akhiran yang berulang                                   | Tombol Capture 90 detik sudah menjelaskan durasi                                           |
| Sedang    | Graph kosong: “Hubungan subbab disusun dari pembahasan dosen.”                                 | Hapus; cukup “Peta konsep belum tersedia”                                          | Kalimat generik tidak menjelaskan tindakan atau penyebab spesifik                          |
| Sedang    | Berkas kelas: “Materi dosen” pada setiap file                                                  | Hapus; bila perlu ganti metadata nyata seperti tipe/ukuran file                    | Judul bagian sudah memberi konteks pemilik                                                 |
| Sedang    | Upload foto: “Terisi otomatis dari waktu kelas. Kamu bisa menyesuaikannya.”                    | Hilangkan atau jadikan tooltip dekat input waktu                                   | Input sudah berisi waktunya; kalimat panjang mengganggu form                               |
| Sedang    | Rangkuman course: “+N konsep”                                                                  | Gabungkan jumlah ke aksi Lihat materi, atau ganti istilah yang akurat              | Yang dihitung judul catatan, bukan konsep unik; judul berulang dapat menyesatkan           |
| Opsional  | Login subtitle “Lanjutkan dari yang terakhir kamu pelajari.” / daftar “Mulai dari satu kelas.” | Boleh dihapus jika ingin form lebih padat                                          | Bernilai tone, bukan instruksi fungsi; bukan bug                                           |
| Opsional  | “N pertanyaan” atau “N pertemuan”                                                              | Pertahankan hanya jika angka membantu memindai daftar                              | Lebih berguna daripada penjelasan anonimitas berulang; jangan dihapus otomatis             |

Lokasi implementasi: [questions-panel.tsx](../../../src/app/session/components/questions-panel.tsx:67), [notes-panel.tsx](../../../src/app/session/components/notes-panel.tsx:64), [transcript-panel.tsx](../../../src/app/session/components/transcript-panel.tsx:133), [profile/page.tsx](../../../src/app/profile/page.tsx:95), [capture-preview.tsx](../../../src/app/session/components/capture-preview.tsx), [graph-explorer.tsx](../../../src/features/graph/graph-explorer.tsx:146), [learning-resources.tsx](../../../src/app/session/components/learning-resources.tsx:157), [photo-dialog.tsx](../../../src/app/session/components/photo-dialog.tsx:91), [course-overview.tsx](../../../src/app/classes/components/course-overview.tsx:58).

Yang **tetap disarankan ada**: status Live/processing/error, status “Dijawab di kelas”, konfirmasi email, label field, batas format/ukuran upload, waktu sumber pada transkrip/bookmark, identitas dosen/kode course, dan keterangan pemulihan arsip di dialog konfirmasi. Ini membantu pengguna bertindak atau memahami konsekuensi.

Contoh bukti visual: [Pertanyaan](screenshots/student-1440-5.png), [Catatan](screenshots/student-1440-6.png), [Profil](screenshots/student-1440-1.png), [Course dosen pada HP](screenshots/lecturer-390-3.png).

## 6. Urutan tindak lanjut

1. Pulihkan akses melengkapi/meninjau draf agenda; tambah regression test UI untuk pengumuman tanpa tanggal.
2. Perbaiki fokus keyboard sidebar.
3. Perbarui locator capture lama dan bersihkan `notes` pada reset fixture agar suite bisa diulang secara andal.
4. Uji bundle Cloudflare di Linux/WSL/CI; selesaikan missing middleware trace sebelum deployment.
5. Terapkan penghapusan microcopy prioritas tinggi tanpa menghapus status/error/konteks sumber yang berguna.
6. Bedakan agenda tanggal saja dari agenda berjam; evaluasi AI agar pengumuman penting tanpa tanggal tidak hilang.
7. Uji dua akun Supabase nyata, konfirmasi email, Storage, antrean job kelas buatan, dan satu rekaman perangkat nyata. Migration 003 di server harus diverifikasi, bukan diasumsikan dari keberadaan file SQL.

## 7. Reproduksi dan artefak

```powershell
npm.cmd run typecheck
npm.cmd run test:backend
npx.cmd playwright test --config playwright.audit.config.ts tests/app.spec.ts tests/focus-mode.spec.ts --output test-results/qa-demo-final
npx.cmd playwright test --config playwright.audit-live.config.ts tests/live.spec.ts --output test-results/qa-live-all-final
npx.cmd playwright test --config playwright.audit.config.ts tests/qa-audit.spec.ts --output test-results/qa-demo-verified
npx.cmd playwright test --config playwright.audit-live.config.ts tests/qa-live-audit.spec.ts --output test-results/qa-live-verified
npm.cmd run setup:check -- --online
npx.cmd tsx scripts/qa-ai.ts
node scripts/qa-report.cjs
```

Konfigurasi audit menggunakan port 3197 (demo) dan 3188/54339 (live fixture), dengan distDir/outputDir terpisah. Opsi reuseExistingServer ditujukan untuk server tes milik konfigurasi tersebut. Jangan menjalankan dua runner yang menggunakan fixture global yang sama secara bersamaan. `qa-ai.ts` menghubungi Gemini asli dan memakai kuota API, dengan data sintetis saja. `qa-report.cjs` membaca JSON hasil run final untuk membuat CASES.md.

Log percobaan awal, run ulang, JSON final, dan 40 screenshot berada di folder laporan ini. Bukti screenshot/trace kegagalan final berada di `test-results/qa-demo-final`, `test-results/qa-live-all-final`, dan `test-results/qa-live-verified`; folder `test-results` diabaikan Git. JSON dan laporan utama tetap dapat dibaca tanpa trace.
