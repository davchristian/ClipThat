/* Screen content for the desktop web app prototype (students and lecturers). */
globalThis.CLIPTHAT_SCREENS = [
  { id: 's-home', role: 'student', title: 'Beranda', subtitle: 'Kelas dan persiapan belajarmu', fr: ['FR-001', 'FR-002', 'FR-003'], blocks: [
    { type: 'heading', text: 'Sedang berlangsung' },
    { type: 'card', title: 'Aljabar Linear · Pertemuan 5', text: 'Transformasi linear\nDosen: Dr. Nadia · Kelas A', badge: 'Kelas aktif', buttons: [{ label: 'Masuk kelas', target: 's-live' }] },
    { type: 'button', label: 'Gabung dengan kode / QR', target: 's-join' },
    { type: 'heading', text: 'Lanjutkan review' },
    { type: 'card', title: 'Basis dan dimensi', text: 'Pertemuan 4 · 2 bagian ditandai', buttons: [{ label: 'Buka panduan review', target: 's-review' }] },
    { type: 'row', buttons: [{ label: 'Agenda', target: 's-agenda' }, { label: 'Materi kelas', target: 's-notes' }] }
  ], note: 'Mahasiswa dapat membuka hasil dan agenda tanpa dosen aktif.' },
  { id: 's-join', role: 'student', title: 'Gabung kelas', subtitle: 'Masukkan kode yang dibagikan dosen', fr: ['FR-003'], blocks: [
    { type: 'field', label: 'Kode sesi', name: 'session-code', value: 'ALG05', required: true },
    { type: 'button', label: 'Gabung kelas', action: 'join', primary: true },
    { type: 'photo', text: 'Area pemindaian QR', caption: 'Placeholder kamera · pemindaian belum diimplementasikan' },
    { type: 'note', text: 'Contoh kode valid: ALG05. Kode lain menampilkan kondisi gagal.' }
  ], note: 'Form memperlihatkan alur sukses dan kode tidak valid.' },
  { id: 's-brief', role: 'student', title: 'Persiapan kelas', subtitle: 'Aljabar Linear · Pertemuan 5', fr: ['FR-004'], blocks: [
    { type: 'card', title: 'Hari ini: transformasi linear', text: 'Mengenali pemetaan linear, representasi matriks, serta kernel dan image.' },
    { type: 'heading', text: 'Materi dari dosen' },
    { type: 'card', title: 'Transformasi-linear.pdf', text: 'Materi sesi · sumber brief', buttons: [{ label: 'Lihat referensi materi', action: 'material' }] },
    { type: 'heading', text: 'Konsep sebelumnya yang terkait' },
    { type: 'card', title: 'Basis dan dimensi', text: 'Pertemuan 4 · prasyarat representasi matriks', buttons: [{ label: 'Review konsep', target: 's-review' }] },
    { type: 'button', label: 'Buka kelas', target: 's-live', primary: true }
  ], note: 'Brief memakai materi yang tersedia; tidak menunggu materi mendatang.' },
  { id: 's-live', role: 'student', title: 'Kelas berlangsung', subtitle: 'Transformasi linear · 00:18:30', fr: ['FR-007', 'FR-008', 'FR-009'], blocks: [
    { type: 'note', text: 'Transkrip langsung · audio dari perangkat dosen' },
    { type: 'quote', time: '00:17:00', text: 'Suatu pemetaan T disebut linear jika memenuhi sifat penjumlahan dan perkalian skalar.', bookmark: true },
    { type: 'quote', time: '00:17:45', text: 'Untuk menentukan matriks transformasi, kita melihat citra setiap vektor basis.', bookmark: true },
    { type: 'quote', time: '00:18:15', text: 'Koordinat hasil pemetaan ditulis terhadap basis pada ruang tujuan.', bookmark: true },
    { type: 'button', label: 'Capture 90 detik terakhir', target: 's-capture', primary: true },
    { type: 'row', buttons: [{ label: 'Pertanyaan kelas', target: 's-questions' }, { label: 'Tambah foto', target: 's-photo' }] },
    { type: 'button', label: 'Lihat materi', target: 's-brief' }
  ], note: 'Simulasi transkrip. Kedua label menyimpan bagian yang sama untuk review.', scenarios: ['transcript-error', 'short-capture'] },
  { id: 's-capture', role: 'student', title: 'Capture tersimpan', subtitle: '00:17:00–00:18:30 · Pribadi', fr: ['FR-009', 'FR-010'], blocks: [
    { type: 'note', text: 'Konteks sudah disimpan. Kamu boleh kembali mengikuti kelas dan membukanya nanti.' },
    { type: 'card', title: 'Rangkuman pembahasan', text: 'Representasi matriks transformasi ditentukan dari citra vektor basis dan koordinatnya pada ruang tujuan.' },
    { type: 'quote', time: '00:17:00–00:18:30', text: 'Cuplikan transkrip asli tetap tersedia untuk memeriksa rangkuman.' },
    { type: 'field', label: 'Draf pertanyaan · bisa diedit', name: 'question-draft', multiline: true, value: 'Bagaimana cara menentukan koordinat citra vektor jika basis ruang tujuan berbeda dari basis standar?' },
    { type: 'row', buttons: [{ label: 'Kirim anonim', action: 'send-question', primary: true }, { label: 'Simpan untuk review', action: 'save-capture' }] },
    { type: 'button', label: 'Kembali ke transkrip', target: 's-live' },
    { type: 'button', label: 'Hapus capture pribadi', action: 'delete-personal' }
  ], note: 'Draf tidak pernah terkirim otomatis; hanya pertanyaan yang dikirim akan dibagikan.' },
  { id: 's-questions', role: 'student', title: 'Pertanyaan kelas', subtitle: 'Anonim bagi dosen dan mahasiswa', fr: ['FR-012', 'FR-013', 'FR-014'], blocks: [
    { type: 'card', title: 'Bagaimana menentukan koordinat citra pada basis yang berbeda?', text: '00:18:30 · Belum dijawab', badge: '8 dukungan', buttons: [{ label: 'Dukung pertanyaan', action: 'support' }] },
    { type: 'card', title: 'Apakah setiap fungsi matriks merupakan transformasi linear?', text: 'Sudah dijawab\nDosen: Pemetaan x → Ax memenuhi sifat linear; penambahan konstanta perlu diperiksa kembali.' },
    { type: 'field', label: 'Pertanyaanmu', name: 'new-question', multiline: true, placeholder: 'Tuliskan hal yang ingin kamu tanyakan…' },
    { type: 'button', label: 'Kirim pertanyaan anonim', action: 'send-question', primary: true }
  ], note: 'Daftar tetap dapat dibaca dan dijawab setelah kelas berakhir.' },
  { id: 's-photo', role: 'student', title: 'Tambah foto', subtitle: 'Foto papan atau slide · Pribadi', fr: ['FR-011', 'FR-027'], blocks: [
    { type: 'file', label: 'Pilih foto papan / slide', accept: 'image/*' },
    { type: 'photo', text: 'Pratinjau foto', caption: 'Pilih file untuk melihat pratinjau lokal' },
    { type: 'field', label: 'Timestamp sesi', name: 'photo-time', value: '00:18:15' },
    { type: 'note', text: 'Foto disimpan sebagai referensi visual. Isi foto belum dibaca otomatis oleh AI.' },
    { type: 'button', label: 'Simpan foto dan timestamp', action: 'save-photo', primary: true }
  ], note: 'Foto dapat menjadi referensi latihan pada pengembangan berikutnya.' },
  { id: 's-processing', role: 'student', title: 'Kelas selesai', subtitle: 'Hasil sedang disiapkan', fr: ['FR-005', 'FR-015', 'FR-016', 'FR-017'], blocks: [
    { type: 'meter', label: 'Menyaring transkrip', value: 100 },
    { type: 'meter', label: 'Menyusun catatan seluruh kelas', value: 70 },
    { type: 'meter', label: 'Menyusun panduan review personal', value: 30 },
    { type: 'meter', label: 'Menyiapkan graph dan draf agenda', value: 15 },
    { type: 'note', text: 'Bookmark dan capture milikmu tetap tersimpan selama pemrosesan.' },
    { type: 'button', label: 'Kembali ke beranda', target: 's-home' }
  ], note: 'Progress ilustratif. Gunakan kontrol skenario di luar layar untuk simulasi selesai/gagal.', scenarios: ['processing-ready', 'processing-error'] },
  { id: 's-notes', role: 'student', title: 'Catatan kelas', subtitle: 'Pertemuan 5 · Transformasi linear', fr: ['FR-015', 'FR-016', 'FR-018', 'FR-027'], blocks: [
    { type: 'row', buttons: [{ label: 'Catatan', target: 's-notes' }, { label: 'Review personal', target: 's-review' }, { label: 'Graph', target: 's-graph' }] },
    { type: 'card', title: '1. Definisi transformasi linear', text: 'T(u + v) = T(u) + T(v) dan T(cu) = cT(u).\nSumber: slide 3 · transkrip 00:05:00', buttons: [{ label: 'Buka transkrip sumber', action: 'source' }] },
    { type: 'card', title: '2. Representasi matriks', text: 'Kolom matriks dibentuk dari koordinat citra vektor basis.\nSumber: slide 8 · transkrip 00:17:45', buttons: [{ label: 'Review bagian yang ditandai', target: 's-review' }] },
    { type: 'card', title: '3. Kernel dan image', text: 'Kernel memuat vektor yang dipetakan ke nol; image adalah himpunan hasil pemetaan.\nSumber: slide 12 · transkrip 00:32:00' },
    { type: 'button', label: 'Tinjau draf agenda dari kelas', target: 's-agenda' },
    { type: 'button', label: 'Hapus salinan catatan pribadi', action: 'delete-personal' }
  ], note: 'Catatan seluruh kelas tetap dihasilkan meskipun mahasiswa tidak menandai bagian apa pun.' },
  { id: 's-review', role: 'student', title: 'Review personal', subtitle: 'Bagian yang ingin kamu ulang', fr: ['FR-008', 'FR-017', 'FR-018', 'FR-025'], blocks: [
    { type: 'note', text: 'Pribadi · berdasarkan bookmark dan capture milikmu' },
    { type: 'card', title: '1. Koordinat citra vektor basis', text: 'Ditandai “Bingung” · 00:17:45\nUlangi cara menyatakan vektor sebagai kombinasi basis.', buttons: [{ label: 'Buka cuplikan sumber', action: 'source' }, { label: 'Lihat hubungan konsep', target: 's-graph' }] },
    { type: 'card', title: '2. Ulangi basis dan dimensi', text: 'Materi pertemuan 4 terkait representasi matriks pada pertemuan terbaru.', buttons: [{ label: 'Lihat materi sebelumnya', action: 'material' }] },
    { type: 'card', title: 'Referensi tambahan', text: 'Area penjelasan tambahan beserta judul, penulis, dan tautan sumber.\nDitandai sebagai sumber luar, terpisah dari materi dosen.', buttons: [{ label: 'Lihat contoh struktur referensi', action: 'external-source' }] }
  ], note: 'Tidak memerlukan materi pertemuan mendatang. Latihan personal belum masuk versi pertama.' },
  { id: 's-graph', role: 'student', title: 'Peta materi', subtitle: 'Hubungan subbab dalam Aljabar Linear', fr: ['FR-019'], blocks: [
    { type: 'graph' },
    { type: 'card', title: 'Subbab dipilih: Representasi matriks', text: 'Pertemuan 5\nPrasyarat: basis dan dimensi\nBerhubungan dengan: kernel dan image' },
    { type: 'row', buttons: [{ label: 'Materi subbab', action: 'material' }, { label: 'Transkrip 00:17:45', action: 'source' }] }
  ], note: 'Pilih node untuk melihat subbab, hubungan, serta sumbernya.' },
  { id: 's-agenda', role: 'student', title: 'Agenda akademik', subtitle: 'Kewajiban dan bahan persiapan', fr: ['FR-021', 'FR-022', 'FR-024', 'FR-025', 'FR-030'], blocks: [
    { type: 'card', title: 'Draf · Tugas transformasi linear', text: '10 Oktober 2026 · 23.59\nCakupan: representasi matriks\nSumber pengumuman: 00:45:00', badge: 'Perlu konfirmasi', buttons: [{ label: 'Tinjau dan konfirmasi', target: 's-agenda-change' }] },
    { type: 'card', title: 'Kuis basis dan dimensi', text: '8 Oktober 2026 · 09.00\nPengingat: sehari sebelumnya', badge: 'Terkonfirmasi', buttons: [{ label: 'Buka bahan persiapan', target: 's-review' }] },
    { type: 'row', buttons: [{ label: 'Tambah / edit agenda', target: 's-agenda-change' }, { label: 'Integrasi', target: 's-integrations' }] },
    { type: 'button', label: 'Hapus agenda terhubung', action: 'delete-agenda' }
  ], note: 'Tanggal adalah data contoh. Hanya agenda terkonfirmasi yang dikirim ke layanan tujuan.' },
  { id: 's-agenda-change', role: 'student', title: 'Tinjau agenda', subtitle: 'Konfirmasi sebelum disimpan', fr: ['FR-021', 'FR-022', 'FR-023'], blocks: [
    { type: 'quote', time: '00:45:00', text: 'Tugas transformasi linear dikumpulkan tanggal 10 Oktober, paling lambat pukul 23.59.' },
    { type: 'field', label: 'Judul kegiatan', name: 'agenda-title', value: 'Tugas transformasi linear', required: true },
    { type: 'field', label: 'Tanggal', name: 'agenda-date', inputType: 'date', value: '2026-10-10', required: true },
    { type: 'field', label: 'Waktu', name: 'agenda-time', inputType: 'time', value: '23:59', required: true },
    { type: 'field', label: 'Cakupan / keterangan', name: 'agenda-scope', value: 'Representasi matriks transformasi' },
    { type: 'field', label: 'Pengingat', name: 'agenda-reminder', value: 'Sehari sebelumnya' },
    { type: 'row', buttons: [{ label: 'Konfirmasi dan simpan', action: 'confirm-agenda', primary: true }, { label: 'Tolak draf', action: 'reject-agenda' }] }
  ], note: 'Pengumuman perubahan menampilkan nilai lama dan baru sebelum mengganti agenda.', scenarios: ['agenda-conflict', 'agenda-ambiguous', 'agenda-manual'] },
  { id: 's-integrations', role: 'student', title: 'Integrasi agenda', subtitle: 'Pilih tujuan agenda pribadimu', fr: ['FR-024'], blocks: [
    { type: 'card', title: 'Google Calendar', text: 'Tujuan: Kalender Kuliah', badge: 'Terhubung', buttons: [{ label: 'Putus koneksi', action: 'toggle-google' }] },
    { type: 'card', title: 'Notion', text: 'Pilih tujuan entri agenda setelah terhubung.', badge: 'Belum terhubung', buttons: [{ label: 'Hubungkan Notion', action: 'toggle-notion' }] },
    { type: 'card', title: 'Microsoft Outlook', text: 'Pilih kalender tujuan setelah terhubung.', badge: 'Belum terhubung', buttons: [{ label: 'Hubungkan Outlook', action: 'toggle-outlook' }] },
    { type: 'note', text: 'Agenda terkonfirmasi dikirim dari ClipThat. Perubahan langsung di layanan tujuan belum diambil kembali.' }
  ], note: 'Koneksi di sini hanya simulasi. Arah satu arah adalah asumsi sementara dalam FuncReq.', scenarios: ['sync-error'] },
  { id: 'd-home', role: 'lecturer', title: 'Kelas saya', subtitle: 'Kelola sesi dan materi perkuliahan', fr: ['FR-001', 'FR-002', 'FR-003', 'FR-029'], blocks: [
    { type: 'button', label: 'Buat sesi baru', target: 'd-setup', primary: true },
    { type: 'card', title: 'Aljabar Linear · Pertemuan 5', text: 'Transformasi linear · 32 mahasiswa\nSesi siap dimulai', badge: 'Disiapkan', buttons: [{ label: 'Buka persiapan sesi', target: 'd-setup' }] },
    { type: 'card', title: 'Aljabar Linear · Pertemuan 4', text: 'Basis dan dimensi · hasil sesi tersedia', badge: 'Selesai', buttons: [{ label: 'Lihat rekap kelas', target: 'd-results' }] },
    { type: 'button', label: 'Arsip penghapusan', target: 'd-archive' }
  ], note: 'Dosen mengelola sesi miliknya; data pribadi mahasiswa tidak tersedia.' },
  { id: 'd-setup', role: 'lecturer', title: 'Persiapan sesi', subtitle: 'Siapkan materi dan bagikan akses kelas', fr: ['FR-002', 'FR-003', 'FR-005', 'FR-006'], blocks: [
    { type: 'field', label: 'Mata kuliah', name: 'course', value: 'Aljabar Linear', required: true },
    { type: 'field', label: 'Judul sesi', name: 'session-title', value: 'Pertemuan 5 · Transformasi linear', required: true },
    { type: 'file', label: 'Unggah materi sesi' },
    { type: 'card', title: 'Materi tersedia', text: 'Transformasi-linear.pdf · unggahan contoh' },
    { type: 'card', title: 'Kode sesi: ALG05', text: 'Bagikan kode atau QR kepada mahasiswa.', buttons: [{ label: 'Salin kode', action: 'copy-code' }] },
    { type: 'note', text: 'Mikrofon perangkat dosen · izin diperiksa sebelum kelas dimulai' },
    { type: 'button', label: 'Mulai kelas dan perekaman', action: 'start-class', primary: true }
  ], note: 'Tidak ada perekaman atau unggahan sungguhan dalam prototipe.', scenarios: ['microphone-error', 'upload-error'] },
  { id: 'd-live', role: 'lecturer', title: 'Kontrol kelas', subtitle: 'Pertemuan 5 · 32 mahasiswa · 00:18:30', fr: ['FR-005', 'FR-006', 'FR-013', 'FR-014'], blocks: [
    { type: 'note', text: 'Perekaman aktif · mikrofon perangkat dosen' },
    { type: 'quote', time: '00:18:15', text: 'Koordinat hasil pemetaan ditulis terhadap basis pada ruang tujuan.' },
    { type: 'heading', text: 'Pertanyaan untuk dijawab' },
    { type: 'card', title: 'Bagaimana menentukan koordinat citra pada basis berbeda?', text: 'Anonim · Belum dijawab', badge: '8 dukungan', buttons: [{ label: 'Tandai dijawab lisan', action: 'mark-answer' }] },
    { type: 'field', label: 'Jawaban tertulis', name: 'lecturer-answer', multiline: true, placeholder: 'Tambahkan penjelasan untuk peserta kelas…' },
    { type: 'button', label: 'Publikasikan jawaban', action: 'publish-answer' },
    { type: 'button', label: 'Akhiri kelas', action: 'end-class', primary: true }
  ], note: 'Pertanyaan dapat dijawab lagi setelah sesi selesai. Mengakhiri kelas menghentikan audio.' },
  { id: 'd-results', role: 'lecturer', title: 'Rekap kelas', subtitle: 'Pertemuan 5 · Hasil bersama', fr: ['FR-014', 'FR-026', 'FR-028'], blocks: [
    { type: 'heading', text: 'Bagian yang paling perlu diulang' },
    { type: 'meter', label: 'Representasi matriks · 14 dari 32 mahasiswa', value: 44 },
    { type: 'meter', label: 'Kernel dan image · 9 dari 32 mahasiswa', value: 28 },
    { type: 'meter', label: 'Definisi linear · 4 dari 32 mahasiswa', value: 13 },
    { type: 'note', text: 'Rekap agregat. Identitas penanda dan catatan pribadi mahasiswa tidak tersedia.' },
    { type: 'field', label: 'Jawab pertanyaan yang masih terbuka', name: 'lecturer-answer', multiline: true, placeholder: 'Jawaban akan terlihat oleh peserta kelas…' },
    { type: 'row', buttons: [{ label: 'Publikasikan jawaban', action: 'publish-answer' }, { label: 'Periksa graph', target: 'd-graph' }] },
    { type: 'button', label: 'Hapus data sesi', action: 'delete-shared' }
  ], note: 'Jumlah menghitung mahasiswa unik per bagian, bukan banyaknya ketukan.' },
  { id: 'd-graph', role: 'lecturer', title: 'Koreksi graph', subtitle: 'Periksa hubungan subbab hasil AI', fr: ['FR-019', 'FR-020'], blocks: [
    { type: 'graph' },
    { type: 'field', label: 'Subbab asal', name: 'graph-from', value: 'Basis dan dimensi', required: true },
    { type: 'field', label: 'Subbab tujuan', name: 'graph-to', value: 'Representasi matriks', required: true },
    { type: 'field', label: 'Hubungan', name: 'graph-kind', value: 'Prasyarat', required: true },
    { type: 'row', buttons: [{ label: 'Simpan koreksi', action: 'save-graph', primary: true }, { label: 'Hapus hubungan', action: 'remove-edge' }] },
    { type: 'note', text: 'Koreksi berlaku bagi graph kelas dan review berikutnya; tidak ditimpa otomatis.' }
  ], note: 'Hanya dosen pengelola kelas yang mendapat tindakan koreksi.' },
  { id: 'd-archive', role: 'lecturer', title: 'Arsip penghapusan', subtitle: 'Pulihkan data bersama sebelum 30 hari', fr: ['FR-028', 'FR-029'], blocks: [
    { type: 'card', title: 'Pertemuan 3 · Ruang vektor', text: 'Sumber tersembunyi dari peserta\nSisa waktu pemulihan: 24 hari', badge: 'Diarsipkan', buttons: [{ label: 'Pulihkan sesi', action: 'restore-session' }] },
    { type: 'note', text: 'Setelah periode berakhir, objek bersama dihapus permanen. Salinan catatan pribadi mahasiswa tetap menjadi miliknya.' },
    { type: 'button', label: 'Kembali ke kelas saya', target: 'd-home' }
  ], note: 'Arsip penghapusan 30 hari adalah asumsi desain yang ditetapkan atas permintaan pengguna.' }
];
