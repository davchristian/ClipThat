export function isSupabaseUrl(value: string | undefined): boolean {
  if (!value || !/^https?:\/\//i.test(value.trim())) return false;
  try {
    const url = new URL(value.trim());
    return !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function supabaseConfigError(url: string | undefined, key: string | undefined): string {
  if (!isSupabaseUrl(url))
    return "NEXT_PUBLIC_SUPABASE_URL belum valid. Isi Project URL dari Supabase → Connect, misalnya https://PROJECT.supabase.co, lalu restart server.";
  if (!key?.trim())
    return "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi. Salin publishable key proyek Supabase, lalu restart server.";
  return "";
}
