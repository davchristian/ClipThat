# Optimasi Cloudflare tanpa memperlambat transkrip

Tanggal: 16 Oktober 2026. Tindak lanjut [investigasi Error 1102](CLOUDFLARE-RESOURCE-INVESTIGATION.md). Perubahan hanya lokal, belum di-deploy; tidak mengubah langganan atau database produksi.

## Perubahan

- Router API memuat handler sesuai endpoint, setelah pemeriksaan auth yang sama. Modul sesi tidak lagi memuat implementasi AI, audio, dan capture saat hanya membaca/menyimpan transkrip. Pemeriksaan konfigurasi provider dipisahkan dari implementasi audio.
- Notifikasi realtime dan callback upload microphone memakai refresh khusus sesi. Tidak lagi menunggu bootstrap seluruh akun sebelum membaca transkrip. Data detail sesi dan rekap kebingungan dosen diminta paralel.
- Polling cadangan sesi tetap **7 detik**. Saat halaman sesi terlihat, refresh akun penuh berjalan setiap **30 detik**; halaman lain tetap memakai refresh 7 detik. Aksi pengguna tetap memuat ulang akun setelah penyimpanan agar simpanan dan agenda segera terbarui.
- Refresh yang berbarengan digabung. Bila ada perubahan saat request berjalan, dilakukan pembacaan susulan sebelum promise refresh selesai. Respons dari halaman lama atau sebelum revisi akun tidak boleh langsung menimpa state baru.
- Metadata status/judul/durasi kelas ikut diperbarui dari detail sesi sehingga processing/done tidak menunggu refresh akun 30 detik.
- Realtime tetap memakai jendela **300 ms**, tetapi sekarang throttle, sehingga aliran INSERT terus-menerus tidak mengundurkan refresh sampai pengguna berhenti berbicara. Tab yang kembali terlihat langsung meminta pembaruan.
- Streaming WebSocket Deepgram, tampilan interim, interval pengiriman audio, token autentikasi, RLS, idempotensi chunk, dan menunggu final upload sebelum mengakhiri kelas dipertahankan.

Refresh khusus sesi masih membaca detail sesi lengkap. Optimasi delta transkrip, profil CPU tingkat fungsi, serta cache data publik belum dilakukan. Respons pribadi tetap no-store; tidak ada cache lintas akun.

## Verifikasi

- **55/55 tes backend lulus** setelah pemisahan konfigurasi transkripsi; termasuk auth/RLS, idempotensi transkrip, Deepgram, Gemini, dan job database dengan provider/DB fixture.
- Suite live penuh: 14 tes yang sudah ada lulus, dua tes baru awalnya gagal karena asumsi locator/initial mount dan teks UI yang salah. Locator dan baseline tes disesuaikan dengan UI dan mount ganda React dev. Uji akhir terarah: **3/3 lulus** (dua tes baru dan uji ulang Deepgram). Total **16 kasus live unik memiliki hasil lulus**, bukan klaim satu run penuh terakhir 16/16.
- Tes baru membuktikan segmen transkrip dan status processing muncul lewat polling tanpa request bootstrap tambahan. Burst refresh menghasilkan pembacaan susulan, maksimum satu request detail aktif setelah initial load.
- Tes Deepgram membuktikan kelas tidak diakhiri sebelum final transcript tersimpan, termasuk retry saat penyimpanan gagal.
- Typecheck, Prettier untuk file yang diubah pada optimasi ini, dan `git diff --check` lulus.
- `npm.cmd run cf:build` lulus di Windows; `.open-next/worker.js` terbentuk.
- Preview workerd lokal: login 200, icon.png 200, health 200 dengan provider deepgram, API courses tanpa akun 401, halaman sesi tanpa akun 307 ke login.

## Ukuran hasil build

Handler utama `.open-next/server-functions/default/handler.mjs` turun dari **6.468.455** menjadi **5.664.786 byte** (sekitar **12,4%**). Total file JS dalam direktori server-function turun dari 22.126.064 menjadi 20.635.836 byte. Ini ukuran artefak, bukan hasil pengukuran CPU produksi atau ukuran gzip deploy.

## Batas hasil

Jalur transcript tidak diberi penundaan tambahan. Latensi nyata tetap dipengaruhi koneksi, provider, dan resource server; pengujian browser memakai fixture lokal dan bukan klaim latensi cloud nol. Replikasi Supabase tetap harus aktif agar notifikasi realtime tersedia; polling 7 detik tetap menjadi fallback.

Perubahan mengurangi pemuatan dan request yang tidak diperlukan, tetapi **belum membuktikan Error 1102 hilang pada Workers Free**. Ukur ulang CPU dan error produksi sesudah deployment. Bila masih melewati limit, perlu profil lanjutan atau evaluasi hosting/paket dengan persetujuan pengguna.

Untuk menerapkan perubahan lokal: `npm.cmd run cf:deploy`. Scheduler tidak berubah, sehingga tidak perlu deploy scheduler untuk perubahan ini.
