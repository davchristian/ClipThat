# ClipThat — Functional Request

Dokumen ini mendefinisikan kebutuhan fungsional ClipThat sebagai asisten personal mahasiswa untuk menangkap konteks perkuliahan, menyusun catatan dan review personal, serta mengelola agenda akademik.

Dasar penyusunan: konsep JOINTS.pdf dan keputusan pengguna dalam diskusi. Dokumen ini merupakan spesifikasi perilaku yang harus dibangun, bukan laporan fitur yang sudah tersedia.

## 1. Ruang lingkup

Versi pertama mencakup:

- Akses mandiri mahasiswa, materi mata kuliah, dan sesi kelas yang dimulai dosen.
- Kode/QR untuk bergabung dan brief sebelum kelas.
- Audio dari perangkat dosen dan transkrip langsung bertimestamp.
- Bookmark, one-tap capture 90 detik, rangkuman capture, dan draf pertanyaan.
- Pertanyaan anonim, dukungan pertanyaan, dan jawaban selama maupun setelah kelas.
- Penyimpanan foto papan/slide bertimestamp.
- Penyaringan transkrip setelah kelas, catatan seluruh kelas, dan panduan review personal otomatis.
- Graph subbab otomatis yang dapat dikoreksi dosen.
- Draf agenda, pengingat, dan integrasi Google Calendar, Notion, serta Microsoft Outlook.
- Rekap kebingungan kelas serta pengelolaan data bersama dan pribadi.

Latihan personal dan analisis isi foto oleh AI merupakan pengembangan berikutnya. Pada versi pertama, foto berfungsi sebagai referensi visual tersimpan dan belum dibaca otomatis untuk mengenali tulisan, rumus, atau diagram.

## 2. Aktor dan hak akses

| Aktor | Hak akses |
| --- | --- |
| Mahasiswa | Mengakses aplikasi secara mandiri; bergabung ke kelas; membaca materi/transkrip kelas yang diikuti; mengelola bookmark, capture, foto, catatan, dan agenda pribadi; mengirim serta mendukung pertanyaan anonim; menghubungkan tujuan integrasi pribadi. |
| Dosen pembuat sesi | Membuat, memulai, dan mengakhiri sesi; mengunggah materi; mengambil audio dari perangkatnya; menjawab pertanyaan; mengoreksi graph; melihat rekap kebingungan; mengelola data bersama pada sesi miliknya. |
| Sistem | Menghasilkan transkrip, rangkuman, draf pertanyaan, catatan, panduan review, graph, dan draf agenda; menjalankan pengingat serta sinkronisasi yang diizinkan mahasiswa. |

Istilah **semua pihak** dalam pertanyaan berarti dosen dan mahasiswa yang memiliki akses ke kelas tersebut, bukan seluruh pengguna aplikasi. Identitas pengirim pertanyaan disembunyikan dari dosen maupun mahasiswa lain.

Dosen tidak dapat membaca catatan personal, capture pribadi, foto pribadi, atau daftar bookmark per mahasiswa. Hak akses berlaku pada setiap operasi pembacaan dan perubahan data, bukan hanya melalui penyembunyian tampilan.

## 3. Keputusan dan asumsi

### 3.1 Keputusan yang sudah dikonfirmasi

- Mahasiswa dapat mengakses aplikasi mandiri, tetapi kelas dimulai dengan keterlibatan dosen.
- Audio berasal dari perangkat dosen; transkrip tersedia langsung selama kelas.
- Setelah kelas, transkrip disaring untuk mempertahankan materi pembelajaran dan pengumuman akademik.
- Capture mengambil transkrip 90 detik terakhir, menghasilkan rangkuman, dan menawarkan draf pertanyaan.
- “Bingung” dan “Review nanti” berfungsi sebagai bookmark dan sinyal kebutuhan review yang sama.
- Catatan seluruh kelas dan panduan review personal dibuat otomatis setelah kelas.
- Rekomendasi review mengulang materi sebelumnya yang berkaitan dengan pertemuan terbaru, tanpa menunggu materi pertemuan berikutnya.
- AI boleh menggunakan sumber luar dengan referensi yang dicantumkan.
- Pertanyaan anonim tetap dapat dibaca dan dijawab setelah kelas berakhir.
- Foto hanya disimpan bertimestamp pada versi pertama. Latihan personal merupakan pengembangan berikutnya dan dapat menggunakan foto sebagai referensi.
- Graph berisi node subbab. Detail node menampilkan hubungan, materi, serta transkrip terkait. Dosen dapat mengoreksi hubungan.
- Tujuan integrasi: Google Calendar, Notion, dan Microsoft Outlook.
- Perubahan agenda dari pengumuman membutuhkan konfirmasi mahasiswa; mahasiswa juga dapat mengedit agenda manual.
- Dosen hanya melihat rekap kebingungan kelas, bukan catatan personal mahasiswa.

