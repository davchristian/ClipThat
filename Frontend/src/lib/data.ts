export type Role = "student" | "lecturer";
export type LessonStatus = "live" | "upcoming" | "processing" | "done";
export type Course = { id: string; name: string; code: string; teacher: string; color: string; glyph: string; days: string };
export type Lesson = { id: string; courseId: string; title: string; number: number; date: string; time: string; status: LessonStatus; code: string; duration: string };
export const courses: Course[] = [
  { id: "aljabar", name: "Aljabar Linear", code: "IF2123", teacher: "Dr. Nadia Putri", color: "sage", glyph: "∑", days: "Senin & Kamis" },
  { id: "algoritma", name: "Algoritma & Pemrograman", code: "IF2110", teacher: "Dr. Bima Pratama", color: "peach", glyph: "{ }", days: "Senin & Rabu" },
  { id: "statistika", name: "Probabilitas & Statistika", code: "IF2220", teacher: "Dr. Laras Utami", color: "blue", glyph: "σ", days: "Selasa & Jumat" },
  { id: "basisdata", name: "Basis Data", code: "IF2240", teacher: "Dr. Arif Rahman", color: "sand", glyph: "⊞", days: "Rabu & Jumat" },
];
export const initialLessons: Lesson[] = [
  { id: "linear-05", courseId: "aljabar", title: "Transformasi linear", number: 5, date: "2026-10-05", time: "09:00", status: "live", code: "ALG05", duration: "90 menit" },
  { id: "algoritma-06", courseId: "algoritma", title: "Rekursi & divide and conquer", number: 6, date: "2026-10-05", time: "13:00", status: "upcoming", code: "ALGO06", duration: "100 menit" },
  { id: "basis-04", courseId: "aljabar", title: "Basis dan dimensi", number: 4, date: "2026-10-01", time: "09:00", status: "done", code: "ALG04", duration: "86 menit" },
  { id: "stat-03", courseId: "statistika", title: "Distribusi probabilitas", number: 3, date: "2026-10-02", time: "10:00", status: "done", code: "STAT03", duration: "92 menit" },
  { id: "db-04", courseId: "basisdata", title: "Relasi dan normalisasi", number: 4, date: "2026-10-02", time: "14:00", status: "done", code: "DB04", duration: "80 menit" },
];
export type Segment = { id: string; time: number; text: string; topic: string };
export const transcript: Segment[] = [
  { id: "t1", time: 960, text: "Kita sudah membahas basis dan dimensi di pertemuan sebelumnya. Hari ini kita pakai konsep itu untuk memahami transformasi linear.", topic: "Mengingat basis" },
  { id: "t2", time: 990, text: "Bayangkan sebuah vektor sebagai anak panah. Transformasi memetakan anak panah itu ke posisi atau arah yang baru.", topic: "Gambaran transformasi" },
  { id: "t3", time: 1020, text: "Sebuah transformasi disebut linear jika memenuhi dua sifat: T(u + v) = T(u) + T(v), dan T(cv) = cT(v).", topic: "Sifat transformasi linear" },
  { id: "t4", time: 1065, text: "Untuk mencari matriks transformasi, cukup lihat ke mana setiap vektor basis dipetakan. Hasilnya menjadi kolom-kolom matriks kita.", topic: "Representasi matriks" },
  { id: "t5", time: 1100, text: "Contohnya, kalau T(e₁) = (2, 1) dan T(e₂) = (0, 3), kolom pertama matriksnya adalah (2, 1), dan kolom kedua (0, 3).", topic: "Contoh matriks" },
];
export function seconds(value: number) { return Math.floor(value / 60).toString().padStart(2, "0") + ":" + (value % 60).toString().padStart(2, "0"); }
export function dateLabel(date: string, long = false) { return new Date(date + "T12:00:00").toLocaleDateString("id-ID", { day: "numeric", month: long ? "long" : "short" }); }
export function courseFor(id: string) { return courses.find(c => c.id === id) || courses[0]; }
export const topicNotes: Record<string, { title: string; body: string; formula?: string }[]> = {
  aljabar: [
    { title: "Apa itu transformasi linear?", body: "Pemetaan dari satu ruang vektor ke ruang vektor lain yang mempertahankan penjumlahan dan perkalian skalar.", formula: "T(u + v) = T(u) + T(v)" },
    { title: "Dari vektor ke matriks", body: "Petakan setiap vektor basis, lalu susun hasilnya sebagai kolom matriks. Dengan begitu, transformasi bisa ditulis sebagai perkalian matriks.", formula: "T(x) = Ax" },
    { title: "Kernel dan image", body: "Kernel memuat vektor yang dipetakan ke nol. Image memuat seluruh hasil yang dapat dicapai oleh transformasi." },
  ],
  algoritma: [
    { title: "Mulai dari kasus terkecil", body: "Fungsi rekursif membutuhkan base case agar pemanggilan berhenti. Kerjakan kasus sederhana terlebih dahulu." },
    { title: "Pecah, selesaikan, gabungkan", body: "Divide and conquer membagi persoalan menjadi submasalah yang lebih kecil, kemudian menggabungkan jawabannya.", formula: "T(n) = 2T(n/2) + O(n)" },
    { title: "Mengukur kompleksitas", body: "Jumlah pemanggilan dan pekerjaan di setiap tingkat menentukan total waktu eksekusi." },
  ],
  statistika: [
    { title: "Variabel acak", body: "Variabel acak menghubungkan hasil percobaan dengan sebuah nilai numerik." },
    { title: "Distribusi peluang", body: "Setiap kemungkinan nilai memiliki probabilitas. Jumlah seluruh probabilitas pada distribusi diskret adalah satu.", formula: "Σ P(X = x) = 1" },
    { title: "Nilai harapan", body: "Nilai harapan adalah rata-rata tertimbang dari seluruh kemungkinan hasil.", formula: "E[X] = Σ x · P(X = x)" },
  ],
  basisdata: [
    { title: "Relasi antar entitas", body: "Relasi menghubungkan entitas melalui primary key dan foreign key." },
    { title: "Mengurangi redundansi", body: "Normalisasi memisahkan data berdasarkan ketergantungan agar perubahan tidak menghasilkan inkonsistensi." },
    { title: "Bentuk normal ketiga", body: "Atribut non-key bergantung pada key, seluruh key, dan tidak pada atribut non-key lainnya." },
  ],
};
export type Question = { id: string; sessionId: string; text: string; votes: number; supported: boolean; answer?: string; oral?: boolean; time: string };
export type SavedItem = { id: string; sessionId: string; type: "bookmark" | "capture" | "photo"; title: string; text: string; summary?: string; time: number; end?: number; reviewed: boolean; label?: "Bingung" | "Review nanti"; image?: string; draft?: string };
export type Agenda = { id: string; title: string; date: string; time: string; courseId: string; kind: "Tugas" | "Kuis" | "Belajar"; confirmed: boolean; done: boolean; reminder: boolean; source?: string };
export type DemoState = {
  role: Role; lessons: Lesson[]; questions: Question[]; saved: SavedItem[]; agenda: Agenda[];
  notes: Record<string, string>; archived: { lesson: Lesson; archivedAt: string }[]; materials: Record<string, { id: string; name: string; url: string }[]>;
  graph: { from: number; to: number; relation: string }[];
  graphBySession?: Record<string, { from: number; to: number; relation: string }[]>;
};
export function notesForLesson(lesson: Lesson) {
  if (lesson.id === "basis-04") return [
    { title: "Bebas linear", body: "Sebuah himpunan bebas linear jika tidak ada vektor di dalamnya yang dapat ditulis sebagai kombinasi vektor lainnya." },
    { title: "Basis sebuah ruang", body: "Basis adalah himpunan vektor yang bebas linear dan membangun seluruh ruang. Setiap vektor memiliki koordinat unik terhadap basis itu.", formula: "v = c₁b₁ + c₂b₂ + … + cₙbₙ" },
    { title: "Dimensi", body: "Dimensi menyatakan banyaknya vektor dalam sebuah basis. Semua basis untuk ruang yang sama memiliki jumlah vektor yang sama." },
  ];
  return topicNotes[lesson.courseId] || topicNotes.aljabar;
}
export const initialState: DemoState = {
  role: "student", lessons: initialLessons,
  questions: [
    { id: "q1", sessionId: "linear-05", text: "Kalau basisnya berubah, matriks transformasinya ikut berubah juga?", votes: 8, supported: false, time: "17:45" },
    { id: "q2", sessionId: "linear-05", text: "Apa bedanya kernel dengan vektor nol?", votes: 4, supported: false, time: "16:20", answer: "Vektor nol adalah satu vektor. Kernel adalah himpunan semua vektor yang dipetakan menjadi vektor nol oleh transformasi." },
  ],
  saved: [
    { id: "saved-basis", sessionId: "basis-04", type: "bookmark", title: "Menentukan basis sebuah ruang", text: "Basis adalah himpunan vektor yang bebas linear dan membangun seluruh ruang.", time: 1080, reviewed: false, label: "Bingung" },
    { id: "saved-stat", sessionId: "stat-03", type: "bookmark", title: "Membedakan distribusi peluang", text: "Distribusi diskret digunakan untuk nilai yang dapat dihitung satu per satu.", time: 840, reviewed: false, label: "Review nanti" },
  ],
  agenda: [
    { id: "a1", title: "Kuis transformasi linear", date: "2026-10-08", time: "09:00", courseId: "aljabar", kind: "Kuis", confirmed: true, done: false, reminder: true },
    { id: "a2", title: "Tugas rekursi", date: "2026-10-07", time: "23:59", courseId: "algoritma", kind: "Tugas", confirmed: true, done: false, reminder: true },
    { id: "a3", title: "Review distribusi peluang", date: "2026-10-06", time: "16:00", courseId: "statistika", kind: "Belajar", confirmed: true, done: false, reminder: false },
    { id: "a4", title: "Latihan matriks transformasi", date: "2026-10-09", time: "23:59", courseId: "aljabar", kind: "Tugas", confirmed: false, done: false, reminder: true, source: "Pengumuman kelas · 18:20: “Latihan matriks dikumpulkan Jumat sebelum tengah malam.”" },
  ],
  notes: {}, archived: [], materials: {}, graph: [{ from: 0, to: 1, relation: "prasyarat" }, { from: 1, to: 2, relation: "berkaitan" }],
};
