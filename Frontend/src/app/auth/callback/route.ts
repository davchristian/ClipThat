import { sessionDb } from "@/server/db";
import { setting } from "@/server/config";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const origin = setting("APP_URL") || new URL(request.url).origin;
  const code = new URL(request.url).searchParams.get("code");
  if (code) {
    try {
      const db = await sessionDb();
      const { error } = await db.auth.exchangeCodeForSession(code);
      if (!error) {
        const {
          data: { user },
        } = await db.auth.getUser();
        const { data: profile } = await db
          .from("profiles")
          .select("onboarded")
          .eq("id", user!.id)
          .single();
        return NextResponse.redirect(
          new URL(profile?.onboarded === false ? "/onboarding" : "/", origin),
        );
      }
    } catch {
      /* Return to login with no tokens in the redirect. */
    }
  }
  return NextResponse.redirect(new URL("/login?confirmation=failed", origin));
}