### 3.2 Asumsi penghapusan yang dirumuskan atas permintaan pengguna

- Dosen pembuat sesi mengelola data bersama; mahasiswa mengelola data pribadi miliknya.
- Data bersama yang dihapus masuk arsip penghapusan selama 30 hari. Pemilik dapat memulihkannya sebelum periode berakhir; setelah itu sistem menghapusnya permanen.
- Penghapusan data bersama membutuhkan konfirmasi yang menjelaskan objek dan dampak tindakan. Penghapusan tidak boleh dilakukan saat sesi masih berlangsung.
- Sumber bersama yang diarsipkan disembunyikan dari peserta. Catatan dan kutipan capture pribadi yang sudah tersimpan tetap milik mahasiswa, dengan tautan sumber ditandai tidak tersedia.
- Menghapus data pribadi tidak menghapus sumber kelas atau data peserta lain.
- Penghapusan agenda menawarkan pilihan untuk ikut menghapus entri buatan ClipThat di tujuan integrasi; entri lainnya tidak disentuh.

### 3.3 Asumsi sementara dan aturan operasional usulan

- **Arah sinkronisasi belum dikonfirmasi.** Asumsi sementara: satu arah dari ClipThat ke tujuan integrasi. Perubahan langsung di layanan tujuan belum ditarik kembali ke ClipThat.
- Notion menjadi tujuan entri agenda, tanpa mengasumsikan perilakunya sama dengan Google Calendar atau Outlook.
- Mahasiswa dan dosen memiliki identitas akun untuk kepemilikan data serta hak akses; metode login belum ditentukan.
- “Semua pihak” dibatasi pada peserta dan dosen kelas. Capture dan foto tetap pribadi sampai ada tindakan berbagi yang terpisah.
- Satu mahasiswa dapat memberi satu dukungan per pertanyaan dan membatalkannya.
- Timestamp menggunakan waktu sesi yang sama untuk transkrip, capture, dan foto.
- Aturan kegagalan pemrosesan, konflik pembaruan agenda, dan pemeliharaan tautan setelah penyaringan transkrip di bawah merupakan usulan perilaku agar alur dapat diuji.

Asumsi sementara perlu ditinjau sebelum implementasi. Sinkronisasi dua arah belum menjadi kebutuhan versi pertama yang disepakati.

## 4. Alur utama

1. Dosen menyiapkan mata kuliah, mengunggah materi, dan membuat sesi. Mahasiswa bergabung melalui kode/QR dan membaca brief.
2. Dosen memulai sesi serta pengambilan audio. Mahasiswa melihat transkrip, menandai bagian penting, melakukan capture, menambahkan foto, atau mengirim pertanyaan.
3. Dosen melihat pertanyaan dan dukungan, menjawab, serta menandai pertanyaan yang selesai dijawab.
4. Dosen mengakhiri sesi. Sistem menyaring transkrip dan menghasilkan catatan seluruh kelas, panduan review personal, graph, serta draf agenda.
5. Mahasiswa membuka hasil secara mandiri, mereview materi sebelumnya yang relevan, dan mengonfirmasi agenda sebelum disimpan atau dikirim ke tujuan integrasi.
6. Mahasiswa kembali melalui pengingat untuk membuka bahan persiapan atau melihat jawaban pertanyaan setelah kelas.

## 5. Kebutuhan fungsional

### A. Akses, materi, dan sesi

#### FR-001 — Akses mandiri dan pemisahan peran

