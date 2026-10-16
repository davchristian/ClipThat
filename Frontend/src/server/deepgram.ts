import { z } from "zod";
import { required } from "./config";
import { ApiError } from "./http";

export async function deepgramToken(fetcher: typeof fetch = fetch) {
  const response = await fetcher("https://api.deepgram.com/v1/auth/grant", {
    method: "POST",
    headers: { Authorization: `Token ${required("DEEPGRAM_API_KEY")}` },
    signal: AbortSignal.timeout(15000),
  }).catch(() => {
    throw new ApiError(502, "deepgram_unavailable", "Tidak bisa menghubungi Deepgram. Coba lagi.");
  });
  if (!response.ok)
    throw new ApiError(
      response.status === 429 ? 429 : 503,
      "deepgram_access",
      response.status === 401 || response.status === 403
        ? "Periksa DEEPGRAM_API_KEY dan izin Member pada key Deepgram."
        : "Deepgram belum bisa membuka sesi. Periksa kredit dan batas penggunaan proyek.",
    );
  const result = z
    .object({ access_token: z.string().min(1), expires_in: z.number().positive() })
    .safeParse(await response.json());
  if (!result.success)
    throw new ApiError(502, "deepgram_token", "Token sementara Deepgram belum valid.");
  return result.data;
}
