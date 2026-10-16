# Investigasi Error 1102

Tanggal: 16 Oktober 2026. Pemeriksaan read-only terhadap Cloudflare Analytics, live tail Worker, endpoint publik, dan kode lokal. Tidak mengubah kode aplikasi, langganan, konfigurasi cloud, atau data kelas. File ini hanya menyimpan metadata diagnostik, tanpa token, cookie, atau isi kelas.

## Insiden yang terverifikasi

Rentang query: 15:20:00–16:21:29 UTC (22:20:00–23:21:29 WIB).

| Worker / status | Jumlah request | CPU P50 | CPU P99 |
| --- | ---: | ---: | ---: |
| clipthat / success | 1.014 | 21,624 ms | 629,390 ms |
| clipthat / exceededResources | 7 | 10,000 ms | 16,724 ms |
| clipthat / clientDisconnected | 4 | 6,412 ms | 355,960 ms |
| clipthat-job-scheduler / success | 33 | 0,669 ms | 2,042 ms |

Nilai CPU dari GraphQL dalam mikrodetik dikonversi ke milidetik pada tabel. Analytics bersifat agregat/sampling dan dapat terlambat diperbarui. Status invocation success bukan jaminan seluruh respons HTTP atau pemrosesan bisnis sukses.

Ketujuh exceededResources terkumpul antara 15:53:55 dan 15:54:37 UTC. Ada request gagal tepat pada **15:54:37 UTC**, cocok dengan waktu screenshot Error 1102; CPU request itu **10 ms**. Tidak ada tambahan exceededResources pada snapshot query terbaru. Kecocokan waktu mendukung hubungan dengan screenshot tetapi tidak membuktikan identitas request tanpa korelasi Ray ID.

Pola ini sangat mengarah ke batas CPU Workers Free (10 ms per request). Status exceededResources sendiri dapat mencakup beberapa limit; tidak tersedia detail outcome historis per request untuk memastikan CPU vs memori pada insiden tersebut. Pembacaan API subscriptions ditolak 403 karena izin OAuth, jadi paket billing saat pemeriksaan belum terverifikasi langsung. Pembacaan tidak mengubah langganan.

## Pengamatan live

Tail selama 40 detik menghasilkan 14 event yang dapat dibaca. Hanya metadata path, waktu CPU/wall, outcome, dan exception yang diperiksa; cookie/header/body tidak disimpan ke laporan.

Semua event yang diamati outcome ok, tanpa exception. Contoh penggunaan CPU:

| Path | CPU teramati |
| --- | --- |
| /login | 5, 13, 20, 150, dan 511 ms |
| /register | 24, 69, dan 72 ms |
| / | 54–55 ms |
| /favicon.ico | 78 ms |
| /api/v1/courses tanpa akun | 461 ms; respons HTTP 401 |
| /api/internal/jobs | 8 ms; wall time sekitar 1.534 ms |

Probe terkontrol: login/register 200; sesi tanpa akun 307; API courses tanpa akun 401. Variasi CPU besar juga terjadi pada halaman publik dan API tanpa akun, sehingga beban bukan hanya proses Gemini atau isi transkrip. Belum dilakukan CPU profiling untuk memisahkan inisialisasi modul, framework, proxy, dan kode route.

Request yang berhasil dengan CPU di atas 10 ms tidak membuktikan aman pada Workers Free. Cloudflare mendokumentasikan fleksibilitas/rollover CPU sehingga beberapa request melebihi batas masih dapat berhasil. Paket saat ini juga belum dapat dipastikan lewat API billing.

## Kandidat beban dari kode

1. `src/server/router.ts` mengimpor semua handler secara statis. Endpoint sederhana ikut memuat dependency route sesi, transkripsi, berkas dan schema AI. Ini kandidat beban inisialisasi, belum penyebab yang dibuktikan profiler.
2. `src/state/app-provider.tsx` memanggil reload setiap 7 detik pada semua halaman live yang terlihat. Reload mengambil boot penuh; pada halaman sesi juga mengambil detail sesi dan, untuk dosen, rekap kebingungan.
3. Boot mengambil hingga 500 session_results dengan notes, graph, dan agenda, bersama data course, sesi, simpanan, pertanyaan dan agenda. Detail sesi mengambil ulang transkrip dan hasil sesi. Ini memperbesar kerja serialisasi/parse saat data bertambah; jumlah data besar belum terbukti menjadi pemicu insiden ini.
4. Proxy Node menjalankan pemeriksaan Supabase pada halaman HTML, termasuk login/register. API melakukan pemeriksaan auth terpisah. Pemeriksaan keamanan tetap diperlukan; optimasi harus mempertahankan autentikasi, refresh cookie dan no-store untuk data pribadi.
5. OpenNext belum memakai incremental cache persisten. Perlu menilai cache khusus konten publik yang memang aman; jangan meng-cache respons pribadi untuk menghemat CPU.

## Kesimpulan dan tindak lanjut

- Insiden resource limit benar terjadi pada aplikasi, dengan waktu yang cocok dengan screenshot. Dugaan terkuat adalah limit CPU 10 ms; tidak ada bukti untuk menyalahkan DNS atau Gmail.
- Scheduler tidak mencatat resource error dalam rentang ini. Success scheduler tidak membuktikan semua pekerjaan AI berhasil karena status bisnis harus dicek terpisah.
- Tidak ditemukan exception JavaScript pada pengamatan live; error lama belum tereproduksi selama probe.
- Langkah optimasi yang layak: profil CPU inisialisasi/route; pisahkan pemuatan route yang berat; ubah polling menjadi sesuai kebutuhan halaman; kurangi payload boot. Setelah perubahan, uji auth, refresh cookie, upload, job dan UI, lalu ukur ulang CPU di runtime Worker.
- Batas paket tidak dapat dinaikkan melewati batas Free hanya dengan menambah cpu_ms di konfigurasi. Bila CPU setelah optimasi tetap melebihi batas, evaluasi Workers Paid atau host lain setelah persetujuan pengguna; tidak ada perubahan billing otomatis.
- Rangkuman kosong pada sesi sebelumnya merupakan masalah terpisah; belum ada bukti yang menghubungkannya dengan Error 1102.

Referensi: [limits](https://developers.cloudflare.com/workers/platform/limits/), [status invocation dan rollover CPU](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/), [query Workers Analytics](https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/).
