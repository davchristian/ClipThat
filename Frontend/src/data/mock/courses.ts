import type { Course } from "@/lib/types";

export const courses: Course[] = [
  {
    id: "aljabar",
    name: "Aljabar Linear",
    code: "IF2123",
    teacher: "Dr. Nadia Putri",
    color: "sage",
    glyph: "∑",
    days: "Senin & Kamis",
    scheduleTime: "09.00–10.30",
  },
  {
    id: "algoritma",
    name: "Algoritma & Pemrograman",
    code: "IF2110",
    teacher: "Dr. Bima Pratama",
    color: "peach",
    glyph: "{ }",
    days: "Senin & Rabu",
    scheduleTime: "13.00–14.40",
  },
  {
    id: "statistika",
    name: "Probabilitas & Statistika",
    code: "IF2220",
    teacher: "Dr. Laras Utami",
    color: "blue",
    glyph: "σ",
    days: "Selasa & Jumat",
    scheduleTime: "10.00–11.30",
  },
  {
    id: "basisdata",
    name: "Basis Data",
    code: "IF2240",
    teacher: "Dr. Arif Rahman",
    color: "sand",
    glyph: "⊞",
    days: "Rabu & Jumat",
    scheduleTime: "14.00–15.30",
  },
];

export function courseFor(id: string) {
  return courses.find((c) => c.id === id) || courses[0];
}
