# Mengajar dan kode course

Home tidak memiliki tombol membuat sesi. Daftar Course untuk dosen hanya memiliki tombol **Buat course**; untuk mahasiswa, tombol **Gabung course**.
Di detail course, gunakan **Mulai kelas**, isi topik (atau gunakan judul bawaan), lalu **Mulai & rekam**.
Browser akan meminta izin mikrofon jika belum diberikan. Jika izin ditolak, kelas tetap terbuka dan tombol **Rekam** bisa dicoba lagi.

**Akhiri kelas** otomatis menghentikan rekaman dan menunggu transkrip terakhir tersimpan sebelum mengantrekan catatan.
Jika penyimpanan gagal, tombol **Coba kirim ulang** tetap tersedia dan kelas belum diakhiri.
Catatan diproses oleh job runner; saat lokal jalankan `npm run jobs:watch` di terminal kedua.

## Pengumuman penting dan catatan

Jalankan `supabase/migrations/202610160003_automatic_class_agenda.sql` setelah migrasi kode course.
Ketika job hasil kelas selesai, pengumuman kuis, presentasi, deadline tugas, dan ujian dengan tanggal jelas otomatis masuk ke agenda mahasiswa anggota course.
Tanggal relatif seperti “minggu depan hari Selasa” mengacu pada tanggal kelas di Asia/Jakarta, bukan tanggal job dijalankan. Jika jam tidak disebut, tanggal disimpan pada 00:00; jam bisa diedit di Agenda. Pengumuman tanpa tanggal jelas tetap menjadi draf untuk dilengkapi.
Pengulangan job tidak menggandakan kegiatan atau menimpa perubahan pribadi mahasiswa. Pengumuman dari kelas yang sudah selesai sebelum migrasi tidak diproses ulang otomatis.
Catatan dan peta konsep hanya mencakup materi serta contoh/analogi yang relevan. Cerita di luar materi tetap tersedia di transkrip; kelas tanpa materi boleh menghasilkan catatan kosong.

## Aktifkan kode course

Jalankan `supabase/migrations/202610160002_course_join_codes.sql` di SQL Editor proyek Supabase yang dipakai aplikasi, setelah migrasi sebelumnya.
Migrasi ini memberi kode gabung otomatis untuk course lama maupun baru, dan menambahkan fungsi `join_course` yang memeriksa akun mahasiswa.
Menjalankan aplikasi saja tidak menerapkan migrasi ini ke Supabase. Tidak perlu API key baru.

1. Dosen membuat course dari halaman **Course**. Kode gabung tampil di detail course dan bisa disalin.
2. Mahasiswa membuka halaman **Course**, memilih **Gabung course**, memasukkan kode dari dosen, lalu **Gabung**.
3. Course masuk ke akun mahasiswa beserta akses ke pertemuannya. Tidak perlu kode setiap sesi.

Kode gabung terdiri dari 10 huruf/angka dan berbeda dari kode mata kuliah seperti IF2123. Kode tetap sama selama course tersebut ada.
Gabung ulang tidak menggandakan keanggotaan. Mahasiswa hanya mendapat akses ke course dengan kode yang dimasukkan.
Demo Aljabar Linear memakai kode `CLIP000001`; mode live memakai kode yang dibuat database.
