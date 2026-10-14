import { courseFor } from "@/data";
import type { DemoState } from "@/lib/types";

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  kind: "agenda" | "review" | "summary" | "questions";
  label: string;
};

export function getNotifications(data: DemoState): AppNotification[] {
  const latestDone = [...data.lessons].reverse().find((lesson) => lesson.status === "done");

  if (data.role === "lecturer") {
    const lessons = data.lessons.filter((lesson) => lesson.courseId === "aljabar");
    const live = lessons.find((lesson) => lesson.status === "live");
    const latestCourseLesson = [...lessons].reverse().find((lesson) => lesson.status === "done");
    const unanswered = data.questions.filter((item) => !item.oral);
    const notifications: AppNotification[] = [];

    if (unanswered.length && lessons.length)
      notifications.push({
        id: `lecturer:questions:${unanswered.map((item) => item.id).join(",")}`,
        title: `${unanswered.length} pertanyaan menunggu jawaban`,
        detail: "Lihat pertanyaan yang paling banyak didukung murid.",
        href: `/session/${live?.id || lessons[0]?.id}?tab=questions`,
        kind: "questions",
        label: "Perlu dijawab",
      });
    if (latestCourseLesson)
      notifications.push({
        id: `lecturer:summary:${latestCourseLesson.id}`,
        title: `Hasil ${latestCourseLesson.title} siap ditinjau`,
        detail: "Periksa ringkasan dan peta konsep kelas.",
        href: `/session/${latestCourseLesson.id}?tab=notes`,
        kind: "summary",
        label: "Rangkuman",
      });
    return notifications;
  }

  const notifications: AppNotification[] = [];
  const classAgenda = data.agenda.filter(
    (item) => item.confirmed && item.sourceSessionId && !item.done,
  );
  const savedToReview = data.saved.filter((item) => !item.reviewed);

  if (classAgenda.length)
    notifications.push({
      id: `student:agenda:${classAgenda.map((item) => item.id).join(",")}`,
      title: `${classAgenda.length} agenda dari kelas sudah tersimpan`,
      detail: "Lihat jadwal tugas dan kuis yang dibahas di kelas.",
      href: "/agenda",
      kind: "agenda",
      label: "Agenda kelas",
    });
  if (savedToReview.length) {
    const lesson = data.lessons.find((item) => item.id === savedToReview[0].sessionId);
    notifications.push({
      id: `student:review:${savedToReview.map((item) => item.id).join(",")}`,
      title: `${savedToReview.length} bagian ingin kamu ulangi`,
      detail: "Buka penanda, capture, dan foto di course asalnya.",
      href: `/classes/${courseFor(lesson?.courseId || "aljabar").id}`,
      kind: "review",
      label: "Untuk dipelajari",
    });
  }
  if (latestDone)
    notifications.push({
      id: `student:summary:${latestDone.id}`,
      title: `Rangkuman ${latestDone.title} tersedia`,
      detail: "Baca inti kelas dan kaitannya dengan materi sebelumnya.",
      href: `/session/${latestDone.id}?tab=notes`,
      kind: "summary",
      label: "Rangkuman baru",
    });
  return notifications;
}
