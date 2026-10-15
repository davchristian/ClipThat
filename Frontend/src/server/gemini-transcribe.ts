import { Buffer } from "node:buffer";
import { z } from "zod";
import { checkGeminiResponse } from "./ai";
import { required } from "./config";
import { ApiError } from "./http";

const interactionSchema = z.object({
  status: z.literal("completed"),
  steps: z
    .array(
      z.object({
        type: z.string(),
        content: z
          .array(
            z
              .object({ type: z.string(), text: z.string().optional() })
              .refine((content) => content.type !== "text" || typeof content.text === "string"),
          )
          .optional(),
      }),
    )
    .default([]),
});

export async function geminiTranscribe(
  file: File,
  offset: number,
  duration: number,
  fetcher: typeof fetch,
) {
  // Dedicated speech models use Interactions, without prompts or a JSON generation schema.
  const response = await fetcher("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": required("GEMINI_API_KEY") },
    signal: AbortSignal.timeout(90000),
    body: JSON.stringify({
      model: "gemini-3.5-transcribe",
      input: [
        {
          type: "audio",
          mime_type:
            file.type.split(";")[0] === "audio/mp4" ? "audio/m4a" : file.type.split(";")[0],
          data: Buffer.from(await file.arrayBuffer()).toString("base64"),
        },
      ],
      store: false,
    }),
  }).catch(() => {
    throw new ApiError(
      502,
      "transcription_unavailable",
      "Transkripsi gagal. Coba kirim ulang potongan audio.",
    );
  });
  checkGeminiResponse(response, "gemini-3.5-transcribe");
  try {
    const interaction = interactionSchema.parse(await response.json());
    const text = interaction.steps
      .filter((step) => step.type === "model_output")
      .flatMap((step) => step.content || [])
      .filter((content) => content.type === "text")
      .map((content) => content.text || "")
      .join(" ")
      .trim();
    if (text.length > 10000) throw new Error("Transcript too long");
    // Use the measured audio chunk range; no invented word-level timestamps.
    return text ? [{ start: offset, end: offset + duration, text }] : [];
  } catch {
    throw new ApiError(
      502,
      "invalid_ai_result",
      "Hasil transkripsi Gemini belum valid. Coba kirim ulang potongan audio.",
    );
  }
}