**Kebutuhan:** Mahasiswa dapat mengakses materi yang tersedia, hasil sesi terdahulu, data pribadi, dan agenda tanpa menunggu dosen aktif. Dosen diperlukan untuk memulai sesi kelas baru.

**Kriteria penerimaan:** Mahasiswa dapat membuka hasil sesi setelah kelas selesai. Mahasiswa tidak dapat memulai perekaman kelas sebagai dosen atau mengakses data pribadi peserta lain.

#### FR-002 — Pengelolaan mata kuliah dan materi

**Kebutuhan:** Dosen mengelompokkan sesi dalam mata kuliah dan mengunggah materi ke sesi terkait. Materi sebelumnya dalam mata kuliah yang sama dapat menjadi referensi brief, graph, serta review.

**Kriteria penerimaan:** Materi dapat ditelusuri ke mata kuliah dan sesi asal. Peserta yang berhak dapat membukanya. Kegagalan unggahan ditampilkan dan materi yang gagal tidak dianggap tersedia.

#### FR-003 — Pembuatan sesi dan bergabung melalui kode/QR

**Kebutuhan:** Dosen membuat sesi dengan judul, mata kuliah, waktu, dan materi terkait. Sistem menyediakan kode/QR untuk mahasiswa bergabung.

**Kriteria penerimaan:** Kode/QR valid membuka sesi yang benar; kode tidak valid menampilkan kegagalan. Mahasiswa yang telah bergabung tetap dapat mengakses hasil sesi setelah kelas selesai.

#### FR-004 — Brief sebelum kelas

**Kebutuhan:** Sistem menampilkan brief topik dari materi yang tersedia dan referensi materi sebelumnya yang berkaitan.

**Kriteria penerimaan:** Brief memiliki tautan ke materi sumber. Jika sumber atau riwayat terkait belum tersedia, sistem menjelaskan keterbatasannya tanpa membuat rujukan ke materi kelas yang tidak ada.

#### FR-005 — Siklus hidup sesi

**Kebutuhan:** Sesi memiliki status “Disiapkan”, “Berlangsung”, “Diproses”, dan “Selesai”. Dosen pembuat sesi dapat memulai dan mengakhiri sesi. Kegagalan pemrosesan ditampilkan sebagai kondisi pada tahap “Diproses”.

**Kriteria penerimaan:** Memulai sesi mengaktifkan alur pengambilan audio. Mengakhiri sesi menghentikan audio dan memulai pemrosesan. Hasil yang belum selesai tidak ditampilkan sebagai hasil final. Pertanyaan tetap tersedia setelah status “Selesai”.

### B. Dokumentasi dan penandaan saat kelas

#### FR-006 — Audio dari perangkat dosen

**Kebutuhan:** Sistem mengambil audio mikrofon perangkat dosen untuk transkripsi kelas dan menampilkan indikator perekaman.

**Kriteria penerimaan:** Audio mulai ditangkap setelah akses mikrofon tersedia dan dosen memulai sesi. Jika mikrofon tidak tersedia, sistem menampilkan masalah tanpa mengklaim sedang merekam. Pengambilan audio berhenti ketika sesi diakhiri.

#### FR-007 — Transkrip langsung bertimestamp

**Kebutuhan:** Sistem menampilkan transkrip selama kelas dengan timestamp per bagian agar mahasiswa dapat menandai pembahasan.

**Kriteria penerimaan:** Bagian baru muncul tanpa menunggu akhir kelas. Setiap bagian dapat dirujuk melalui timestamp sesi. Gangguan penerimaan audio atau pembaruan transkrip ditampilkan; bagian yang hilang tidak direka sebagai transkrip asli.

#### FR-008 — Bookmark “Bingung” dan “Review nanti”

**Kebutuhan:** Mahasiswa memberi atau menghapus label pada bagian transkrip. Kedua label menyimpan bagian tersebut dan memberi sinyal kebutuhan review yang setara.

**Kriteria penerimaan:** Penanda menyimpan referensi bagian dan timestamp, serta dapat ditemukan kembali oleh pemiliknya. Menghapus penanda menghapus sinyal terkait tanpa menghapus transkrip. Dosen tidak dapat melihat daftar penanda individu.

#### FR-009 — One-tap capture 90 detik

