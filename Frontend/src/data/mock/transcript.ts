import type { Segment } from "@/lib/types";

export const transcript: Segment[] = [
  {
    id: "t1",
    time: 960,
    text: "Kita sudah membahas basis dan dimensi di pertemuan sebelumnya. Hari ini kita pakai konsep itu untuk memahami transformasi linear.",
    topic: "Mengingat basis",
  },
  {
    id: "t2",
    time: 990,
    text: "Bayangkan sebuah vektor sebagai anak panah. Transformasi memetakan anak panah itu ke posisi atau arah yang baru.",
    topic: "Gambaran transformasi",
  },
  {
    id: "t3",
    time: 1020,
    text: "Sebuah transformasi disebut linear jika memenuhi dua sifat: T(u + v) = T(u) + T(v), dan T(cv) = cT(v).",
    topic: "Sifat transformasi linear",
  },
  {
    id: "t-kernel",
    time: 1035,
    text: "Ada yang tanya bedanya kernel dengan vektor nol. Vektor nol itu satu vektor, sedangkan kernel adalah himpunan semua vektor yang dipetakan menjadi vektor nol oleh transformasi.",
    topic: "Kernel dan vektor nol",
  },
  {
    id: "t4",
    time: 1065,
    text: "Untuk mencari matriks transformasi, cukup lihat ke mana setiap vektor basis dipetakan. Hasilnya menjadi kolom-kolom matriks kita.",
    topic: "Representasi matriks",
  },
  {
    id: "t5",
    time: 1100,
    text: "Contohnya, kalau T(e₁) = (2, 1) dan T(e₂) = (0, 3), kolom pertama matriksnya adalah (2, 1), dan kolom kedua (0, 3).",
    topic: "Contoh matriks",
  },
];

// Contoh ujaran kelas yang belum disunting menjadi rangkuman.
export const transcriptByLesson: Record<string, Segment[]> = {
  "linear-05": transcript,
  "basis-04": [
    {
      id: "b1",
      time: 780,
      topic: "Bebas linear",
      text: "Kita mulai dari dua vektor ini dulu, ya. Kalau yang satu bisa dibikin dari kelipatan yang lain, berarti himpunannya tidak bebas linear.",
    },
    {
      id: "b2",
      time: 900,
      topic: "Basis sebuah ruang",
      text: "Sekarang cek dua syarat basis. Dia harus bebas linear, lalu harus bisa membangun semua vektor di ruang itu. Coba lihat contoh di papan.",
    },
    {
      id: "b3",
      time: 1080,
      topic: "Menentukan basis",
      text: "Nah, yang ini sering bikin tertukar. Tiga vektor belum tentu jadi basis ruang tiga dimensi kalau ternyata salah satunya bergantung pada yang lain.",
    },
    {
      id: "b4",
      time: 1260,
      topic: "Dimensi",
      text: "Kalau sudah dapat basisnya, tinggal hitung jumlah vektornya. Itulah dimensinya. Minggu depan konsep ini kita pakai lagi untuk transformasi linear.",
    },
  ],
  "stat-03": [
    {
      id: "s1",
      time: 660,
      topic: "Variabel acak",
      text: "Misalnya kita lempar dadu. Hasil satu sampai enam itu kita beri nilai lewat variabel acak X. Jadi X ini bukan satu angka tetap.",
    },
    {
      id: "s2",
      time: 840,
      topic: "Distribusi peluang",
      text: "Untuk kasus diskret, tulis tiap nilai yang mungkin, lalu peluangnya. Jangan lupa kalau dijumlah semuanya hasilnya satu.",
    },
    {
      id: "s3",
      time: 1050,
      topic: "Nilai harapan",
      text: "Sekarang kalikan setiap nilai dengan peluangnya, baru jumlahkan. Itu yang kita sebut nilai harapan, bukan hasil yang pasti muncul.",
    },
  ],
  "db-04": [
    {
      id: "d1",
      time: 720,
      topic: "Relasi antar entitas",
      text: "Coba lihat tabel mahasiswa dan kelas. Kita perlu penghubung supaya tahu mahasiswa yang mana ikut kelas yang mana.",
    },
    {
      id: "d2",
      time: 900,
      topic: "Foreign key",
      text: "ID dari tabel asal itu dipakai sebagai foreign key di sini. Jadi kita tidak perlu menyalin seluruh data mahasiswa berkali-kali.",
    },
    {
      id: "d3",
      time: 1110,
      topic: "Normalisasi",
      text: "Kalau nama dosen ditulis berulang di setiap baris, sekali berubah kita harus perbaiki banyak tempat. Itu sebabnya data kita pisahkan.",
    },
  ],
};
