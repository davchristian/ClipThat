import type { Lesson } from "@/lib/types";

export const topicNotes: Record<string, { title: string; body: string; formula?: string }[]> = {
  aljabar: [
    {
      title: "Apa itu transformasi linear?",
      body: "Pemetaan dari satu ruang vektor ke ruang vektor lain yang mempertahankan penjumlahan dan perkalian skalar.",
      formula: "T(u + v) = T(u) + T(v)",
    },
    {
      title: "Dari vektor ke matriks",
      body: "Petakan setiap vektor basis, lalu susun hasilnya sebagai kolom matriks. Dengan begitu, transformasi bisa ditulis sebagai perkalian matriks.",
      formula: "T(x) = Ax",
    },
    {
      title: "Kernel dan image",
      body: "Kernel memuat vektor yang dipetakan ke nol. Image memuat seluruh hasil yang dapat dicapai oleh transformasi.",
    },
  ],
  algoritma: [
    {
      title: "Mulai dari kasus terkecil",
      body: "Fungsi rekursif membutuhkan base case agar pemanggilan berhenti. Kerjakan kasus sederhana terlebih dahulu.",
    },
    {
      title: "Pecah, selesaikan, gabungkan",
      body: "Divide and conquer membagi persoalan menjadi submasalah yang lebih kecil, kemudian menggabungkan jawabannya.",
      formula: "T(n) = 2T(n/2) + O(n)",
    },
    {
      title: "Mengukur kompleksitas",
      body: "Jumlah pemanggilan dan pekerjaan di setiap tingkat menentukan total waktu eksekusi.",
    },
  ],
  statistika: [
    {
      title: "Variabel acak",
      body: "Variabel acak menghubungkan hasil percobaan dengan sebuah nilai numerik.",
    },
    {
      title: "Distribusi peluang",
      body: "Setiap kemungkinan nilai memiliki probabilitas. Jumlah seluruh probabilitas pada distribusi diskret adalah satu.",
      formula: "Σ P(X = x) = 1",
    },
    {
      title: "Nilai harapan",
      body: "Nilai harapan adalah rata-rata tertimbang dari seluruh kemungkinan hasil.",
      formula: "E[X] = Σ x · P(X = x)",
    },
  ],
  basisdata: [
    {
      title: "Relasi antar entitas",
      body: "Relasi menghubungkan entitas melalui primary key dan foreign key.",
    },
    {
      title: "Mengurangi redundansi",
      body: "Normalisasi memisahkan data berdasarkan ketergantungan agar perubahan tidak menghasilkan inkonsistensi.",
    },
    {
      title: "Bentuk normal ketiga",
      body: "Atribut non-key bergantung pada key, seluruh key, dan tidak pada atribut non-key lainnya.",
    },
  ],
};

export function notesForLesson(lesson: Lesson) {
  if (lesson.id === "basis-04")
    return [
      {
        title: "Bebas linear",
        body: "Sebuah himpunan bebas linear jika tidak ada vektor di dalamnya yang dapat ditulis sebagai kombinasi vektor lainnya.",
      },
      {
        title: "Basis sebuah ruang",
        body: "Basis adalah himpunan vektor yang bebas linear dan membangun seluruh ruang. Setiap vektor memiliki koordinat unik terhadap basis itu.",
        formula: "v = c₁b₁ + c₂b₂ + … + cₙbₙ",
      },
      {
        title: "Dimensi",
        body: "Dimensi menyatakan banyaknya vektor dalam sebuah basis. Semua basis untuk ruang yang sama memiliki jumlah vektor yang sama.",
      },
    ];
  return topicNotes[lesson.courseId] || topicNotes.aljabar;
}
