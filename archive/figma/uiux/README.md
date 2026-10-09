> Arsip eksperimen Figma. Frontend aktif ada di [`../../../Frontend`](../../../Frontend/README.md).

# ClipThat — UI/UX Desktop

Rancangan visual baru berdasarkan [Functional Request](../../../docs/FuncReq.md), untuk mahasiswa dan dosen pada web app desktop.

**File tujuan:** page baru di [file wireframe ClipThat](https://www.figma.com/design/GIWuSKUmk2LfEodDMjdFuA). Plugin v3 bekerja di file Figma yang sedang terbuka.

**Status:** pengguna sudah menjalankan versi lama dan melaporkan tampilan yang sulit diakses serta tombol Present tidak bereaksi. Plugin v3 kini membuat page dan seluruh layar secara otomatis saat dijalankan, menampilkan grid, serta menyediakan daftar layar yang bisa dipilih langsung. Versi v3 lolos pemeriksaan lokal; hasil canvas dan Present Figma masih perlu diverifikasi karena kuota MCP membatasi akses langsung.

## Mulai di sini

- [Petunjuk instalasi plugin](plugin/README.md): langkah menjalankan di Figma desktop, termasuk alternatif bila diminta ID plugin.
- [Manifest siap diimpor](plugin/manifest.json): simpan bersama `code.js` dan `ui.html` dalam folder yang sama.
- [Pratinjau lokal](preview.html): buka di browser untuk melihat tampilan dan alur dari sumber desain yang sama. Ini bukan screenshot hasil Figma.
- [Paket ZIP](packages/ClipThat-UIUX-Figma-Plugin.zip): salinan paket plugin; ekstrak sebelum diimpor.

Plugin berisi **24 layar utama desktop, 20 dialog, dan 45 variasi kondisi**, fondasi warna, text styles, komponen, serta koneksi prototype. Desain mendukung kebutuhan FR-001–030 melalui layar dan state contoh. Form prototype menggunakan data tetap; AI, audio, login, dan sinkronisasi nyata belum diimplementasikan.

Font dipilih saat plugin berjalan: Nunito Sans → DM Sans → Arial → Inter, memakai pasangan Regular/Bold yang tersedia. Pratinjau browser mengikuti font lokal yang tersedia, sehingga metrik font dapat berbeda dengan hasil Figma.

## Arah pengalaman

ClipThat membantu mahasiswa tetap mengikuti kelas dan mengulang materi dengan tenang. Tampilan menggunakan latar hangat, ruang baca lega, satu tindakan utama per konteks, dan fitur tambahan yang dibuka ketika diperlukan.

- Saat kelas, transkrip menjadi pusat layar. Capture langsung menyimpan 90 detik terakhir; membaca rangkuman atau mengirim pertanyaan dapat dilakukan kemudian.
- “Bingung” dan “Review nanti” sama-sama penanda pribadi. Gunakan peach lembut, tanpa warna kesalahan atau penilaian kemampuan.
- Setelah kelas, tampilkan catatan seluruh sesi dan titik awal review yang jelas. Hindari streak, skor produktivitas, atau hitung mundur yang tidak dibutuhkan.
- Tindakan berisiko, seperti penghapusan, ditempatkan pada menu konteks dengan konfirmasi yang menjelaskan dampak.
- Teks status singkat dan konkret: “Tersimpan untukmu”, “Catatan sedang disiapkan”, “Kamu bisa kembali nanti”.
- Dosen menggunakan pola navigasi yang sama, dengan kontrol sesi, pertanyaan, dan rekap agregat yang sesuai hak aksesnya.

## Warna dan tipografi

| Token | Nilai | Peran |
| --- | --- | --- |
| `color/bg/app` | `#F6F3EC` | Oat cream; latar utama |
| `color/bg/surface` | `#FFFCF7` | Soft ivory; panel bacaan |
| `color/action/primary` | `#426451` | Muted forest; tindakan utama |
| `color/action/hover` | `#34513F` | Hover tombol utama |
| `color/bg/selected` | `#E7EDE3` | Sage; navigasi aktif dan status tersimpan |
| `color/bg/review` | `#F5E5D8` | Peach; penanda review |
| `color/text/review` | `#79533C` | Teks penanda review |
| `color/text/primary` | `#30352F` | Warm charcoal |
| `color/text/secondary` | `#656A60` | Teks pendukung |
| `color/border/subtle` | `#DDD9CF` | Pemisah dekoratif |
| `color/border/control` | `#858B7C` | Batas input yang perlu dikenali |
| `color/bg/error` | `#F9E7E2` | Latar kegagalan nyata |
| `color/text/error` | `#983F32` | Pesan gagal dan tindakan destruktif |

Tipografi usulan: **Nunito Sans** untuk UI dan bacaan; ketersediaan font harus diperiksa sebelum penulisan Figma. Gunakan alternatif sans-serif yang tersedia bila diperlukan, lalu catat pilihan aktual. Heading 28–32 px; judul panel 20 px; isi 16 px; transkrip 17–18 px dengan line-height sekitar 1,6; metadata 13–14 px.

Latar dan aksen dibuat lembut, tetapi teks tetap gelap. Status selalu disertai kata atau ikon, bukan dibedakan hanya melalui warna. Tombol memiliki area interaksi minimal 44 px dan fokus keyboard yang jelas. Hindari animasi berulang dalam area membaca.

## Struktur desktop

- Frame acuan 1440 px; sidebar sekitar 224 px; header sekitar 76 px; padding konten 32–40 px.
- Navigasi mahasiswa: Beranda, Mata kuliah, Review saya, Agenda, Pengaturan.
- Navigasi dosen: Beranda, Mata kuliah, Pertanyaan, Arsip, Pengaturan.
- Navigasi lokal sesi: Catatan, Transkrip, Pertanyaan, Peta materi, Materi. Foto dan capture berada dalam koleksi pribadi sesi.
- Kelas langsung: panel transkrip sekitar dua pertiga ruang; panel aksi/capture sekitar sepertiga. Detail panjang dapat dibuka terpisah.
- Batas lebar bacaan sekitar 680–760 px. Area graf dan agenda dapat lebih lebar.
- Pada desktop lebih sempit, sidebar dipadatkan dan panel tambahan dibuka sebagai drawer. Urutan baca dan tindakan utama tetap konsisten.

## Cakupan layar dan interaksi

| ID | Layar utama | Interaksi dan state penting | FR |
| --- | --- | --- | --- |
| S01 | Beranda mahasiswa | Kelas aktif; lanjut review; agenda berikutnya; kosong untuk pengguna baru | 001–003 |
| S02 | Gabung kelas | Kode; alternatif QR; kode salah; menunggu dosen | 003–005 |
| S03 | Brief dan materi | Materi sesi; konsep sebelumnya; sumber belum tersedia | 002, 004 |
| S04 | Kelas langsung | Transkrip; dua label bookmark; capture instan; gangguan transkrip | 007–009 |
| S05 | Detail capture | Ringkasan; sumber 90 detik; edit draf; kirim eksplisit; simpan untuk review | 009–010, 027 |
| S06 | Pertanyaan kelas | Tanya anonim; dukung/batalkan; sudah/belum dijawab; tersedia setelah kelas | 012–014 |
| S07 | Foto pribadi | Pilih foto; pratinjau; timestamp yang dapat diedit; simpan dan hapus | 011, 027 |
| S08 | Hasil sedang disiapkan | Status per tahap; gagal/coba lagi; keluar tanpa menunggu | 005, 015–017 |
| S09 | Catatan sesi | Seluruh topik; sumber timestamp; transkrip terfilter; salinan pribadi | 015–016, 018, 027 |
| S10 | Review saya | Bagian ditandai; materi sebelumnya; sumber tambahan; tanpa penanda | 008, 017–018, 025 |
| S11 | Peta materi | Pilih node; detail subbab; relasi; tautan materi/transkrip | 019 |
| S12 | Agenda | Agenda terkonfirmasi; draf terpisah; buat manual; pengingat; status sinkron | 021–025 |
| S13 | Tinjau agenda | Kutipan sumber; edit; terima/tolak; nilai lama/baru; konflik; tanggal ambigu | 021–023 |
| S14 | Integrasi pribadi | Google Calendar; Notion; Outlook; pilih tujuan; coba lagi; putus koneksi | 024, 030 |
| S15 | Mata kuliah | Daftar sesi dan materi; buka sesi lama tanpa dosen aktif | 001–002 |
| S16 | Koleksi pribadi sesi | Bookmark; capture; foto; hapus terpilih; sumber diarsipkan | 008–011, 027–028 |
| D01 | Beranda dosen | Sesi disiapkan/berlangsung/selesai; buat sesi; pertanyaan tertunda | 001–005 |
| D02 | Persiapan sesi | Mata kuliah; judul; waktu; unggah materi; kode/QR; pemeriksaan mikrofon | 002–006 |
| D03 | Kontrol kelas | Audio aktif; transkrip; pertanyaan; dijawab lisan/tertulis; akhiri sesi | 005–007, 013–014 |
| D04 | Rekap kelas | Agregat per subbab; jumlah mahasiswa; pertanyaan tertunda; kelola sumber | 014, 026, 028 |
| D05 | Koreksi peta | Tambah/hapus/ubah hubungan; tinjau; simpan; koreksi terlindungi | 019–020 |
| D06 | Arsip penghapusan | Sisa masa 30 hari; pulihkan sesi terlebih dahulu; sudah kedaluwarsa | 028–029 |
| D07 | Mata kuliah dan materi | Kelola mata kuliah, sesi dan berkas; unggahan gagal; arsip satu sumber | 002, 028 |

## Overlay dan variasi yang diperlukan

1. Capture berhasil: toast singkat dengan “Lihat capture”, tetap di transkrip. Rangkuman dapat masih diproses.
2. Belum ada transkrip: Capture tidak mengklaim menyimpan konteks; tampilkan alasan dan kembalikan ke kelas.
3. Bookmark tersimpan/dihapus: label terpilih dan umpan balik yang tidak mengambil fokus.
4. Pertanyaan terkirim: hanya teks pertanyaan dibagikan; capture tetap pribadi.
5. Foto gagal atau timestamp di luar sesi: pesan dekat kontrol, nilai lain tetap dipertahankan.
6. Akhiri kelas: konfirmasi berhentinya audio dan dimulainya pemrosesan.
7. Hapus pribadi: nama objek, dampak pada koleksi sendiri, batal/hapus.
8. Arsipkan sumber/sesi: dampak akses peserta; pemulihan 30 hari; dilarang selama sesi aktif.
9. Hapus agenda: pilihan lokal saja atau juga entri terkait yang dibuat ClipThat; hasil per tujuan.
10. Sinkronisasi gagal/perlu masuk ulang: agenda lokal tetap ada; retry pada tujuan yang gagal.
11. Mikrofon tidak tersedia/transkrip terputus: status jujur, langkah pemulihan, tanpa indikator rekaman palsu.
12. Sumber tidak tersedia: capture dan catatan pribadi tetap terbaca; tautan tidak mengarah ke bagian lain.
13. Pengingat: pilihan waktu, aktif/nonaktif, dan tautan bahan persiapan bila tersedia.
14. Materi belum tersedia/kelas pertama: empty state dengan tindakan berikutnya yang relevan.

## Jalur prototipe utama

- Mahasiswa: S01 → S02 → S03 → S04 → toast capture → S05 → S06 → S04.
- Setelah kelas: S08 → S09 → S10 → S11; sumber dapat dibuka kembali.
- Agenda: S12 → S13 → konfirmasi → S12 → S14; perubahan tanggal memiliki tinjauan tersendiri.
- Dosen: D01 → D02 → D03 → konfirmasi akhiri → D04 → D05.
- Data: S16 → konfirmasi hapus pribadi; D04/D07 → konfirmasi arsip → D06 → pemulihan.

Prototype mensimulasikan navigasi dan perubahan keadaan. AI, rekaman, autentikasi, pengunggahan, serta sinkronisasi nyata memerlukan implementasi aplikasi.

## Komponen yang dibutuhkan

Button (primary, secondary, quiet, destructive; default, hover, focus, disabled, loading); navigation item; input/textarea; select; checkbox/toggle; tab; badge; transcript segment; capture card; question card; material row; agenda row; status notice; toast; dialog; empty state; progress step; graph node/edge.

Komponen menggunakan auto-layout, text styles, color/spacing/radius variables, dan instance. Desain akhir harus berupa layer yang dapat diedit. Screenshot seluruh UI tidak menjadi isi layar Figma.

## Batas keputusan

- Login tetap belum diputuskan; alur dimulai setelah masuk, seperti wireframe sebelumnya.
- Sinkronisasi satu arah masih asumsi dari functional request; UI harus menjelaskan batas ini.
- Foto belum dianalisis AI. Latihan personal dan analisis foto tidak ditampilkan sebagai fitur versi pertama.
- Penyimpanan audio setelah transkripsi, retensi aktif, batas berkas, dan mekanisme persetujuan rekaman belum diputuskan.

## Pemeriksaan sebelum desain dinyatakan selesai

- Seluruh FR-001–030 memiliki titik masuk, hasil tindakan, dan kondisi gagal yang relevan.
- Navigasi prototipe tidak buntu; dialog punya batal/tutup; tindakan utama punya tujuan.
- Tidak ada data pribadi mahasiswa pada layar dosen.
- Capture tidak mengirim pertanyaan otomatis; agenda tidak tersinkron sebelum konfirmasi.
- Teks tidak terpotong; kontras bacaan diperiksa; overlay tidak menutupi tindakan penting.
- Screenshot hasil Figma ditinjau pada layar kelas, catatan, agenda, rekap dosen, dan dialog.
- Jumlah layar, komponen, koneksi, pilihan font aktual, dan ID objek dicatat setelah penulisan berhasil.

Pemeriksaan langsung hasil Figma v3 **belum dapat dilakukan** karena batas kuota alat desain. Pengguna telah mencoba plugin versi lama; screenshot dan laporan pengguna menunjukkan perlunya perbaikan layout, akses layar, dan prototype.

## File sumber dan validasi

- `design.js`: sumber layar, isi, warna, ikon, dan target navigasi.
- `figma-runtime.js`: renderer native Figma, fondasi komponen, bindings, dan prototype.
- `plugin/code.js`: hasil bundel kedua file di atas; sudah siap dipakai tanpa instalasi dependensi.
- `plugin/ui.html`: panel pembuat desain dan unduhan laporan hasil/error.
- `preview.html` / `preview.js`: pratinjau browser dari sumber desain yang sama.
- `browser-validation.json`: hasil pemeriksaan browser; tidak setara validasi canvas Figma.
- `plugin-validation.json`: hasil pemeriksaan runtime dengan API double; bukan eksekusi pada Figma.
- `figma-state.json`: status file tujuan dan langkah yang masih perlu dilakukan.

Untuk pengembang, jalankan `node build.cjs` setelah mengubah desain/runtime, lalu `node validate.cjs` dan `node validate-plugin.cjs`. API double menguji startup, ukuran teks, hotspot navigasi, pengungkapan semua layar, pemakaian ulang page, dan pelaporan kegagalan. `plugin-ui-validation.json` mencatat pengujian panel di browser. Jalankan dari folder ini. ZIP harus dikemas ulang setelah bundel berubah.