**Kebutuhan:** Satu ketukan menyimpan salinan transkrip 90 detik sebelum ketukan, membuat rangkuman rentang tersebut, dan merekomendasikan pertanyaan untuk dosen.

**Kriteria penerimaan:** Capture menyimpan awal/akhir rentang dan teks yang tersedia. Jika sesi berusia kurang dari 90 detik, capture mengambil bagian yang tersedia sejak awal sesi. Jika tidak ada transkrip, sistem menjelaskan bahwa capture belum dapat dibuat. Penyimpanan tidak mengharuskan pengguna membaca atau memilih draf saat itu juga.

#### FR-010 — Draf pertanyaan dari capture

**Kebutuhan:** Sistem membuat draf klarifikasi atau pertanyaan lanjutan dari capture dan materi relevan. Mahasiswa dapat membukanya saat jeda atau setelah kelas, mengedit, mengirim, atau menyimpannya untuk review.

**Kriteria penerimaan:** Draf terhubung ke capture asal dan tidak dikirim otomatis. Pengiriman memerlukan tindakan mahasiswa dan memakai alur pertanyaan anonim.

#### FR-011 — Foto pribadi bertimestamp

**Kebutuhan:** Mahasiswa menambahkan foto papan/slide dan mengaitkannya ke timestamp sesi. Foto merupakan referensi visual pribadi pada versi pertama.

**Kriteria penerimaan:** Foto dapat dibuka bersama bagian transkrip terkait dan ditemukan dari sesi asal. Mahasiswa dapat mengoreksi timestamp keterkaitannya. Sistem tidak mengklaim telah membaca isi foto atau memasukkannya otomatis ke rangkuman. Foto tidak dibagikan ke peserta lain secara otomatis.

### C. Pertanyaan dan jawaban

#### FR-012 — Pertanyaan anonim dalam kelas

**Kebutuhan:** Mahasiswa mengirim pertanyaan langsung atau dari draf capture. Pertanyaan terlihat oleh dosen dan peserta kelas tanpa identitas pengirim.

**Kriteria penerimaan:** Pertanyaan tampil dengan waktu dan status jawaban. Nama serta identitas akun pengirim tidak disertakan dalam data pertanyaan yang dapat diakses dosen atau peserta lain. Isi capture dan bookmark pribadi tidak ikut dibagikan otomatis.

#### FR-013 — Dukungan pertanyaan

**Kebutuhan:** Mahasiswa mendukung pertanyaan yang juga ingin ditanyakannya. Dosen dan peserta melihat jumlah dukungan.

**Kriteria penerimaan:** Satu mahasiswa memberi maksimal satu dukungan per pertanyaan dan dapat membatalkannya. Jumlah berubah sesuai tindakan tersebut tanpa menampilkan identitas pemberi dukungan.

#### FR-014 — Jawaban selama dan setelah kelas

**Kebutuhan:** Dosen menandai pertanyaan yang sudah dijawab secara lisan dan dapat menambahkan jawaban tertulis. Pertanyaan yang belum dijawab tetap tersedia setelah sesi berakhir.

**Kriteria penerimaan:** Status “Belum dijawab” berubah menjadi “Sudah dijawab” melalui tindakan dosen. Status dan jawaban tertulis terlihat bagi peserta kelas. Dosen tetap dapat menjawab setelah kelas; akses tidak ditutup ketika perekaman selesai.

### D. Catatan, review, dan graph

#### FR-015 — Penyaringan transkrip setelah kelas

**Kebutuhan:** Sistem menyaring pembahasan di luar materi pembelajaran atau agenda akademik sebelum menyusun hasil final.

**Kriteria penerimaan:** Materi dan pengumuman akademik dipertahankan sebagai sumber. Timestamp tetap dapat ditelusuri. Penanda dan foto yang merujuk bagian tersaring tidak dipindah diam-diam ke bagian lain; salinan capture tetap dapat dibaca dan sumber yang tersaring diberi keterangan.

#### FR-016 — Catatan seluruh kelas otomatis

**Kebutuhan:** Sistem menghasilkan catatan seluruh sesi secara otomatis setelah pemrosesan, bukan hanya bagian yang ditandai.

