import { NextResponse } from "next/server";
import { authenticated } from "@/server/db";
import { finishCalendarOAuth } from "@/server/calendar";
import { providerSchema } from "@/server/calendar-providers";
import { setting } from "@/server/config";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const origin = setting("APP_URL") || new URL(request.url).origin;
  try {
    const provider = providerSchema.parse((await context.params).provider);
    const { user } = await authenticated();
    await finishCalendarOAuth(request, user.id, provider);
    return NextResponse.redirect(new URL("/settings?integration=connected", origin));
  } catch {
    return NextResponse.redirect(new URL("/settings?integration=failed", origin));
  }
}
