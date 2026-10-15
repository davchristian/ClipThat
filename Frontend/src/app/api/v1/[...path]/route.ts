import { dispatch } from "@/server/router";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  return dispatch(request, (await context.params).path);
}
export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