**Kriteria penerimaan:** Catatan merangkum materi per topik/subbab dengan rujukan ke materi atau timestamp transkrip yang tersedia. Mahasiswa tanpa bookmark tetap menerima catatan. Status pemrosesan ditampilkan dan hasil yang gagal dapat dicoba ulang ketika sumber masih tersedia.

#### FR-017 — Panduan review personal otomatis

**Kebutuhan:** Sistem menghasilkan panduan per mahasiswa dari bookmark dan capture miliknya, serta hubungan dengan materi sebelumnya dalam mata kuliah yang sama.

**Kriteria penerimaan:** Panduan menyebut bagian yang ditandai dan menautkan penjelasan atau materi terkait. Rekomendasi mengulang materi sebelumnya yang relevan dengan sesi terbaru tanpa menunggu unggahan pertemuan mendatang. Jika tidak ada penanda atau riwayat materi, sistem menjelaskan dasar rekomendasi yang tersedia tanpa mengklaim mengetahui kebingungan personal mahasiswa.

#### FR-018 — Sumber tambahan dan referensi

**Kebutuhan:** AI boleh memakai sumber luar untuk memperkaya penjelasan dengan referensi. Tambahan tersebut dibedakan dari pernyataan dosen atau materi kelas.

**Kriteria penerimaan:** Penjelasan tambahan mencantumkan referensi yang dapat dibuka. Sumber luar tidak ditampilkan sebagai ucapan dosen. Jika referensi pendukung tidak tersedia, tambahan tidak disajikan sebagai penjelasan bersumber.

#### FR-019 — Graph subbab otomatis

**Kebutuhan:** Sistem membuat graph dengan node berupa subbab dan hubungan antar-subbab dalam mata kuliah yang sama, termasuk materi sebelumnya bila tersedia.

**Kriteria penerimaan:** Memilih node membuka detail subbab, hubungan dengan subbab lain, serta tautan materi dan transkrip terkait. Graph tidak merujuk materi yang belum tersedia seolah-olah sudah diunggah.

#### FR-020 — Koreksi graph oleh dosen

**Kebutuhan:** Dosen menambah, menghapus, atau mengoreksi hubungan subbab pada graph kelas yang dikelolanya.

**Kriteria penerimaan:** Koreksi tersimpan dan terlihat oleh peserta. Hubungan yang sudah dikoreksi tidak ditimpa otomatis tanpa peninjauan dosen. Koreksi menjadi rujukan bagi panduan review yang dibuat atau diperbarui sesudahnya.

### E. Agenda dan integrasi

#### FR-021 — Ekstraksi draf agenda

**Kebutuhan:** Sistem mengenali pengumuman akademik dan membuat draf berisi tanggal/waktu jika disebutkan, jenis kegiatan, keterangan, mata kuliah, dan cakupan materi jika tersedia.

**Kriteria penerimaan:** Draf menyertakan kutipan serta timestamp sumber. Informasi penting yang ambigu diminta dilengkapi, bukan ditebak sebagai kepastian. Pengumuman tentatif diberi label. Draf tidak otomatis menjadi agenda terkonfirmasi.

#### FR-022 — Konfirmasi dan perubahan agenda pribadi

**Kebutuhan:** Mahasiswa meninjau, mengedit, menerima, atau menolak draf. Mahasiswa juga dapat membuat serta mengubah agenda manual.

**Kriteria penerimaan:** Agenda dari pengumuman baru disimpan sebagai agenda pribadi setelah konfirmasi. Draf ditolak tidak dikirim ke tujuan integrasi. Perubahan manual disimpan melalui tindakan mahasiswa dan tidak mengubah agenda peserta lain.

#### FR-023 — Pembaruan agenda dari pengumuman

**Kebutuhan:** Pengumuman yang mengubah kegiatan tercatat menghasilkan usulan pembaruan agenda terkait, dengan konfirmasi mahasiswa.

**Kriteria penerimaan:** Mahasiswa melihat nilai lama, usulan, dan sumber. Sebelum diterima, agenda lama tetap berlaku. Setelah diterima, agenda yang sama diperbarui tanpa duplikat. Jika nilai sudah diedit mahasiswa, perbedaan ditampilkan untuk dipilih tanpa menimpa otomatis. Jika kegiatan asal ambigu, mahasiswa dapat memilih agenda yang dimaksud.

