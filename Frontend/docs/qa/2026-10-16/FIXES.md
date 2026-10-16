# Perbaikan setelah audit

Tanggal: 16 Oktober 2026. Laporan audit awal tetap tersedia di [REPORT.md](REPORT.md); hasil sebelum perbaikan tidak ditimpa.

## Perubahan

- Draf agenda muncul di bagian **Perlu dilengkapi**, dengan tombol Tinjau. Tanggal/jam kosong diberi nilai awal yang bisa diedit di dialog. Draf tetap berada di luar kalender sampai dikonfirmasi, dan konfirmasi bertahan setelah reload.
- Sidebar mempertahankan tautan avatar yang sama saat mengecil/membesar. Fokus keyboard kini bisa membuka label tanpa kehilangan fokus karena tautannya disembunyikan. Hover mouse tetap menutup saat pointer keluar.
- Tes capture memakai Bagian tersimpan di tab Catatan, bukan tombol Tersimpan lama. Locator tombol Transkrip dibatasi ke navigasi tab agar tidak tertukar dengan tombol sumber di catatan.
- Reset Supabase fixture mengosongkan catatan pribadi serta mengembalikan metadata course dan sesi. Tes berikutnya tidak mewarisi nama course/topik atau catatan dari tes sebelumnya.
- Pengumuman penting tanpa tanggal diwajibkan tetap menjadi agenda dengan `due_at: null`, dan diuji dengan Gemini asli menggunakan ekspektasi yang tidak bisa lulus hanya karena agenda kosong.

## Graph dan rangkuman bab

- Satu panel preview berada di **kiri** graph pada desktop. Pada HP, preview menggantikan area graph sementara dan dapat ditutup; tidak ada panel detail kedua di bawah.
- Daftar rangkuman berulang di bawah graph pada halaman materi course, dropdown Pilih subbab, penghitung subbab/hubungan, serta daftar relasi tambahan di preview dihapus. Tombol Koreksi hubungan untuk dosen tetap ada.
- Instruksi Gemini menyatakan satu node = satu **bab utama**. `description` menjadi rangkuman utuh bab tersebut; `sections` berisi judul subbab dan ID sumber untuk tautan pembahasannya.
- Tautan di preview membuka bagian transkrip yang tepat. Pada graph gabungan beberapa pertemuan, session ID masing-masing tautan dipertahankan supaya sumber tidak diarahkan ke pertemuan yang salah.
- Rangkuman dan sumber dari bab yang sama pada beberapa pertemuan tidak lagi hilang saat graph digabung. Sumber subbab ikut divalidasi saat hasil AI dibuat atau dosen menyimpan koreksi graph.
- Hasil lama tetap kompatibel: bila belum punya `sections`, tombol Buka pembahasan memakai sumber yang sudah ada. Hasil Gemini lama **tidak diproses ulang otomatis**; struktur bab baru berlaku pada pemrosesan berikutnya. Tidak diperlukan migration database untuk field graph tambahan karena tersimpan dalam JSON.

Contoh tampilan: [desktop](fixes/graph-1440.png), [HP](fixes/graph-390.png).

## Teks yang dihapus atau diringkas

- Anonim pada footer input pertanyaan; placeholder Tanya tanpa nama tetap menjelaskan privasinya.
- Lihat preview sebelum menyimpan.
- Lihat hubungan antar subbab.
- Kelola sesi masuk di perangkat ini.
- Hubungan subbab disusun dari pembahasan dosen.
- Materi dosen yang diulang pada setiap berkas.
- Keterangan panjang bahwa waktu foto terisi otomatis.
- Akhiran 90 detik terakhir pada preview capture; rentang waktu sumber tetap ditampilkan.
- +N konsep diganti +N materi lainnya, sesuai hal yang dihitung.

Penghapusan ini tidak mengubah data atau hak akses. Label field, status Live/proses/error, status jawaban, konfirmasi email, ketentuan berkas, dan tautan/waktu sumber tetap dipertahankan.

## Verifikasi

Hasil terbaru tersedia dalam folder [fixes](fixes). Tes browser meliputi desktop dan simulasi HP; ini bukan pengujian perangkat fisik.

**Hasil akhir per kasus: 55 backend, 33 browser demo/UI, 19 browser live fixture, dan 6 skenario Gemini asli memiliki bukti lulus (113 kasus unik).** Typecheck dan build produksi Next.js juga lulus. Run browser demo penuh terakhir mencatat 32 lulus dan satu timeout pada matrix 27 navigasi halaman; batas waktu khusus matrix tersebut disesuaikan, kemudian kasus itu lulus pada uji ulang 11,5 detik. Ini tercatat terpisah agar hasil retry tidak disamarkan sebagai satu run penuh tanpa kegagalan. Bukti uji ulang: [layout-verified.json](fixes/layout-verified.json).

| Pemeriksaan                                                                                   | Bukti                                              |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Backend, termasuk sumber graph dan penggabungan bab                                           | [backend-final.log](fixes/backend-final.log)       |
| Browser demo dan audit UI                                                                     | [demo-verified.json](fixes/demo-verified.json)     |
| Browser live dengan Supabase fixture, termasuk preview bab dan tautan subbab di 1440/390px    | [live-verified.json](fixes/live-verified.json)     |
| Gemini asli: bab/subbab, materi+obrolan, tanggal ambigu, revisi tanggal, dan cerita hipotetis | [ai-real-results.json](fixes/ai-real-results.json) |
| Build produksi Next.js                                                                        | [build.log](fixes/build.log)                       |

Run awal setelah perubahan sempat gagal karena locator/alur lama serta assertion yang mengasumsikan urutan array relasi. Assertion kini mencari relasi berdasarkan node sumber, bukan indeks pertama. Log percobaan tersebut tetap disimpan; gunakan file `*-verified` untuk status akhir browser.

## Batas yang masih tersisa

- Pembaruan: build Cloudflare dan preview workerd lokal sudah lulus di Windows menggunakan proyek utama dan dependency lokal. Lihat [verifikasi Windows](CLOUDFLARE-WINDOWS.md). Deployment produksi, Linux/WSL/CI, dan alur akun asli pada Worker belum diverifikasi; konfigurasi Wrangler publik masih perlu diisi.
- Auth email, Storage, job runner dan migration pada Supabase asli belum diuji end-to-end dengan akun kelas nyata. Pengujian live browser di atas menggunakan fixture; pengujian Gemini memakai layanan asli dengan data sintetis.
- Representasi agenda tanggal saja sebagai event all-day (Q-01 dalam laporan awal) belum diubah. Jam 00:00 masih menjadi penanda ketika pengumuman tidak menyebut jam.
- Backlog format seluruh repository tidak diformat massal. Hanya file yang disentuh pada perbaikan ini yang dirapikan.
