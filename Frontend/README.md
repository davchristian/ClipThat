# ClipThat · Frontend

Web app untuk mengikuti kelas, menyimpan momen penting, dan mengulang materi. Dibuat dari konsep baru; tidak menggunakan layout atau generator dari `src/concept/uiux` maupun wireframe Figma lama.

## Jalankan

Butuh Node.js 20.9+ dan npm. Dari folder ini:

```sh
npm install
npm run dev
```

Buka **http://localhost:3000**. Di PowerShell, gunakan `npm.cmd` jika execution policy memblokir `npm.ps1`.

```sh
npm run typecheck
npm run build
npm start
```

## Konsep tampilan

**Ruang belajar yang tenang.** Satu tindakan utama di setiap konteks: masuk kelas, capture pembahasan, atau melanjutkan review. Detail tersedia lewat tab dan dialog agar beranda tidak menjadi kumpulan instruksi panjang.

- Desktop: navigasi tetap di kiri, ruang konten lebar, agenda kecil di kanan.
- Latar ivory, hijau forest, aksen sage dan apricot. Tidak memakai ungu.
- Tipografi DM Sans yang disimpan lokal; ikon Lucide; ilustrasi buku berupa SVG.
- Tablet memakai navigasi ringkas. Pada ponsel, sidebar menjadi menu dan panel tersusun vertikal.
- Dialog native dengan focus trap, kontrol berlabel, fokus keyboard, skip link, dan dukungan reduced motion.

Referensi konsep baru: alur membaca dan menyimpan bagian penting dari [Readwise Reader](https://docs.readwise.io/reader/docs). Layout, ilustrasi, warna, dan implementasi dibuat khusus untuk ClipThat. Acuan teknis: [Next.js App Router](https://nextjs.org/docs/app/getting-started/installation) dan [Tailwind CSS](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

## Coba alurnya

1. Dari beranda, **Gabung kelas** dengan kode **ALG05**, atau klik **Masuk kelas**.
2. Tandai **Bingung** / **Review nanti** pada transkrip. **Capture 90 detik** menyimpan cuplikan 17:00–18:30; pertanyaan hanya terkirim setelah tombol **Kirim anonim** ditekan.
3. Buka **Pertanyaan** untuk bertanya dan mendukung pertanyaan, **Catatan** untuk membaca dan menulis catatan pribadi, serta **Peta materi** untuk menjelajah subbab.
4. Tambahkan foto papan dengan timestamp, lalu buka **Review saya**. Tandai bagian **Sudah paham** atau hapus dari koleksi.
5. Di **Agenda**, tinjau usulan kelas sebelum mengonfirmasi. Tambah/edit/hapus agenda, tandai selesai, pindah minggu, atau unduh `.ics`.
6. Ubah peran menjadi **Dosen** di bawah sidebar atau di **Pengaturan**. Jawab pertanyaan, ubah hubungan subbab, tambah materi, buat/mulai/akhiri kelas. Sesi selesai dapat diarsipkan dan dipulihkan selama 30 hari.
7. **Pengaturan → Reset ruang demo** mengembalikan data awal.

Tanggal demo adalah **5 Oktober 2026**. Sesi, materi, nama pengguna, dan statistik kelas merupakan contoh. Perubahan disimpan pada `localStorage` browser ini. Dua peran menggunakan data contoh bersama agar alurnya bisa diuji tanpa server.

## Halaman

| Rute | Fungsi |
| --- | --- |
| `/` | Beranda mahasiswa / dosen |
| `/classes` | Mata kuliah dan daftar pertemuan |
| `/classes/[id]` | Pertemuan dalam satu mata kuliah, arsip dosen |
| `/session/[id]` | Ruang kelas: transkrip, catatan, pertanyaan, peta, materi |
| `/review` | Koleksi capture, bookmark, foto pribadi |
| `/agenda` | Agenda mingguan, konfirmasi, editor, ekspor kalender |
| `/settings` | Peran demo, tujuan integrasi, reset data |

## Batas frontend

- **Belum ada** autentikasi, backend, Supabase, Whisper, Gemini, atau rekaman mikrofon. Transkrip, catatan kelas, pertanyaan rekomendasi, dan rekap kelas menggunakan data contoh; bukan hasil AI aktual.
- Teks pertanyaan anonim dan rekap tidak menampilkan identitas. Pembatasan tampilan peran bukan otorisasi server; jangan gunakan untuk data pribadi sungguhan.
- Foto dan unggahan materi maksimal **1 MB per berkas** untuk demo. Penyimpanan mengikuti kuota browser. Tanpa backend, berkas tidak dibagikan ke perangkat pengguna lain.
- Google Calendar, Notion, dan Outlook memiliki antarmuka konfigurasi tujuan. **Belum ada OAuth atau sinkronisasi.** Ekspor `.ics` benar-benar menghasilkan berkas, tetapi perubahan berikutnya perlu diimpor ulang secara manual. Pengingat hanya disimpan sebagai preferensi / alarm dalam berkas kalender.
- Sesi baru menggunakan isi pembelajaran contoh, bukan menghasilkan materi dari judul yang dimasukkan.
- Latihan personal tetap untuk pengembangan berikutnya.

## Struktur

```text
src/app/          Rute Next.js, layout, Tailwind dan gaya global
src/components/   Tampilan, dialog dan interaksi setiap fitur
src/lib/data.ts   Tipe domain dan data contoh
src/lib/files.ts  Unduh berkas dan baca unggahan lokal
tests/            Pengujian alur browser dengan Playwright
docs/screenshots/ Hasil tangkapan layar untuk meninjau desain
```

Teknologi: **Next.js 16, React 19, TypeScript, Tailwind CSS 4**. Tidak ada kunci API atau layanan berbayar yang diperlukan untuk menjalankan frontend.

Integrasi berikutnya dapat mengganti state lokal di `AppProvider` dengan endpoint Next.js dan Supabase. Whisper/Gemini dipanggil melalui server agar kunci API tidak berada di browser. Deployment Cloudflare belum dikonfigurasi; adapter dan konfigurasi runtime dipilih saat backend/deployment dikerjakan.

## Pengujian

```sh
npm run test:e2e
```

Playwright menggunakan Chrome yang terpasang. Jika belum tersedia: `npx playwright install chrome`. Test memulai server dev bila port 3000 belum dipakai; bisa juga memakai server produksi yang sedang berjalan.

Skenario mencakup gabung kelas, capture, bookmark, pertanyaan dan voting, persistensi, catatan pribadi, review, konfirmasi dan CRUD agenda, ekspor kalender, dosen, arsip/pemulihan, foto, konfigurasi integrasi, reset, serta pemeriksaan overflow di desktop 1440 px dan mobile 390 px. Tangkapan layar ada di `docs/screenshots/`.
