# Deepgram: transkripsi langsung

## 1. Buat API key

1. Buka https://console.deepgram.com/ dan buat akun/proyek.
2. Buka **API Keys → Create Key**. Di opsi **Advanced**, pilih izin **Member**.
   Izin ini diperlukan untuk membuat token sementara melalui `/v1/auth/grant`.
3. Simpan key di `.env` atau `.env.local` pada folder `Frontend`:

```env
TRANSCRIPTION_PROVIDER=deepgram
DEEPGRAM_API_KEY=isi_api_key_deepgram_di_sini
```

Jangan gunakan awalan `NEXT_PUBLIC_` untuk key ini. Jika ada `.env.local`, nilainya
mengalahkan `.env`; pastikan provider dan key tidak bertentangan. Gemini tetap
diperlukan untuk capture dan pembuatan catatan, menggunakan `GEMINI_API_KEY` dan
`GEMINI_MODEL` yang sudah ada.

## 2. Aktifkan pembaruan transkrip mahasiswa

Buka Supabase **SQL Editor**. Jalankan isi file
`supabase/migrations/202610160001_realtime_transcripts.sql` dari root repositori.
File ini hanya menambahkan `transcript_segments` dan `sessions` ke publication
Realtime; kebijakan akses kelas yang sudah ada tetap berlaku.

Tanpa langkah ini, hasil final masih terbaca melalui polling 7 detik.

## 3. Jalankan dan uji

Restart server dari folder `Frontend`:

```powershell
npm.cmd run dev
```

1. Login sebagai dosen, mulai sesi baru, lalu buka tab **Transkrip**.
2. Klik **Rekam suara dosen** dan izinkan mikrofon.
3. Status seharusnya **Transkripsi langsung · Deepgram**. Ucapkan materi dalam
   Bahasa Indonesia. Teks sementara muncul pada bagian **Transkrip langsung**.
4. Hasil final dikumpulkan dan disimpan setiap 5 detik, atau saat rekaman berhenti.
   Hanya hasil final yang dipakai untuk bookmark, capture, dan catatan AI.
5. Gunakan akun mahasiswa anggota kelas di browser lain untuk mengecek hasil
   final. Mahasiswa menerima pembaruan setelah penyimpanan, bukan teks sementara dosen.
6. Klik **Hentikan rekaman**, tunggu hasil akhir dan penyimpanan selesai, baru
   akhiri kelas. Pembuatan catatan tetap memerlukan `npm.cmd run jobs:run`.

## Penanganan gangguan

Untuk deploy Cloudflare, set `TRANSCRIPTION_PROVIDER=deepgram` pada konfigurasi
runtime dan pasang key melalui `npx.cmd wrangler secret put DEEPGRAM_API_KEY`.
Jangan menaruh key pada `vars` di file yang masuk Git.

- Tombol tidak aktif: pastikan provider/key sudah terisi lalu restart server.
- Error izin: periksa key proyek dan izin **Member** pada Deepgram.
- Koneksi gagal: periksa kredit Deepgram, jaringan, dan dukungan WebSocket.
- **Coba kirim ulang** mengirim ulang hasil final yang belum tersimpan dengan ID
  yang sama agar tidak membuat duplikat. Antrean ini hanya ada di memori browser.
- Jika jaringan streaming terputus, rekaman berhenti dan pengguna perlu memulai
  lagi. Audio yang belum diterima Deepgram tidak dapat dipulihkan otomatis.
- Chrome/Edge terbaru menjadi target uji pertama. Dukungan format mikrofon pada
  Safari/perangkat lain perlu diuji langsung.

## Arsitektur

Server memeriksa bahwa peminta adalah dosen pemilik kelas aktif, lalu meminta
token sementara Deepgram. Browser membuka WebSocket langsung ke Deepgram dengan
token tersebut dan mengirim audio setiap 250 ms. Token tidak disimpan di localStorage.
API key utama tidak dikirim ke browser. Koneksi audio tidak melewati route Next.js
yang harus tetap terbuka, sehingga tidak membutuhkan server WebSocket Next.js.

Model: `nova-3`, bahasa: `id`, interim results aktif, endpointing 500 ms. Tidak ada
fallback otomatis ke provider berbayar lain. Rekaman dimulai hanya setelah dosen
menekan tombol dan memberi izin mikrofon.

Referensi resmi:

- https://developers.deepgram.com/guides/fundamentals/token-based-authentication
- https://developers.deepgram.com/docs/models-languages-overview/
- https://developers.deepgram.com/docs/understand-endpointing-interim-results/
- https://supabase.com/docs/guides/realtime/postgres-changes
