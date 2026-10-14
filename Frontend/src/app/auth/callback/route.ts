import { sessionDb } from "@/server/db";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (code) {
    try {
      const db = await sessionDb();
      const { error } = await db.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL("/", request.url));
    } catch {
      /* Return to login with no tokens in the redirect. */
    }
  }
  return NextResponse.redirect(new URL("/login?confirmation=failed", request.url));
}
