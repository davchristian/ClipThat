import { ApiError } from "./http";
import { captureClaimsSchema, type CaptureClaims } from "./schemas";

function encode(bytes: Uint8Array) {
  let binary = "";
  for (let start = 0; start < bytes.length; start += 32768)
    binary += String.fromCharCode(...bytes.subarray(start, start + 32768));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function decode(value: string) {
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
}
async function key(secret: string) {
  if (secret.length < 32)
    throw new ApiError(503, "not_configured", "CAPTURE_SIGNING_SECRET minimal 32 karakter.");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function signCapture(claims: CaptureClaims, secret: string) {
  const payload = encode(
    new TextEncoder().encode(JSON.stringify(captureClaimsSchema.parse(claims))),
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await key(secret),
    new TextEncoder().encode(payload),
  );
  return `${payload}.${encode(new Uint8Array(signature))}`;
}
export async function verifyCapture(
  token: string,
  secret: string,
  userId: string,
  now = Date.now(),
) {
  try {
    if (token.length > 180000) throw Error();
    const [payload, signature, extra] = token.split(".");
    if (
      !payload ||
      !signature ||
      extra ||
      !(await crypto.subtle.verify(
        "HMAC",
        await key(secret),
        decode(signature),
        new TextEncoder().encode(payload),
      ))
    )
      throw Error();
    const claims = captureClaimsSchema.parse(JSON.parse(new TextDecoder().decode(decode(payload))));
    if (
      claims.user_id !== userId ||
      claims.exp <= now ||
      claims.end < claims.start ||
      claims.end - claims.start > 90.001
    )
      throw Error();
    return claims;
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) throw error;
    throw new ApiError(
      422,
      "invalid_capture",
      "Preview kedaluwarsa atau tidak valid. Buat capture lagi.",
    );
  }
}
