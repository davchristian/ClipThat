# ClipThat — Wireframe v2 · Web App Desktop

Wireframe interaktif dengan 20 layar dan data contoh, berdasarkan [Functional Request](../../../docs/FuncReq.md). Tampilan grayscale berfokus pada hierarki informasi, navigasi, serta keadaan sukses dan gagal.

**Prototipe desktop terbaru:** `index.html` di folder ini, untuk mahasiswa dan dosen.

**File Figma versi sebelumnya:** [ClipThat — Wireframe v1](https://www.figma.com/design/GIWuSKUmk2LfEodDMjdFuA), di Davin Farel Santoso's team. Figma masih menggunakan layout mahasiswa di HP dan dosen di laptop. Pembaruan menjadi desktop untuk seluruh pengguna belum dapat diterapkan karena batas panggilan MCP paket Starter.

Figma memuat 20 layar utama dengan teks, komponen, layout, dan graph yang dapat diedit, serta 111 tautan navigasi prototipe. Dialog konfirmasi tambahan belum dibuat di Figma karena batas panggilan MCP paket Starter telah tercapai; gunakan prototipe lokal untuk mencoba dialog dan skenario kegagalan. State tindakan yang lebih lengkap berada di prototipe lokal, sementara Figma berfokus pada struktur layar dan navigasi.

Tipografi Figma menggunakan Inter dari Simple Design System. Tipografi browser menggunakan Arial sebagai font lokal. Keduanya merupakan pilihan wireframe sementara, bukan keputusan branding.

## Membuka prototipe

Buka `index.html` melalui browser. Tidak diperlukan instalasi, server, atau koneksi internet. `screens.js` harus tetap berada di folder yang sama.

- Pilih alur **Mahasiswa** atau **Dosen** pada bagian atas.
- Daftar layar di sebelah kiri adalah navigasi prototipe, bukan bagian aplikasi yang akan dibangun.
- Tombol di dalam layar menjalankan navigasi atau simulasi tindakan.
- Kontrol skenario di bawah layar memperlihatkan kondisi loading, gagal, dan konflik data.
- Tombol **Reset demo** menghapus state simulasi dan kembali ke beranda.
- Data simulasi hanya berada di memori halaman dan hilang setelah reload. Tidak ada akun yang dihubungkan, audio yang direkam, atau pertanyaan yang dikirim sungguhan.
- Seluruh pengguna, mahasiswa maupun dosen, menggunakan **web app desktop** sesuai keputusan pengguna terbaru.
- Pratinjau memakai area aplikasi hingga 1120 px pada browser desktop. Kedua peran memiliki header dan sidebar navigasi aplikasi.
- Layar kelas, capture, graph, dan agenda menggunakan panel utama serta panel tindakan/detail. Pada ruang yang lebih sempit, panel disusun vertikal agar tetap dapat dibaca.

Foto yang dipilih hanya dipratinjau secara lokal. Materi dosen dan referensi eksternal memakai placeholder yang dijelaskan, bukan tautan dokumen atau sumber penelitian rekaan.

## Alur yang bisa dicoba

### Mahasiswa

1. Beranda → Gabung kelas. Masukkan `ALG05`; kode lain menampilkan kegagalan.
2. Persiapan kelas → Kelas berlangsung. Tandai transkrip “Bingung” atau “Review nanti”.
3. Capture 90 detik → edit draf → kirim anonim atau simpan untuk review.
4. Pertanyaan kelas → dukung atau batalkan dukungan.
5. Tambah foto → pilih gambar lokal → sesuaikan timestamp → simpan dalam simulasi.
6. Kelas selesai → gunakan skenario pemrosesan selesai/gagal → Catatan kelas → Review personal → Peta materi.
7. Agenda akademik → Tinjau agenda → konfirmasi atau tolak → Integrasi agenda.
8. Gunakan skenario perubahan deadline, tanggal ambigu, agenda manual, dan sinkronisasi gagal.

### Dosen

1. Kelas saya → Buat sesi → pilih materi → Mulai kelas.
2. Kontrol kelas → tandai pertanyaan dijawab lisan atau publikasikan jawaban tertulis.
3. Akhiri kelas → konfirmasi → Rekap kelas.
4. Periksa graph → koreksi atau hapus hubungan dalam simulasi.
5. Hapus data sesi → tinjau dampak → Arsip penghapusan → pulihkan.

Jawaban dosen dapat diperiksa dengan berpindah kembali ke alur mahasiswa, tanpa reset.

## Daftar layar dan pemetaan kebutuhan

| ID layar | Aktor | Layar | Kebutuhan |
| --- | --- | --- | --- |
| s-home | Mahasiswa | Beranda | FR-001–003 |
| s-join | Mahasiswa | Gabung kelas | FR-003 |
| s-brief | Mahasiswa | Persiapan kelas | FR-004 |
| s-live | Mahasiswa | Kelas berlangsung | FR-007–009 |
| s-capture | Mahasiswa | Capture tersimpan | FR-009–010, FR-027 melalui dialog |
| s-questions | Mahasiswa | Pertanyaan kelas | FR-012–014 |
| s-photo | Mahasiswa | Tambah foto | FR-011 |
| s-processing | Mahasiswa | Kelas selesai / pemrosesan | FR-005, FR-015–017 |
| s-notes | Mahasiswa | Catatan kelas | FR-015–016, FR-018, FR-027 |
| s-review | Mahasiswa | Review personal | FR-008, FR-017–018, FR-025 |
| s-graph | Mahasiswa | Peta materi | FR-019 |
| s-agenda | Mahasiswa | Agenda akademik | FR-021–022, FR-024–025, FR-030 melalui dialog |
| s-agenda-change | Mahasiswa | Tinjau / edit agenda | FR-021–023 |
| s-integrations | Mahasiswa | Integrasi agenda | FR-024 |
| d-home | Dosen | Kelas saya | FR-001–003, FR-029 |
| d-setup | Dosen | Persiapan sesi | FR-002–003, FR-005–006 |
| d-live | Dosen | Kontrol kelas | FR-005–006, FR-013–014 |
| d-results | Dosen | Rekap kelas | FR-014, FR-026, FR-028 melalui dialog |
| d-graph | Dosen | Koreksi graph | FR-019–020 |
| d-archive | Dosen | Arsip penghapusan | FR-028–029 |

## Batas prototipe dan keputusan desain

- Layout, konten, serta urutan layar adalah usulan wireframe, belum desain visual final.
- Penanda transkrip, draf pertanyaan, dukungan, jawaban dosen, dan konfirmasi agenda memiliki state simulasi.
- Daftar mata kuliah, angka rekap, graph, transkrip, status waktu, serta progress memakai fixture. Bukan hasil AI atau data kelas nyata.
- Graph memungkinkan pemilihan node; kontrol dosen mengilustrasikan alur koreksi. Belum merupakan editor graph bebas.
- Diagram QR/kamera adalah placeholder; tersedia alternatif kode yang dapat diuji.
- Integrasi Google Calendar, Notion, dan Outlook hanya simulasi. Sinkronisasi satu arah masih merupakan asumsi sementara dalam functional request.
- Penghapusan pribadi dan data bersama memakai dialog konfirmasi. Arsip 30 hari merupakan aturan desain; prototipe tidak menyimpan file bersama atau menjalankan jadwal penghapusan.
- Latihan personal dan pembacaan isi foto oleh AI belum dimasukkan ke layar versi pertama.
- Metode login belum diputuskan, sehingga wireframe dimulai dari pengguna yang telah masuk.

## File

- `index.html`: tampilan dan interaksi prototipe.
- `screens.js`: spesifikasi konten layar dan ID kebutuhan.
- `README.md`: alur dan batas prototipe.
- `figma-build.js`: skrip historis penyusunan Figma v1; belum mewakili layout desktop v2. Memerlukan konteks Plugin API dan fondasi pada file yang dicatat.
- `figma-state.json`: ID file, layar, dan objek Figma untuk revisi berikutnya.
- `preview.png`: contoh tampilan prototipe lokal.
- `preview-dosen.png`: contoh layar kelas dosen pada desktop.

## Validasi versi desktop

Seluruh 20 layar diperiksa pada browser desktop. Sebanyak 154 pemeriksaan render, navigasi desktop, interaksi, dan overflow lolos pada lebar 1440, 1280, serta 1024 piksel, tanpa error JavaScript. Pratinjau layar kelas mahasiswa dan dosen sudah ditinjau secara visual.

Prototipe lokal tetap dapat digunakan tanpa akses Figma.
