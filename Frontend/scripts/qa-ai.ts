import { loadEnvConfig } from "@next/env";
import { writeFileSync } from "node:fs";
import { createLessonResult, type SourceSegment } from "../src/server/ai";
import { ApiError } from "../src/server/http";

loadEnvConfig(process.cwd());
const source = (text: string, index: number): SourceSegment => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  start_seconds: index * 15,
  end_seconds: (index + 1) * 15,
  text,
});
const cases = [
  {
    name: "chapter_summary_and_section_links",
    speech: [
      "Bab pertama adalah Matriks. Subbab definisi: matriks merupakan susunan bilangan dalam baris dan kolom.",
      "Masih bab Matriks, subbab matriks identitas memiliki satu pada diagonal utama dan nol di tempat lain.",
      "Bab kedua adalah Determinan. Determinan matriks dua kali dua adalah ad dikurangi bc.",
    ],
    expected: "two chapter nodes, combined matrices summary and subsection source links",
    check: (r: Awaited<ReturnType<typeof createLessonResult>>) => {
      const chapter = r.graph.nodes.find((node) => /matriks/i.test(node.title));
      return (
        r.graph.nodes.length === 2 &&
        Boolean(
          chapter &&
          /baris|kolom/i.test(chapter.description) &&
          /identitas|diagonal/i.test(chapter.description) &&
          (chapter.sections?.length || 0) >= 2,
        )
      );
    },
  },
  {
    name: "mixed_material_quiz_offtopic",
    speech: [
      "Matriks identitas memiliki angka satu pada diagonal utama dan nol pada posisi lainnya.",
      "Minggu depan hari Selasa ada kuis matriks.",
      "Kemarin saya liburan ke pantai bersama keluarga dan makan ikan bakar.",
    ],
    expected: "notes include matrices, exclude holiday; quiz 2026-10-20",
    check: (r: Awaited<ReturnType<typeof createLessonResult>>) =>
      r.notes.length > 0 &&
      !/pantai|ikan bakar|liburan/i.test(JSON.stringify(r.notes)) &&
      r.agenda.some((a) => a.kind === "Kuis" && a.due_at?.startsWith("2026-10-20")),
  },
  {
    name: "offtopic_only",
    speech: [
      "Kemarin saya liburan ke pantai bersama keluarga dan makan ikan bakar. Cuaca cerah sekali.",
    ],
    expected: "notes and graph and agenda empty",
    check: (r: Awaited<ReturnType<typeof createLessonResult>>) =>
      !r.notes.length && !r.graph.nodes.length && !r.agenda.length,
  },
  {
    name: "unclear_date",
    speech: ["Akan ada ujian matriks, tapi tanggalnya belum ditentukan. Nanti saya kabari lagi."],
    expected: "one exam draft with no invented date",
    check: (r: Awaited<ReturnType<typeof createLessonResult>>) =>
      r.agenda.length === 1 && r.agenda[0].kind === "Ujian" && r.agenda[0].due_at === null,
  },
  {
    name: "revised_schedule",
    speech: [
      "Minggu depan hari Selasa ada kuis matriks.",
      "Saya revisi, kuis matriks bukan Selasa. Kuis matriks dipindah ke hari Rabu minggu depan pukul sembilan pagi.",
    ],
    expected: "one quiz on 2026-10-21 at 09:00 Jakarta",
    check: (r: Awaited<ReturnType<typeof createLessonResult>>) =>
      r.agenda.length === 1 && r.agenda[0].due_at === "2026-10-21T09:00:00+07:00",
  },
  {
    name: "historical_hypothetical",
    speech: [
      "Tahun lalu saya memberi ujian hari Selasa. Kalau misalnya ada kuis besok, kalian tentu harus belajar. Itu hanya contoh, besok tidak ada kuis.",
    ],
    expected: "no agenda",
    check: (r: Awaited<ReturnType<typeof createLessonResult>>) => !r.agenda.length,
  },
];
async function main() {
  const results = [];
  for (const item of cases) {
    console.log(`START ${item.name}`);
    try {
      const result = await createLessonResult(
        { title: "Matriks", starts_at: "2026-10-16T09:00:00+07:00" },
        item.speech.map(source),
      );
      const pass = item.check(result);
      results.push({ name: item.name, expected: item.expected, pass, result });
      console.log(`${pass ? "PASS" : "FAIL"} ${item.name}`);
    } catch (e) {
      results.push({
        name: item.name,
        expected: item.expected,
        pass: false,
        error:
          e instanceof ApiError
            ? { code: e.code, message: e.message }
            : { code: "unexpected_error" },
      });
      console.log(`FAIL ${item.name}: ${e instanceof ApiError ? e.code : "unexpected_error"}`);
    }
    writeFileSync(
      `${process.env.QA_OUTPUT_DIR || "docs/qa/2026-10-16"}/ai-real-results.json`,
      JSON.stringify(results, null, 2),
    );
  }
  if (results.some((r) => !r.pass)) process.exitCode = 1;
}
void main();
