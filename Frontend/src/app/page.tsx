"use client";
import { liveMode } from "@/lib/app-mode";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useContent } from "@/data/use-content";
import { getNotifications } from "./components/notification-model";
import { Breadcrumbs, PageHeading, SectionTitle } from "@/components/ui";
import { useApp } from "@/state/app-provider";
import { HomeCalendar, type HomeCalendarEvent } from "./components/home-calendar";
import { NotificationStrip } from "./components/notifications";
import { SessionEntry } from "./classes/components/session-entry";
import { CourseCard } from "./components/course-card";

export default function Home() {
  const { courses, courseFor } = useContent();
  const { data } = useApp();
  const lecturer = data.role === "lecturer";
  const notifications = getNotifications(data);
  const lessons = data.lessons.filter(
    (lesson) => liveMode || !lecturer || lesson.courseId === "aljabar",
  );
  const live = lessons.find((lesson) => lesson.status === "live");
  const visibleCourses = courses.filter(
    (course) => liveMode || !lecturer || course.id === "aljabar",
  );
  const calendarEvents: HomeCalendarEvent[] = lecturer
    ? lessons.map((lesson) => ({
        id: lesson.id,
        date: lesson.date,
        title: lesson.title,
        kind: "Kelas",
        courseName: courseFor(lesson.courseId).name,
        href: `/classes/${lesson.courseId}`,
      }))
    : data.agenda
        .filter((item) => item.confirmed)
        .map((item) => ({
          id: item.id,
          date: item.date,
          title: item.title,
          kind: item.kind,
          courseName: courseFor(item.courseId).name,
          href: `/classes/${item.courseId}`,
        }));
  return (
    <div className="home-page">
      <Breadcrumbs items={[]} />
      <PageHeading
        action={lecturer ? <SessionEntry /> : undefined}
        title={
          data.profile
            ? `Selamat datang, ${data.profile.name.split(" ")[0]}!`
            : lecturer
              ? "Selamat datang, Bu Nadia!"
              : "Selamat datang, Davin!"
        }
      />
      <NotificationStrip
        notifications={notifications}
        handledIds={data.handledNotifications || []}
      />

      <div className="home-columns">
        <section>
          <SectionTitle
            action={
              <Link className="text-button" href="/classes">
                Semua course <ArrowRight size={14} />
              </Link>
            }
          >
            Course
          </SectionTitle>
          <div className="home-course-list">
            {visibleCourses.map((course) => (
              <CourseCard
                course={course}
                liveLesson={lessons.find(
                  (lesson) => lesson.courseId === course.id && lesson.status === "live",
                )}
                key={course.id}
              />
            ))}
          </div>
        </section>
        <section>
          <SectionTitle
            action={
              !lecturer && (
                <Link className="text-button" href="/agenda">
                  Buka agenda <ArrowRight size={14} />
                </Link>
              )
            }
          >
            Kalender
          </SectionTitle>
          <HomeCalendar
            key={lecturer ? "lecturer" : "student"}
            events={calendarEvents}
            initialDate={lecturer ? live?.date || lessons[0]?.date || "2026-10-05" : "2026-10-08"}
          />
        </section>
      </div>
    </div>
  );
}
