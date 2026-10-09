import { CoursesView } from "@/features/classes/course-list";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CoursesView courseId={id} />;
}
