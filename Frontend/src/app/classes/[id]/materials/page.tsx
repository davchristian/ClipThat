import { CourseMaterials } from "../../components/course-materials";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseMaterials courseId={id} />;
}
