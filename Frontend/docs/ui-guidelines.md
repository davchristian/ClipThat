# Standar UI ClipThat

Sumber ukuran ada di `src/styles/tokens.css`. Pemetaan jenis teks ada di `src/styles/typography.css`; layout dan tampilan kontrol ada di `src/styles/globals.css`. Halaman autentikasi mengikuti standar yang sama.

## Tipografi

Semua teks memakai **DM Sans Variable** yang disediakan lokal. Ukuran mengikuti peran teks, bukan halaman tempat teks itu muncul.

| Peran              | Desktop | HP (≤620 px) | Bobot | Contoh                                                |
| ------------------ | ------- | ------------ | ----- | ----------------------------------------------------- |
| Judul halaman      | 28 px   | 24 px        | 600   | Kelas, Agenda, topik pertemuan, login/register        |
| Judul bagian/panel | 18 px   | 18 px        | 600   | Ringkasan, Berkas kelas, Peta konsep, Preview capture |
| Judul dialog       | 20 px   | 20 px        | 600   | Gabung kelas, konfirmasi, preview dalam dialog        |
| Judul kartu/subbab | 16 px   | 16 px        | 500   | Mata kuliah, simpanan, agenda, detail konsep          |
| Teks bacaan        | 16 px   | 16 px        | 400   | Transkrip, hasil capture, catatan, pertanyaan         |
| Teks utama         | 14 px   | 14 px        | 400   | Deskripsi singkat dan isi formulir                    |
| Label/kontrol      | 13 px   | 13 px        | 500   | Tab, label form, tautan aksi                          |
| Keterangan         | 12 px   | 12 px        | 400   | Tanggal, sumber, status, petunjuk                     |
| Penanda ringkas    | 11 px   | 11 px        | 400   | Timestamp, badge, hubungan konsep, peran demo         |

Jarak baris: judul **1,3**, teks utama **1,6**, teks bacaan **1,85**, label dan keterangan **1,5**. Judul kecil pada capture dan label pengelompokan agenda memakai label 13 px dengan bobot 600.

Judul kelas yang ditonjolkan di beranda menggunakan peran fitur 24 px (22 px di HP). Slogan halaman autentikasi menggunakan peran display 44 px (36 px di bawah 950 px). Logo memakai ukuran 24 px. Ketiganya memiliki fungsi berbeda dari judul halaman.

Ukuran input naik dari 14 menjadi 16 px di HP agar formulir nyaman dibaca dan tidak memicu zoom otomatis saat mengetik di iOS.

## Kontrol

| Jenis                | Ukuran                                 | Teks        | Pemakaian                                                |
| -------------------- | -------------------------------------- | ----------- | -------------------------------------------------------- |
| `.button`            | Tinggi 44 px, padding horizontal 16 px | 14 px / 600 | Aksi utama dan sekunder                                  |
| `.button.small`      | Tinggi 36 px, padding horizontal 12 px | 13 px / 600 | Aksi tambahan di dalam kartu                             |
| `.icon-button`       | 40 × 40 px                             | Ikon        | Tutup, foto, menu, unduh                                 |
| `.icon-button.small` | 32 × 32 px                             | Ikon        | Bookmark, navigasi minggu, tutup notifikasi              |
| `.icon-button.large` | 44 × 44 px                             | Ikon        | Aksi sejajar dengan tombol biasa, misalnya buang capture |
| `.text-button`       | Tinggi minimum 32 px                   | 13 px / 500 | Aksi ringan dalam konten                                 |

Tombol primer dan sekunder dengan ukuran yang sama memiliki tinggi, ukuran teks, dan radius 8 px yang sama. Lebar mengikuti isi. Jangan mengecilkan tombol per halaman atau hanya karena layar mengecil; atur ulang susunannya jika ruang tidak cukup.

Pengalih peran demo tetap memakai kontrol ringkas 24 px di bawah nama pengguna. Tab kelas memakai empat kolom di HP agar semua bagian terlihat.

## Panel transkrip dan capture

Pada desktop, tinggi preview mengikuti tinggi alami panel transkrip melalui ResizeObserver. Transkrip tidak dipendekkan saat preview dibuka. Tepi atas dan bawah sejajar, dan keduanya mengikuti scroll halaman tanpa salah satu panel menempel sendiri.

Isi transkrip dan isi preview memiliki area scroll masing-masing dengan scroll chaining dibatasi. Header serta tombol aksi tetap berada di luar area isi. Membuka sumber transkrip atau mengedit draf pertanyaan tidak mengubah tinggi panel.

Pada layar ≤1280 px atau tinggi ≤700 px, preview menjadi dialog. Aturan penyamaan tinggi hanya berlaku ketika transkrip dan preview tampil berdampingan; tab lain dan layar kecil tetap memakai susunan konten alaminya.
