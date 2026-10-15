import { getCloudflareContext } from "@opennextjs/cloudflare";

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
  constructor(readonly settingName: string) {
    super("Layanan belum dikonfigurasi. Ikuti docs/backend-setup.md.");
  }
}
export function publicConfig() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    key: required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  };
}
