import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isSupabaseUrl, supabaseConfigError } from "../lib/supabase-config";

export function setting(name: string): string {
  if (process.env[name]) return process.env[name]!;
  try {
    return String((getCloudflareContext().env as unknown as Record<string, unknown>)[name] || "");
  } catch {
    return "";
  }
}
export function required(name: string) {
  const value = setting(name);
  if (!value) throw new ConfigError(name);
  return value;
}
export class ConfigError extends Error {
  constructor(
    readonly settingName: string,
    message = "Layanan belum dikonfigurasi. Ikuti docs/backend-setup.md.",
  ) {
    super(message);
  }
}
export function supabaseUrl() {
  const url = setting("NEXT_PUBLIC_SUPABASE_URL").trim();
  if (!isSupabaseUrl(url))
    throw new ConfigError("NEXT_PUBLIC_SUPABASE_URL", supabaseConfigError(url, ""));
  return url;
}
export function publicConfig() {
  const url = supabaseUrl();
  const key = setting("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY").trim();
  const error = supabaseConfigError(url, key);
  if (error) throw new ConfigError("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", error);
  return { url, key };
}
