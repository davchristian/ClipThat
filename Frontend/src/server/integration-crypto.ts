import { required } from "./config";
import { ApiError } from "./http";
const encoder = new TextEncoder();
async function key() {
  const secret = required("INTEGRATION_ENCRYPTION_KEY");
  if (!/^[a-fA-F0-9]{64}$/.test(secret))
    throw new ApiError(503, "invalid_config", "Koneksi kalender belum dikonfigurasi.");
  return crypto.subtle.importKey("raw", Buffer.from(secret, "hex"), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}
export async function seal(value: unknown, purpose: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(purpose) },
    await key(),
    encoder.encode(JSON.stringify(value)),
  );
  return `${Buffer.from(iv).toString("base64url")}.${Buffer.from(bytes).toString("base64url")}`;
}
export async function unseal<T>(value: string, purpose: string): Promise<T> {
  if (value.length > 60000)
    throw new ApiError(400, "invalid_state", "Koneksi tidak valid. Hubungkan kembali akun.");
  try {
    const [nonce, ciphertext, extra] = value.split(".");
    if (!nonce || !ciphertext || extra) throw Error();
    const bytes = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: Buffer.from(nonce, "base64url"),
        additionalData: encoder.encode(purpose),
      },
      await key(),
      Buffer.from(ciphertext, "base64url"),
    );
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    throw new ApiError(400, "invalid_state", "Koneksi tidak valid. Hubungkan kembali akun.");
  }
}
