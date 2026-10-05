# ClipThat — Semua Layar Desktop v3.1

Perbaikan 3.1: nilai `overflowDirection` diganti menjadi `VERTICAL` sesuai API Figma. Laporan pengguna sebelumnya menunjukkan `VERTICAL_SCROLLING` menghentikan proses pada layar pertama sebelum koneksi prototype dibuat. Nama plugin di menu tetap **ClipThat — Semua Layar Desktop v3**; panel terbaru menampilkan **V3.1**. Tutup plugin lalu jalankan lagi dari manifest folder project untuk memuat kode terbaru.

Plugin membuat **24 layar utama, 20 dialog, dan 45 variasi kondisi** sebagai layer Figma yang dapat diedit. Frame aplikasi berukuran desktop 1440 × 1000 px.

## Langkah yang perlu dilakukan

1. Buka [file wireframe ClipThat](https://www.figma.com/design/GIWuSKUmk2LfEodDMjdFuA) di Figma desktop.
2. Pilih **Plugins → Development → Import plugin from manifest…**, lalu pilih manifest di folder project ini:

```text
C:\Users\davin\OneDrive\Documents\VS code\ClipThat\src\concept\uiux\plugin\manifest.json
```

3. Jalankan **Plugins → Development → ClipThat — Semua Layar Desktop v3**.
4. Tunggu panel menampilkan **Seluruh layar sudah tersedia.**

**Import mendaftarkan plugin. Menjalankan plugin memulai pembuatan desain secara otomatis.** Tidak perlu menekan tombol Build, memperbaiki flow, atau membuat page sendiri.

Hasil ditaruh pada page **ClipThat — UI UX Desktop** di dalam file yang sedang terbuka. Wireframe sebelumnya tetap tersedia. Seluruh frame aplikasi langsung ditampilkan sebagai grid lima kolom; Cover, indeks skenario, dan komponen ditempatkan di sisi grid.

Jalankan dari folder project di atas agar perubahan kode langsung digunakan saat plugin dibuka ulang. Teks **DESKTOP · V3** di bagian atas panel menandakan paket terbaru. Jika masih memakai paket ZIP, ekstrak seluruh isinya ke folder tetap; manifest, code.js, dan ui.html harus tetap bersama.

## Melihat layar

- **Semua layar**: lihat 89 frame sekaligus.
- **Layar utama**: perbesar kumpulan 24 halaman utama.
- **Lihat Beranda mahasiswa / dosen**: langsung pilih dan perbesar layar tersebut.
- **Buka layar lain**: pilih halaman dari daftar, tanpa masuk Present.
- **Coba layar ini di Present**: memilih frame aplikasi dan menutup plugin. Setelah itu klik **▶** di kanan atas Figma.

Memilih layar melalui panel plugin bekerja di kanvas Design. Tombol di dalam rancangan aplikasi menjalankan navigasi contoh ketika Present dibuka.

## Menjalankan kembali dan kegagalan

Hasil v3 yang selesai akan dibuka kembali saat plugin dijalankan ulang, tanpa menggandakan desain. Desain v1/v2 yang pernah dibuat tidak dihapus; v3 membuat hasil baru di page dalam file yang sama.

Panel menampilkan pesan kegagalan jika pembuatan belum selesai. Layar yang sempat dibuat tetap dapat dibuka melalui daftar. **Laporan pembuatan → Unduh laporan** menyimpan ID layar, jumlah koneksi yang tersimpan, dan kesalahan yang perlu diperiksa. Coba lagi mempertahankan hasil parsial dan memulai page baru; batas jumlah page dari Figma akan dilaporkan bila tercapai.

Jika Figma meminta ID plugin yang diterbitkan Figma, buat plugin development melalui **New Plugin…**, salin code.js dan ui.html dari folder ini ke folder yang dibuat Figma, lalu pertahankan id dari manifest Figma. Gunakan main: code.js, ui: ui.html, editorType: ["figma"], documentAccess: "dynamic-page", dan networkAccess: {"allowedDomains":["none"]}.

## Perbaikan v3

- Mulai otomatis saat plugin dijalankan; hasil langsung memperlihatkan frame aplikasi.
- Page hasil dibuat dalam file yang sedang terbuka dan dipakai kembali pada peluncuran berikutnya.
- Panel navigasi dapat memilih setiap layar melalui kanvas.
- Tinggi teks diatur menyesuaikan isi setelah pengaturan ukuran.
- Navigasi tombol dipasang pada frame pembungkus yang tetap. Pergantian varian saat hover tidak dipakai untuk tombol navigasi.
- Koneksi dibaca kembali sesudah ditulis. Layar ditampilkan sebelum pemasangan prototype, sehingga kegagalan navigasi tidak menyembunyikan hasil.

## Batas pemeriksaan

Sumber desain, paket, startup otomatis, pemakaian ulang page, pemilihan layar, serta target navigasi diperiksa secara lokal. Panel plugin diuji di browser dengan daftar 89 layar. Pemeriksaan runtime memakai API double dan tidak membuktikan perilaku Figma sesungguhnya.

**Eksekusi v3 dan Present di Figma belum diverifikasi.** Akses MCP masih dibatasi kuota Starter. Laporan dari plugin yang dijalankan di Figma menjadi bukti hasil aktual.

Prototype memakai data contoh. Form, audio, AI, unggahan file, autentikasi, dan sinkronisasi kalender belum menjalankan layanan aplikasi sesungguhnya.

## Referensi

- [Figma: plugin development](https://help.figma.com/hc/en-us/articles/360042786733-Create-a-classic-plugin-for-development)
- [Figma: prototype reactions](https://developers.figma.com/docs/plugins/api/properties/nodes-reactions/)
