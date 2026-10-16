import { required } from "@/server/config";
import { failure, json, ApiError } from "@/server/http";
import { processOneJob } from "@/server/jobs";
import { processCalendarJob } from "@/server/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization") || "";
    const expected = `Bearer ${required("JOB_RUNNER_SECRET")}`;
    const [a, b] = await Promise.all(
      [token, expected].map((s) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))),
    );
    if (new Uint8Array(a).some((v, i) => v !== new Uint8Array(b)[i]))
      throw new ApiError(401, "unauthenticated", "Akses tidak diizinkan.");
    const study = await processOneJob();
    const calendar = await processCalendarJob();
    return json({
      processed: study.processed || calendar.processed,
      status: calendar.processed ? calendar.status : study.status,
      study,
      calendar,
    });
  } catch (error) {
    return failure(error);
  }
}
