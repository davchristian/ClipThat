# ClipThat · Frontend

Alur utama: **Kelas → Capture → Preview → Simpan atau Buang → Tersimpan**. Navigasi mahasiswa hanya Kelas, Tersimpan, dan Agenda. Materi, peta konsep, dan detail tambahan dibuka saat dibutuhkan.

## Jalankan

Butuh Node.js 20.9+.

```powershell
npm.cmd install
npm.cmd run dev
```

Buka alamat Local di terminal, biasanya http://localhost:3000. Coba kode **ALG05**. Peran mahasiswa/dosen bisa diganti di bawah sidebar atau melalui Pengaturan.

## Coba fitur

- **Capture 90 detik** membuka panel preview yang lebih lebar di kanan transkrip. Ringkasan, sumber, dan saran pertanyaan dapat ditinjau sebelum memilih **Simpan capture** atau ikon tempat sampah. Di layar kecil atau pendek, preview tampil sebagai dialog dengan tombol aksi tetap terlihat.
- Preview belum disimpan ke browser. Menutup, membuang, atau memuat ulang halaman tidak menambah simpanan; **Simpan capture** menyimpan hasilnya satu kali. Saran pertanyaan hanya dikirim melalui **Kirim anonim**.
- Ikon bookmark menandai pembahasan untuk diulang. Penanda lama tetap tersimpan.
- **Tersimpan** membuka ringkasan atau foto; pengiriman pertanyaan menjadi pilihan tambahan.
- Ruang kelas memakai empat tab yang terlihat langsung: **Transkrip, Catatan, Pertanyaan, Materi** untuk mahasiswa dan dosen. Di Materi, berkas kelas diikuti peta konsep; pilih subbab untuk membuka penjelasan dan pembahasan terkait.
- Halaman **/login** dan **/register** memuat form dengan validasi, tombol tampilkan kata sandi, serta pilihan peran saat daftar. Tombol masuk/daftar membuka demo; belum membuat atau memverifikasi akun. Kredensial tidak disimpan atau dikirim.
- Agenda berbentuk daftar. Usulan dari kelas harus dikonfirmasi; form awal hanya judul, tanggal, dan waktu.
- Dosen bisa membuat/mulai/akhiri sesi, menjawab pertanyaan, menambah materi, mengoreksi peta, dan mengarsipkan sesi selesai.

## Struktur

```text
src/
  app/          Rute Next.js
  components/   UI bersama dan layout aplikasi
  features/     auth, classes, session, saved, agenda, settings
  state/        AppProvider dan penyimpanan lokal
  lib/          Tipe domain, data demo, format, file, kalender
  styles/       Token warna dan stylesheet
tests/          Pengujian alur browser
docs/screenshots/  Preview frontend terbaru
```

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

Pengujian responsif mencakup lebar 320, 390, 768, 1024, 1366, dan 1440 px, termasuk landscape 844 × 390. Alur empat tab dan peta konsep diperiksa untuk mahasiswa dan dosen; panel capture diperiksa hingga 1280 px. Ini pengujian browser dengan ukuran layar simulasi, belum pengujian pada perangkat fisik.

## Mode demo

Data kelas dan tanggal menggunakan contoh 5 Oktober 2026. Perubahan disimpan di browser dengan key lama `clipthat-frontend-v1`, sehingga perubahan tampilan tidak menghapus simpanan.

Transkrip, ringkasan, pertanyaan rekomendasi, dan rekap adalah contoh. Mikrofon, Whisper/Gemini, Supabase, autentikasi, dan sinkronisasi Google Calendar/Notion/Outlook belum terhubung. Konfigurasi kalender hanya menyimpan tujuan. Ekspor `.ics` menghasilkan berkas kalender yang dapat diimpor manual. Foto/materi maksimal 1 MB per berkas. Latihan personal tetap untuk pengembangan berikutnya.