#### FR-024 — Google Calendar, Notion, dan Microsoft Outlook

**Kebutuhan:** Mahasiswa menghubungkan akun serta memilih tujuan integrasi pribadi pada ketiga layanan. Agenda terkonfirmasi dapat dikirim dan diperbarui ke tujuan yang dipilih.

**Kriteria penerimaan:** Agenda baru membuat entri terkait; perubahan memperbarui entri yang sama. Status berhasil, gagal, atau perlu menghubungkan ulang terlihat per tujuan. Percobaan ulang tidak membuat duplikat. Agenda lokal tetap tersimpan jika layanan tujuan gagal. Memutus koneksi menghentikan pengiriman berikutnya.

**Batas sementara:** Sinkronisasi satu arah dari ClipThat. Perubahan langsung di layanan tujuan belum diambil kembali. Pengguna telah mengonfirmasi layanan tujuan, tetapi belum arah sinkronisasi.

#### FR-025 — Pengingat dengan bahan persiapan

**Kebutuhan:** Mahasiswa mengatur waktu pengingat serta mengaktifkan/menonaktifkannya. Pengingat membuka detail kegiatan dan bahan persiapan atau panduan review yang relevan.

**Kriteria penerimaan:** Pengingat mengikuti tanggal agenda terkonfirmasi terbaru dan tidak dibuat dari draf yang belum diterima. Jika tidak ada materi terkait, detail agenda tetap dapat dibuka tanpa tautan palsu. Menonaktifkan pengingat menghentikan pengingat aplikasi; pengingat di layanan tujuan mengikuti pengaturan layanan tersebut.

### F. Rekap dan pengelolaan data

#### FR-026 — Rekap kebingungan kelas

**Kebutuhan:** Dosen melihat agregat bagian/subbab yang ditandai “Bingung” atau “Review nanti”, sebagai sinyal review yang setara.

**Kriteria penerimaan:** Rekap menunjukkan bagian paling banyak membutuhkan review dan jumlah mahasiswa yang menandainya, dengan setiap mahasiswa dihitung sekali per bagian. Dosen tidak dapat membuka identitas penanda atau data pribadi melalui rekap.

#### FR-027 — Penghapusan data pribadi

**Kebutuhan:** Mahasiswa menghapus bookmark, capture, foto, catatan, atau agenda miliknya. Penghapusan data tersimpan memerlukan konfirmasi objek yang dipilih.

**Kriteria penerimaan:** Hanya data pribadi yang dipilih terhapus; sumber kelas dan data peserta lain tidak terpengaruh. Menghapus bookmark saja tidak menghapus capture atau catatan yang sudah tersimpan. Pengguna tanpa kepemilikan tidak dapat menghapus data tersebut.

#### FR-028 — Arsip penghapusan data bersama

**Kebutuhan:** Dosen pembuat sesi menghapus materi, transkrip, rekaman jika disimpan, atau seluruh sesi miliknya melalui arsip penghapusan selama 30 hari.

**Kriteria penerimaan:** Konfirmasi menjelaskan objek dan dampak hilangnya akses sumber. Penghapusan ditolak saat sesi berlangsung. Setelah dikonfirmasi, sumber disembunyikan. Menghapus seluruh sesi turut mengarsipkan pertanyaan dan graph bersama. Catatan serta kutipan capture pribadi yang sudah tersimpan tetap milik mahasiswa dengan status sumber tidak tersedia. Menghapus satu sumber tidak otomatis menghapus seluruh sesi.

#### FR-029 — Pemulihan dan penghapusan permanen

**Kebutuhan:** Dosen pemilik memulihkan data bersama sebelum 30 hari berakhir. Setelah periode berakhir, sistem menghapus objek bersama yang diarsipkan secara permanen.

**Kriteria penerimaan:** Pemulihan mengembalikan data dan akses peserta yang sebelumnya berhak. Jika seluruh sesi diarsipkan, sesi dipulihkan terlebih dahulu. Objek yang sudah dihapus permanen tidak dapat dipulihkan melalui aplikasi. Penghapusan ini tidak otomatis menghapus salinan data pribadi mahasiswa.

