import { NextResponse } from "next/server";
import { setting } from "@/server/config";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const origin = setting("APP_URL") || new URL(request.url).origin;
  return NextResponse.redirect(new URL("/profile", origin));
}
