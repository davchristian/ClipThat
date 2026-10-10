# ClipThat · Frontend

Alur utama: **Home → klik course yang sedang berlangsung → sesi kelas → rangkuman di Course**. Navigasi mahasiswa berisi Home, Course, dan Agenda. Penanda, capture, serta foto pribadi terlihat pada pertemuan asalnya di Course.

## Jalankan

Butuh Node.js 20.9+.

```powershell
npm.cmd install
npm.cmd run dev
```

Buka alamat Local di terminal, biasanya http://localhost:3000. Klik kelas yang sedang berlangsung di Home untuk langsung masuk, atau pilih pertemuan dari Course. Peran mahasiswa/dosen bisa diganti di bawah sidebar atau melalui Pengaturan.

## Coba fitur

- **Capture 90 detik** langsung menyimpan, tanpa dialog yang mengganggu kelas.
- Ikon bookmark menandai pembahasan untuk diulang. Penanda lama tetap tersimpan di course asalnya.
- Foto murid diberi waktu transkrip secara otomatis dan dapat disesuaikan sebelum disimpan. Foto tampil di dekat pembahasan terkait.
- Ruang kelas memakai tiga tab: Transkrip, Ringkasan, Pertanyaan. Ringkasan menampilkan hasil bersama, peta konsep, dan bagian pribadi murid. Menu **⋯** membuka Materi dan peta konsep lengkap.
- Pertanyaan anonim diurutkan berdasarkan jumlah dukungan agar dosen melihat kebingungan yang paling banyak dirasakan.
- Agenda berbentuk kalender bulanan dengan detail tanggal yang dipilih. Usulan dari kelas harus dikonfirmasi; form awal hanya judul, tanggal, dan waktu.
- Home menampilkan satu notifikasi yang belum diatasi. Modal menampilkan status tiap notifikasi; klik status untuk menandai sudah atau belum diatasi. Pilihan tersimpan di browser.
- Dosen bisa membuat/mulai/akhiri sesi, menjawab pertanyaan, menambah materi, mengoreksi peta, dan mengarsipkan sesi selesai.

## Struktur

```text
src/
  app/page.tsx            Isi Home
  app/components/         Sidebar, layout, kalender Home, dan notifikasi
  app/agenda/             page.tsx, komponen agenda, dan agenda.css
  app/classes/            page.tsx, detail [id], komponen Course, dan course.css
  app/session/            Detail [id], komponen ruang kelas, dan classroom.css
  app/settings/           page.tsx dan settings.css
  components/ui/          UI yang dipakai lintas halaman (Modal, Logo, dll.)
  components/saved-detail.tsx  Detail simpanan yang dipakai Course dan sesi
  data/mock/              Data contoh: course, sesi, transkrip, catatan, state awal
  data/index.ts           Satu pintu impor konten; ganti sumbernya saat API siap
  data/client-storage.ts  Baca/tulis state demo ke localStorage
  state/                  AppProvider untuk state UI dan perubahan data
  lib/                    Tipe domain serta utilitas umum
  styles/                 CSS dasar, layout umum, dan breakpoint
tests/          Pengujian alur browser
docs/screenshots/  Preview frontend terbaru
```

Untuk mengubah sidebar, buka `src/app/components/sidebar.tsx` dan `src/app/components/sidebar.css`. CSS halaman lain berada di folder halaman tersebut.

Eksperimen Figma lama dipisah ke [archive](../archive/README.md). Aplikasi tidak membutuhkan plugin Figma.

## Periksa dan rapikan

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run format:check
npm.cmd run format
```

Playwright memakai Chrome terpasang dan port **3100** untuk memisahkan pengujian dari server kerja di 3000. Jika Chrome belum terpasang, jalankan `npx.cmd playwright install chrome`.

## Mode demo

Data kelas dimulai dari contoh 5 Oktober 2026. Perubahan disimpan di browser dengan key lama `clipthat-frontend-v1`, sehingga perubahan tampilan tidak menghapus simpanan. Untuk mengganti data contoh, edit `src/data/mock/`. Ketika backend siap, sambungkan pemuatan data melalui `src/data/index.ts` dan penyimpanannya melalui `src/data/client-storage.ts`; komponen halaman tetap membaca data lewat modul `data` dan `AppProvider`.
Tanggal dan jam contoh untuk kalender serta nilai awal form dipusatkan di `src/data/mock/constants.ts`. Jam di sidebar membaca waktu saat ini dalam zona Asia/Jakarta dan memperbarui tampilannya otomatis. Jarak luar halaman dan ukuran judul utama memakai aturan yang sama, termasuk halaman transkrip live.

Relasi data contoh mengikuti ID yang sama: `lesson.courseId` mengarah ke `course.id`; `question.sessionId` dan `saved.sessionId` mengarah ke `lesson.id`; `agenda.courseId` mengarah ke `course.id`. Materi, catatan, dan peta konsep per pertemuan menggunakan `lesson.id` sebagai key. Data awal perubahan pengguna berada di `src/data/mock/initial-state.ts`; konten statis tiap jenis ada di file lain dalam `src/data/mock/`.

Transkrip, ringkasan, pertanyaan rekomendasi, dan rekap adalah contoh. Mikrofon, Whisper/Gemini, Supabase, autentikasi, dan sinkronisasi Google Calendar/Notion/Outlook belum terhubung. Konfigurasi kalender hanya menyimpan tujuan. Ekspor `.ics` menghasilkan berkas kalender yang dapat diimpor manual. Foto/materi maksimal 1 MB per berkas. Latihan personal tetap untuk pengembangan berikutnya.