#### FR-030 — Penghapusan agenda terintegrasi

**Kebutuhan:** Saat mahasiswa menghapus agenda terhubung, sistem menawarkan apakah entri buatan ClipThat di tujuan integrasi ikut dihapus.

**Kriteria penerimaan:** Jika memilih menghapus keduanya, hanya entri tujuan yang terkait agenda tersebut dihapus. Jika memilih menghapus lokal saja, entri tujuan dibiarkan dan tidak disinkronkan lagi. Kegagalan penghapusan eksternal ditampilkan untuk percobaan ulang; keberhasilan lokal tidak disamakan dengan keberhasilan eksternal.

## 6. Pengembangan berikutnya

| Fitur | Perilaku yang direncanakan |
| --- | --- |
| Latihan personal | Menghasilkan latihan dari materi kelas, kebutuhan review, serta foto papan/slide yang relevan, dengan petunjuk dan pembahasan bertahap. |
| Analisis foto | Membaca tulisan, rumus, atau diagram untuk memperkaya catatan dan referensi latihan. Penyimpanan foto bertimestamp sudah masuk versi pertama; analisis belum. |
| Prioritas belajar | Menyusun urutan belajar berdasarkan agenda dan kebutuhan review. |

Sinkronisasi dua arah dapat ditinjau setelah arah integrasi dikonfirmasi; belum merupakan rencana yang disepakati.

## 7. Skenario penerimaan utama

| Skenario | Hasil yang harus dapat diperiksa |
| --- | --- |
| Mahasiswa membuka aplikasi setelah kelas tanpa dosen aktif | Hasil sesi dan data pribadinya yang tersedia dapat dibuka. |
| Dosen memulai kelas dan mahasiswa menandai transkrip | Transkrip muncul selama kelas; penanda terhubung ke bagian dan timestamp yang benar. |
| Capture ditekan pada detik ke-150 | Rentang transkrip yang diambil adalah detik ke-60 sampai ke-150; rangkuman dan draf tersedia tanpa pengiriman otomatis. |
| Capture ditekan pada detik ke-40 | Bagian tersedia dari awal sesi sampai detik ke-40 tersimpan tanpa konteks rekaan. |
| Dosen mengakhiri kelas | Sesi masuk pemrosesan dan hasil otomatis tersedia setelah pemrosesan berhasil. |
| Mahasiswa tidak membuat bookmark | Catatan seluruh kelas tetap dibuat tanpa klaim kebingungan personal yang tidak diberikan pengguna. |
| Materi pertemuan berikutnya belum diunggah | Review tetap berjalan memakai materi sebelumnya yang relevan. |
| Pertanyaan belum dijawab saat kelas selesai | Dosen tetap dapat menjawab dan peserta tetap dapat membacanya. |
| Pengumuman mengubah deadline | Usulan memiliki sumber; agenda dan entri tujuan berubah setelah konfirmasi mahasiswa. |
| Satu tujuan integrasi gagal | Agenda lokal tetap tersedia; kegagalan terlihat dan percobaan ulang tidak menggandakan entri. |
| Dosen membuka rekap | Hanya agregat terlihat, tanpa akses catatan atau penanda individu. |
| Dosen menghapus sumber kelas | Konfirmasi dan arsip berlaku; sumber disembunyikan, salinan personal tetap tersedia dengan status sumber tidak tersedia. |
| Mahasiswa menghapus foto pribadi | Foto miliknya terhapus tanpa mengubah transkrip atau data peserta lain. |

## 8. Hal yang belum ditetapkan

- Persetujuan atas asumsi sementara arah sinkronisasi ke tiga layanan.
- Metode login, platform aplikasi, format unggahan, dan batas ukuran file.
- Target jeda transkrip langsung, waktu pemrosesan, dan jumlah peserta per sesi.
- Apakah audio disimpan setelah transkripsi, serta masa retensi data aktif. Arsip penghapusan 30 hari berbeda dari masa penyimpanan data aktif.
- Mekanisme izin perekaman dan penanganan pencabutan izin.

Hal-hal tersebut belum ditetapkan sebagai keputusan pengguna. Kebutuhan yang sudah dikonfirmasi tetap menjadi dasar dokumen ini.
